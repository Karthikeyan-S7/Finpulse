package com.finpulse.core.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SavingsGoalDto(
        Long id,
        Long userId,
        String name,
        BigDecimal targetAmount,
        BigDecimal savedAmount,
        LocalDate targetDate,
        Double percentComplete,
        BigDecimal requiredMonthly,
        LocalDateTime createdAt
) {}
