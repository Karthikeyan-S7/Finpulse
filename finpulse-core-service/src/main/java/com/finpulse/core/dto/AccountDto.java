package com.finpulse.core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountDto(
        Long id,
        Long userId,
        String accountName,
        String accountNumber,
        String accountType,
        BigDecimal balance,
        String currency,
        Boolean isArchived,
        LocalDateTime createdAt
) {}
