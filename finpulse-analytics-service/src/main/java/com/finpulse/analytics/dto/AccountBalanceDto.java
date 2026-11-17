package com.finpulse.analytics.dto;

import java.math.BigDecimal;

public record AccountBalanceDto(
        Long accountId,
        String accountName,
        String accountType,
        BigDecimal balance,
        Long transactionCount
) {}
