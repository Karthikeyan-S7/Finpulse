package com.finpulse.core;

import com.finpulse.core.dto.TransferRequest;
import com.finpulse.core.dto.TransferResponse;
import com.finpulse.core.exception.BusinessConflictException;
import com.finpulse.core.exception.InsufficientFundsException;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.TransactionRepository;
import com.finpulse.core.service.TransferService;
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
public class TransferServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransferService transferService;

    private User user;
    private Account checkingAccount;
    private Account savingsAccount;
    private Account archivedAccount;

    @BeforeEach
    void setUp() {
        user = new User(1L, "aarav", "aarav@test.in", "Aarav Sharma");
        checkingAccount = new Account(1L, user, "Checking", "CHK-1", "CHECKING", new BigDecimal("1000.00"), "INR", false);
        savingsAccount = new Account(2L, user, "Savings", "SVG-2", "SAVINGS", new BigDecimal("5000.00"), "INR", false);
        archivedAccount = new Account(3L, user, "Old Checking", "OLD-3", "CHECKING", new BigDecimal("200.00"), "INR", true);
    }

    @Test
    @DisplayName("Unit Test: Transfer executes atomically and creates 2 paired transactions with same groupId")
    void testTransferSuccess() {
        TransferRequest request = new TransferRequest(1L, 2L, new BigDecimal("300.00"), LocalDate.now(), "Monthly savings");

        when(accountRepository.findById(1L)).thenReturn(Optional.of(checkingAccount));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(savingsAccount));

        TransferResponse response = transferService.executeTransfer(request);

        assertNotNull(response);
        assertEquals("COMPLETED", response.status());
        assertNotNull(response.transferGroupId());
        assertEquals(36, response.transferGroupId().length());

        assertEquals(new BigDecimal("700.00"), checkingAccount.getBalance());
        assertEquals(new BigDecimal("5300.00"), savingsAccount.getBalance());

        verify(accountRepository, times(1)).save(checkingAccount);
        verify(accountRepository, times(1)).save(savingsAccount);
        verify(transactionRepository, times(2)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Unit Test: Transfer to same account throws BusinessConflictException")
    void testTransferToSameAccountThrowsConflict() {
        TransferRequest request = new TransferRequest(1L, 1L, new BigDecimal("100.00"), LocalDate.now(), "Self transfer");

        assertThrows(BusinessConflictException.class, () -> transferService.executeTransfer(request));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Unit Test: Transfer from archived account throws BusinessConflictException")
    void testTransferFromArchivedAccountThrowsConflict() {
        TransferRequest request = new TransferRequest(3L, 2L, new BigDecimal("50.00"), LocalDate.now(), "From archived");

        when(accountRepository.findById(3L)).thenReturn(Optional.of(archivedAccount));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(savingsAccount));

        assertThrows(BusinessConflictException.class, () -> transferService.executeTransfer(request));
    }

    @Test
    @DisplayName("Unit Test: Transfer exceeding checking balance triggers Overdraft Guard")
    void testTransferOverdraftThrowsInsufficientFunds() {
        TransferRequest request = new TransferRequest(1L, 2L, new BigDecimal("1500.00"), LocalDate.now(), "Excessive transfer");

        when(accountRepository.findById(1L)).thenReturn(Optional.of(checkingAccount));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(savingsAccount));

        assertThrows(InsufficientFundsException.class, () -> transferService.executeTransfer(request));
        assertEquals(new BigDecimal("1000.00"), checkingAccount.getBalance());
        verify(transactionRepository, never()).save(any(Transaction.class));
    }
}
