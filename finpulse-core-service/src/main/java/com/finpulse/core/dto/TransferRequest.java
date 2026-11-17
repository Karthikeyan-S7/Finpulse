package com.finpulse.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TransferRequest(
        @NotNull(message = "Source account ID (fromAccountId) is required")
        Long fromAccountId,

        @NotNull(message = "Destination account ID (toAccountId) is required")
        Long toAccountId,

        @NotNull(message = "Transfer amount is required")
        @DecimalMin(value = "0.01", message = "Transfer amount must be greater than zero")
        BigDecimal amount,

        @NotNull(message = "Transfer date is required")
        LocalDate date,

        String note
) {}
