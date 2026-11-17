package com.finpulse.core;

import com.finpulse.core.dto.TransactionDto;
import com.finpulse.core.dto.TransactionRequest;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.RecurringPayment;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.RecurringPaymentRepository;
import com.finpulse.core.repository.UserRepository;
import com.finpulse.core.service.RecurringPaymentService;
import com.finpulse.core.service.TransactionService;
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
public class RecurringPaymentServiceTest {

    @Mock
    private RecurringPaymentRepository recurringPaymentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private RecurringPaymentService recurringPaymentService;

    private User user;
    private Account account;
    private RecurringPayment monthlyBill;
    private RecurringPayment inactiveBill;

    @BeforeEach
    void setUp() {
        user = new User(1L, "aarav", "aarav@test.in", "Aarav Sharma");
        account = new Account(1L, user, "Checking", "CHK-1", "CHECKING", new BigDecimal("10000.00"), "INR");
        monthlyBill = new RecurringPayment(10L, user, account, "Netflix", "Netflix India", "Entertainment", new BigDecimal("649.00"), "MONTHLY", LocalDate.of(2026, 1, 31), true);
        inactiveBill = new RecurringPayment(11L, user, account, "Old Gym", "Gym", "Entertainment", new BigDecimal("1000.00"), "MONTHLY", LocalDate.of(2026, 1, 15), false);
    }

    @Test
    @DisplayName("Unit Test: payRecurring processes expense and advances nextDueDate in a month-end safe manner (Jan 31 -> Feb 28)")
    void testRecurringPayAdvancesMonthEndSafe() {
        when(recurringPaymentRepository.findByIdWithAccount(10L)).thenReturn(Optional.of(monthlyBill));

        Transaction mockTx = new Transaction(99L, account, "Entertainment", new BigDecimal("649.00"), "EXPENSE", "Netflix India", "Recurring", LocalDate.now());
        when(transactionService.recordTransaction(any(TransactionRequest.class))).thenReturn(mockTx);
        when(transactionService.toDto(mockTx)).thenReturn(new TransactionDto(99L, 1L, "Checking", "Entertainment", new BigDecimal("649.00"), "EXPENSE", "Netflix India", "Recurring", LocalDate.now(), false, null, null));

        TransactionDto result = recurringPaymentService.payRecurring(10L);

        assertNotNull(result);
        assertEquals(new BigDecimal("649.00"), result.amount());

        // Verify month-end safe advance: Jan 31 + 1 month = Feb 28 (non-leap year 2026)
        assertEquals(LocalDate.of(2026, 2, 28), monthlyBill.getNextDueDate());
        verify(recurringPaymentRepository, times(1)).save(monthlyBill);
    }

    @Test
    @DisplayName("Unit Test: advanceDueDate correctly handles WEEKLY and YEARLY intervals")
    void testAdvanceDueDateWeeklyAndYearly() {
        LocalDate start = LocalDate.of(2026, 5, 10);
        LocalDate weeklyNext = RecurringPaymentService.advanceDueDate(start, "WEEKLY");
        LocalDate yearlyNext = RecurringPaymentService.advanceDueDate(start, "YEARLY");

        assertEquals(LocalDate.of(2026, 5, 17), weeklyNext);
        assertEquals(LocalDate.of(2027, 5, 10), yearlyNext);
    }

    @Test
    @DisplayName("Unit Test: payRecurring on inactive obligation throws BusinessConflictException")
    void testRecurringPayInactiveThrowsConflict() {
        when(recurringPaymentRepository.findByIdWithAccount(11L)).thenReturn(Optional.of(inactiveBill));

        assertThrows(BusinessConflictException.class, () -> recurringPaymentService.payRecurring(11L));
        verify(transactionService, never()).recordTransaction(any());
    }
}
