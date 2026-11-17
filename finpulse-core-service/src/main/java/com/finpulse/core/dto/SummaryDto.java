package com.finpulse.core.dto;

import java.math.BigDecimal;
import java.util.List;

public record SummaryDto(
        BigDecimal netWorth,
        BigDecimal assetsTotal,
        BigDecimal liabilitiesTotal,
        BigDecimal income,
        BigDecimal expenses,
        Double savingsRate,
        BigDecimal previousIncome,
        BigDecimal previousExpenses,
        List<AccountSummaryItemDto> accounts
) {}
