package com.finpulse.core.dto;

import jakarta.validation.constraints.NotNull;

public record RecurringActivePatchRequest(
        @NotNull(message = "isActive flag is required")
        Boolean isActive
) {}
