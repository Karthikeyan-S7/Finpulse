package com.finpulse.core;

import com.finpulse.core.dto.GoalContributeRequest;
import com.finpulse.core.dto.SavingsGoalDto;
import com.finpulse.core.model.SavingsGoal;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.SavingsGoalRepository;
import com.finpulse.core.service.SavingsGoalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SavingsGoalServiceTest {

    @Mock
    private SavingsGoalRepository savingsGoalRepository;

    @InjectMocks
    private SavingsGoalService savingsGoalService;

    private User user;
    private SavingsGoal scooterGoal;

    @BeforeEach
    void setUp() {
        user = new User(1L, "aarav", "aarav@test.in", "Aarav Sharma");
        LocalDate targetDate = LocalDate.now().plusMonths(6);
        scooterGoal = new SavingsGoal(1L, user, "Electric Scooter", new BigDecimal("120000.00"), new BigDecimal("30000.00"), targetDate);
    }

    @Test
    @DisplayName("Unit Test: Goal requiredMonthly accurately divides remaining amount over remaining months")
    void testGoalRequiredMonthlyCalculation() {
        SavingsGoalDto dto = savingsGoalService.toDto(scooterGoal);

        // Remaining: 120,000 - 30,000 = 90,000 over 6 months = 15,000.00
        assertEquals(new BigDecimal("15000.00"), dto.requiredMonthly());
        assertEquals(25.0, dto.percentComplete()); // 30,000 / 120,000 = 25%
    }

    @Test
    @DisplayName("Unit Test: Goal contribution increases savedAmount and recalculates percentComplete")
    void testGoalContributeSuccess() {
        when(savingsGoalRepository.findById(1L)).thenReturn(Optional.of(scooterGoal));
        when(savingsGoalRepository.save(any(SavingsGoal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GoalContributeRequest req = new GoalContributeRequest(new BigDecimal("30000.00"));
        SavingsGoalDto updated = savingsGoalService.contribute(1L, req);

        // 30,000 + 30,000 = 60,000 (50.0%)
        assertEquals(new BigDecimal("60000.00"), updated.savedAmount());
        assertEquals(50.0, updated.percentComplete());
        verify(savingsGoalRepository, times(1)).save(scooterGoal);
    }

    @Test
    @DisplayName("Unit Test: Goal contribution with zero or negative amount throws IllegalArgumentException")
    void testGoalContributeNegativeThrowsException() {
        GoalContributeRequest req = new GoalContributeRequest(new BigDecimal("-500.00"));
        assertThrows(IllegalArgumentException.class, () -> savingsGoalService.contribute(1L, req));
    }
}
