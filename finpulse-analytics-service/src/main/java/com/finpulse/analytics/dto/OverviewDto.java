package com.finpulse.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record OverviewDto(
        BigDecimal netWorth,
        BigDecimal assetsTotal,
        BigDecimal liabilitiesTotal,
        BigDecimal income,
        BigDecimal expenses,
        Double savingsRate,
        BigDecimal previousIncome,
        BigDecimal previousExpenses,
        List<SpendingSpikeDto> topSpikes,
        int spikesCount,
        int unusedBudgetsCount,
        int recurringMerchantsCount,
        List<Map<String, Object>> accounts
) {}
