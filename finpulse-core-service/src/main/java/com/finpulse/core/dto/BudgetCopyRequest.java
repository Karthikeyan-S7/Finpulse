package com.finpulse.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record BudgetCopyRequest(
        @NotBlank(message = "fromMonth is required")
        @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "fromMonth must match format YYYY-MM")
        String fromMonth,

        @NotBlank(message = "toMonth is required")
        @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "toMonth must match format YYYY-MM")
        String toMonth
) {}
