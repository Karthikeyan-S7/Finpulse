package com.finpulse.core.dto;

public record CategoryDto(
        String name,
        String type,
        String colorKey,
        boolean isSystem
) {}
