package com.finpulse.core.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecurringPaymentDto(
        Long id,
        Long userId,
        Long accountId,
        String accountName,
        String name,
        String merchant,
        String category,
        BigDecimal amount,
        String frequency,
        LocalDate nextDueDate,
        Boolean isActive,
        LocalDateTime createdAt
) {}
