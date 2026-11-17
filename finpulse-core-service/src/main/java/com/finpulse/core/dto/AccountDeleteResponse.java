package com.finpulse.core.dto;

public record AccountDeleteResponse(
        Long id,
        String action, // ARCHIVED or DELETED
        String message
) {}
