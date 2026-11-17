package com.finpulse.core.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransferResponse(
        String transferGroupId,
        Long fromAccountId,
        Long toAccountId,
        BigDecimal amount,
        LocalDate date,
        String status,
        String message
) {}
