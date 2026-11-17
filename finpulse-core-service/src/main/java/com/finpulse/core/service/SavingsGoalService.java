package com.finpulse.core.service;

import com.finpulse.core.dto.GoalContributeRequest;
import com.finpulse.core.dto.SavingsGoalDto;
import com.finpulse.core.dto.SavingsGoalRequest;
import com.finpulse.core.exception.ResourceNotFoundException;
import com.finpulse.core.model.SavingsGoal;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.SavingsGoalRepository;
import com.finpulse.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;
    private final UserRepository userRepository;

    public SavingsGoalService(SavingsGoalRepository savingsGoalRepository, UserRepository userRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalDto> getGoals(Long userId) {
        Long resolvedUserId = userId != null ? userId : 1L;
        List<SavingsGoal> list = savingsGoalRepository.findByUserIdOrderByCreatedAtDesc(resolvedUserId);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SavingsGoalDto getGoalById(Long id) {
        SavingsGoal goal = savingsGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));
        return toDto(goal);
    }

    public SavingsGoalDto createGoal(SavingsGoalRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.userId()));

        BigDecimal saved = request.savedAmount() != null ? request.savedAmount() : BigDecimal.ZERO;
        SavingsGoal goal = new SavingsGoal(
                null,
                user,
                request.name().trim(),
                request.targetAmount(),
                saved,
                request.targetDate()
        );

        SavingsGoal result = savingsGoalRepository.save(goal);
        return toDto(result);
    }

    public SavingsGoalDto updateGoal(Long id, SavingsGoalRequest request) {
        SavingsGoal goal = savingsGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));

        goal.setName(request.name().trim());
        goal.setTargetAmount(request.targetAmount());
        if (request.savedAmount() != null) {
            goal.setSavedAmount(request.savedAmount());
        }
        goal.setTargetDate(request.targetDate());

        SavingsGoal updated = savingsGoalRepository.save(goal);
        return toDto(updated);
    }

    public SavingsGoalDto contribute(Long id, GoalContributeRequest request) {
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Contribution amount must be strictly positive");
        }

        SavingsGoal goal = savingsGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));

        goal.setSavedAmount(goal.getSavedAmount().add(request.amount()));
        SavingsGoal updated = savingsGoalRepository.save(goal);
        return toDto(updated);
    }

    public void deleteGoal(Long id) {
        if (!savingsGoalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Savings goal not found with id: " + id);
        }
        savingsGoalRepository.deleteById(id);
    }

    public SavingsGoalDto toDto(SavingsGoal goal) {
        BigDecimal target = goal.getTargetAmount() != null ? goal.getTargetAmount() : BigDecimal.ZERO;
        BigDecimal saved = goal.getSavedAmount() != null ? goal.getSavedAmount() : BigDecimal.ZERO;

        double percent = 0.0;
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            percent = saved.divide(target, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
        }
        double roundedPercent = Math.round(percent * 10.0) / 10.0;

        BigDecimal remaining = target.subtract(saved);
        BigDecimal requiredMonthly;

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            requiredMonthly = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else if (goal.getTargetDate() == null || goal.getTargetDate().isBefore(LocalDate.now())) {
            requiredMonthly = remaining.setScale(2, RoundingMode.HALF_UP);
        } else {
            long months = ChronoUnit.MONTHS.between(
                    LocalDate.now().withDayOfMonth(1),
                    goal.getTargetDate().withDayOfMonth(1)
            );
            if (months <= 0) {
                months = 1;
            }
            requiredMonthly = remaining.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        }

        Long userId = (goal.getUser() != null) ? goal.getUser().getId() : null;

        return new SavingsGoalDto(
                goal.getId(),
                userId,
                goal.getName(),
                target,
                saved,
                goal.getTargetDate(),
                roundedPercent,
                requiredMonthly,
                goal.getCreatedAt()
        );
    }
}
