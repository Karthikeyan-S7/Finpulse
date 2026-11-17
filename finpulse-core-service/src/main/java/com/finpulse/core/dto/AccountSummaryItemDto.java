package com.finpulse.core.dto;

import java.math.BigDecimal;

public record AccountSummaryItemDto(
        Long id,
        String name,
        String type,
        BigDecimal balance
) {}
