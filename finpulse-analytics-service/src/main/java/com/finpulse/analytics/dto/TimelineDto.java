package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record TimelineDto(
        String date,
        String label,
        String category,
        BigDecimal amount,
        String kind
) {}
