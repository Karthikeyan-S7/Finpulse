package com.finpulse.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringPaymentRequest(
        @NotNull(message = "User ID is required")
        Long userId,

        @NotNull(message = "Account ID is required")
        Long accountId,

        @NotBlank(message = "Name is required")
        String name,

        String merchant,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Frequency is required (WEEKLY, MONTHLY, YEARLY)")
        String frequency,

        @NotNull(message = "Next due date is required")
        LocalDate nextDueDate,

        Boolean isActive
) {}
