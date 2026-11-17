package com.finpulse.core.service;

import com.finpulse.core.dto.AccountSummaryItemDto;
import com.finpulse.core.dto.SummaryDto;
import com.finpulse.core.model.Account;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SummaryService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public SummaryService(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public SummaryDto getExecutiveSummary(Long userId, String monthYear) {
        Long resolvedUserId = userId != null ? userId : 1L;
        String resolvedMonthYear = (monthYear != null && !monthYear.isBlank())
                ? monthYear.trim()
                : YearMonth.now().toString();

        YearMonth currentYm = YearMonth.parse(resolvedMonthYear);
        LocalDate currentStart = currentYm.atDay(1);
        LocalDate currentEnd = currentYm.atEndOfMonth();

        YearMonth prevYm = currentYm.minusMonths(1);
        LocalDate prevStart = prevYm.atDay(1);
        LocalDate prevEnd = prevYm.atEndOfMonth();

        // Account balances
        BigDecimal netWorth = accountRepository.getTotalNetWorthByUserId(resolvedUserId);
        BigDecimal assetsTotal = accountRepository.getTotalAssetsByUserId(resolvedUserId);
        BigDecimal liabilitiesTotal = accountRepository.getTotalLiabilitiesByUserId(resolvedUserId);

        // Current month cash-flow (excluding transfers & opening balance)
        BigDecimal income = transactionRepository.getMonthlyIncome(resolvedUserId, currentStart, currentEnd);
        BigDecimal expenses = transactionRepository.getMonthlyExpense(resolvedUserId, currentStart, currentEnd);

        // Previous month cash-flow (excluding transfers & opening balance)
        BigDecimal prevIncome = transactionRepository.getMonthlyIncome(resolvedUserId, prevStart, prevEnd);
        BigDecimal prevExpenses = transactionRepository.getMonthlyExpense(resolvedUserId, prevStart, prevEnd);

        // Savings rate calculation
        double savingsRate = 0.0;
        if (income != null && income.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal netSaved = income.subtract(expenses != null ? expenses : BigDecimal.ZERO);
            savingsRate = netSaved.divide(income, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
        }
        double roundedSavingsRate = Math.round(savingsRate * 10.0) / 10.0;

        // Accounts list
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedFalse(resolvedUserId);
        List<AccountSummaryItemDto> accountItems = accounts.stream()
                .map(a -> new AccountSummaryItemDto(a.getId(), a.getAccountName(), a.getAccountType(), a.getBalance()))
                .collect(Collectors.toList());

        return new SummaryDto(
                netWorth != null ? netWorth : BigDecimal.ZERO,
                assetsTotal != null ? assetsTotal : BigDecimal.ZERO,
                liabilitiesTotal != null ? liabilitiesTotal : BigDecimal.ZERO,
                income != null ? income : BigDecimal.ZERO,
                expenses != null ? expenses : BigDecimal.ZERO,
                roundedSavingsRate,
                prevIncome != null ? prevIncome : BigDecimal.ZERO,
                prevExpenses != null ? prevExpenses : BigDecimal.ZERO,
                accountItems
        );
    }
}
