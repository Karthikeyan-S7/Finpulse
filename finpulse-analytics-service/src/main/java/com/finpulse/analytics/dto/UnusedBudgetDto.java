package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record UnusedBudgetDto(
        String category,
        BigDecimal monthlyLimit
) {}
