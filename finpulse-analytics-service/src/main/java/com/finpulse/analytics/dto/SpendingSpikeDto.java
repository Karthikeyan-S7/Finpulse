package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record SpendingSpikeDto(
        String category,
        BigDecimal currentAmount,
        BigDecimal averageAmount,
        Double changePercent
) {}
