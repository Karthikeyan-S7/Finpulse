package com.finpulse.core.dto;

import java.time.LocalDateTime;

public record UserDto(
        Long id,
        String username,
        String email,
        String fullName,
        String currency,
        String locale,
        LocalDateTime createdAt
) {}
