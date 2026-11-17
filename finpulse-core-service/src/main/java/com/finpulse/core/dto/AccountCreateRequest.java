package com.finpulse.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AccountCreateRequest(
        @NotNull(message = "User ID is required")
        Long userId,

        @NotBlank(message = "Account name is required")
        String accountName,

        @NotBlank(message = "Account number is required")
        String accountNumber,

        @NotBlank(message = "Account type is required")
        String accountType,

        BigDecimal balance,

        String currency
) {}
