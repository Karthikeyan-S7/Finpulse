package com.finpulse.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        @NotNull(message = "User ID is required")
        Long userId,

        @NotBlank(message = "Goal name is required")
        String name,

        @NotNull(message = "Target amount is required")
        @DecimalMin(value = "1.00", message = "Target amount must be at least 1.00")
        BigDecimal targetAmount,

        BigDecimal savedAmount,

        LocalDate targetDate
) {}
