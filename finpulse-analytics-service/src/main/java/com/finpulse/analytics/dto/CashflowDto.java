package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record CashflowDto(
        String month,
        BigDecimal income,
        BigDecimal expenses,
        BigDecimal net
) {}
