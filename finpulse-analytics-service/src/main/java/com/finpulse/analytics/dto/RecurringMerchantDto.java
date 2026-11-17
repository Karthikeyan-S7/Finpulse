package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record RecurringMerchantDto(
        String merchant,
        BigDecimal currentAmount,
        BigDecimal previousAmount
) {}
