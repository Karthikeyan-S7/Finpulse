package com.finpulse.core.service;

import com.finpulse.core.constant.CategoryRegistry;
import com.finpulse.core.dto.BudgetCopyRequest;
import com.finpulse.core.dto.BudgetDto;
import com.finpulse.core.dto.BudgetRequest;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.exception.ResourceNotFoundException;
import com.finpulse.core.model.Budget;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.BudgetRepository;
import com.finpulse.core.repository.TransactionRepository;
import com.finpulse.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, UserRepository userRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<BudgetDto> getBudgets(Long userId, String monthYear) {
        Long resolvedUserId = userId != null ? userId : 1L;
        String resolvedMonthYear = (monthYear != null && !monthYear.isBlank())
                ? monthYear.trim()
                : YearMonth.now().toString();

        YearMonth ym = YearMonth.parse(resolvedMonthYear);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Budget> budgets = budgetRepository.findByUserIdAndMonthYear(resolvedUserId, resolvedMonthYear);

        return budgets.stream()
                .map(b -> toDto(b, resolvedUserId, start, end))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Budget> getBudgetsByUserAndMonth(Long userId, String monthYear) {
        return budgetRepository.findByUserIdAndMonthYear(userId, monthYear);
    }

    public BudgetDto setBudget(BudgetRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        String category = request.getCategory().trim();
        CategoryRegistry.findByName(category).ifPresent(cat -> {
            if (cat.isSystem()) {
                throw new IllegalArgumentException("Cannot create budget for system category: " + category);
            }
        });

        Budget saved = budgetRepository.findByUserIdAndCategoryAndMonthYear(
                request.getUserId(), category, request.getMonthYear().trim()
        ).map(existing -> {
            existing.setMonthlyLimit(request.getMonthlyLimit());
            return budgetRepository.save(existing);
        }).orElseGet(() -> {
            Budget newBudget = new Budget();
            newBudget.setUser(user);
            newBudget.setCategory(category);
            newBudget.setMonthlyLimit(request.getMonthlyLimit());
            newBudget.setMonthYear(request.getMonthYear().trim());
            return budgetRepository.save(newBudget);
        });

        YearMonth ym = YearMonth.parse(saved.getMonthYear());
        return toDto(saved, request.getUserId(), ym.atDay(1), ym.atEndOfMonth());
    }

    public BudgetDto updateBudget(Long id, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        if (request.getMonthlyLimit() != null) {
            budget.setMonthlyLimit(request.getMonthlyLimit());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            budget.setCategory(request.getCategory().trim());
        }
        if (request.getMonthYear() != null && !request.getMonthYear().isBlank()) {
            budget.setMonthYear(request.getMonthYear().trim());
        }

        Budget updated = budgetRepository.save(budget);
        YearMonth ym = YearMonth.parse(updated.getMonthYear());
        Long userId = (updated.getUser() != null) ? updated.getUser().getId() : 1L;
        return toDto(updated, userId, ym.atDay(1), ym.atEndOfMonth());
    }

    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Budget not found with id: " + id);
        }
        budgetRepository.deleteById(id);
    }

    public List<BudgetDto> copyBudgets(Long userId, BudgetCopyRequest request) {
        Long resolvedUserId = userId != null ? userId : 1L;
        User user = userRepository.findById(resolvedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + resolvedUserId));

        List<Budget> sourceBudgets = budgetRepository.findByUserIdAndMonthYear(resolvedUserId, request.fromMonth().trim());
        if (sourceBudgets.isEmpty()) {
            throw new ResourceNotFoundException("No budgets found for month: " + request.fromMonth());
        }

        List<Budget> existingTargetBudgets = budgetRepository.findByUserIdAndMonthYear(resolvedUserId, request.toMonth().trim());
        List<String> existingCategories = existingTargetBudgets.stream()
                .map(Budget::getCategory)
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        List<Budget> createdList = new ArrayList<>();
        for (Budget source : sourceBudgets) {
            if (!existingCategories.contains(source.getCategory().toLowerCase())) {
                Budget copy = new Budget(
                        null,
                        user,
                        source.getCategory(),
                        source.getMonthlyLimit(),
                        request.toMonth().trim()
                );
                createdList.add(budgetRepository.save(copy));
            }
        }

        YearMonth targetYm = YearMonth.parse(request.toMonth().trim());
        return createdList.stream()
                .map(b -> toDto(b, resolvedUserId, targetYm.atDay(1), targetYm.atEndOfMonth()))
                .collect(Collectors.toList());
    }

    public BudgetDto toDto(Budget budget, Long userId, LocalDate start, LocalDate end) {
        BigDecimal spent = transactionRepository.getCategorySpendForRange(
                userId,
                budget.getCategory(),
                start,
                end
        );
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal limit = budget.getMonthlyLimit();
        BigDecimal remaining = limit.subtract(spent);

        double percent = 0.0;
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            percent = spent.divide(limit, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
        }
        double roundedPercent = Math.round(percent * 10.0) / 10.0;

        String status;
        if (roundedPercent < 80.0) {
            status = "OK";
        } else if (roundedPercent <= 100.0) {
            status = "WARNING";
        } else {
            status = "OVER";
        }

        Long budgetUserId = (budget.getUser() != null) ? budget.getUser().getId() : userId;

        return new BudgetDto(
                budget.getId(),
                budgetUserId,
                budget.getCategory(),
                limit,
                budget.getMonthYear(),
                spent,
                remaining,
                roundedPercent,
                status
        );
    }
}
