package com.finpulse.core.service;

import com.finpulse.core.dto.UserDto;
import com.finpulse.core.dto.UserUpdateRequest;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.exception.ResourceNotFoundException;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDto(user);
    }

    @Transactional
    public UserDto updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Check email uniqueness if email changed
        if (!user.getEmail().equalsIgnoreCase(request.email().trim())) {
            userRepository.findByEmail(request.email().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BusinessConflictException("Email already in use: " + request.email());
                }
            });
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setCurrency(request.currency().trim().toUpperCase());
        user.setLocale(request.locale().trim());

        User updated = userRepository.save(user);
        return toDto(updated);
    }

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getCurrency(),
                user.getLocale(),
                user.getCreatedAt()
        );
    }
}
