package com.finpulse.core.dto;

import java.math.BigDecimal;

public record BudgetDto(
        Long id,
        Long userId,
        String category,
        BigDecimal monthlyLimit,
        String monthYear,
        BigDecimal spent,
        BigDecimal remaining,
        Double percentUsed,
        String status // OK, WARNING, OVER
) {}
