package com.finpulse.core.dto;

public record AccountUpdateRequest(
        String accountName,
        String accountType,
        Boolean isArchived
) {}
