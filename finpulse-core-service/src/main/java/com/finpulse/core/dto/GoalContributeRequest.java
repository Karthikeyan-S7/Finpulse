package com.finpulse.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record GoalContributeRequest(
        @NotNull(message = "Contribution amount is required")
        @DecimalMin(value = "0.01", message = "Contribution amount must be greater than zero")
        BigDecimal amount
) {}
