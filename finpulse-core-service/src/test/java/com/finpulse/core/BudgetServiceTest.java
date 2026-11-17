package com.finpulse.core;

import com.finpulse.core.dto.BudgetCopyRequest;
import com.finpulse.core.dto.BudgetDto;
import com.finpulse.core.model.Budget;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.BudgetRepository;
import com.finpulse.core.repository.TransactionRepository;
import com.finpulse.core.repository.UserRepository;
import com.finpulse.core.service.BudgetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private BudgetService budgetService;

    private User user;
    private Budget budgetOk;
    private Budget budgetWarning;
    private Budget budgetOver;

    @BeforeEach
    void setUp() {
        user = new User(1L, "aarav", "aarav@test.in", "Aarav Sharma");
        budgetOk = new Budget(1L, user, "Groceries & Dining", new BigDecimal("1000.00"), "2026-11");
        budgetWarning = new Budget(2L, user, "Shopping", new BigDecimal("1000.00"), "2026-11");
        budgetOver = new Budget(3L, user, "Entertainment", new BigDecimal("1000.00"), "2026-11");
    }

    @Test
    @DisplayName("Unit Test: Budget status accurately assigns OK (<80%), WARNING (80-100%), and OVER (>100%)")
    void testBudgetStatusThresholds() {
        LocalDate start = LocalDate.of(2026, 11, 1);
        LocalDate end = LocalDate.of(2026, 11, 30);

        when(transactionRepository.getCategorySpendForRange(eq(1L), eq("Groceries & Dining"), any(), any()))
                .thenReturn(new BigDecimal("500.00")); // 50%
        when(transactionRepository.getCategorySpendForRange(eq(1L), eq("Shopping"), any(), any()))
                .thenReturn(new BigDecimal("850.00")); // 85%
        when(transactionRepository.getCategorySpendForRange(eq(1L), eq("Entertainment"), any(), any()))
                .thenReturn(new BigDecimal("1200.00")); // 120%

        BudgetDto dtoOk = budgetService.toDto(budgetOk, 1L, start, end);
        BudgetDto dtoWarning = budgetService.toDto(budgetWarning, 1L, start, end);
        BudgetDto dtoOver = budgetService.toDto(budgetOver, 1L, start, end);

        assertEquals("OK", dtoOk.status());
        assertEquals(50.0, dtoOk.percentUsed());

        assertEquals("WARNING", dtoWarning.status());
        assertEquals(85.0, dtoWarning.percentUsed());

        assertEquals("OVER", dtoOver.status());
        assertEquals(120.0, dtoOver.percentUsed());
    }

    @Test
    @DisplayName("Unit Test: Copy budgets duplicates only missing categories in target month")
    void testCopyBudgetsSkipsExistingCategories() {
        BudgetCopyRequest request = new BudgetCopyRequest("2026-10", "2026-11");

        Budget source1 = new Budget(10L, user, "Housing & Rent", new BigDecimal("25000.00"), "2026-10");
        Budget source2 = new Budget(11L, user, "Utilities & Bills", new BigDecimal("5000.00"), "2026-10");

        // Target month already has "Housing & Rent"
        Budget targetExisting = new Budget(20L, user, "Housing & Rent", new BigDecimal("25000.00"), "2026-11");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(budgetRepository.findByUserIdAndMonthYear(1L, "2026-10")).thenReturn(List.of(source1, source2));
        when(budgetRepository.findByUserIdAndMonthYear(1L, "2026-11")).thenReturn(List.of(targetExisting));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<BudgetDto> result = budgetService.copyBudgets(1L, request);

        // Only "Utilities & Bills" should be copied
        assertEquals(1, result.size());
        assertEquals("Utilities & Bills", result.get(0).category());
        verify(budgetRepository, times(1)).save(any(Budget.class));
    }
}
