package com.finpulse.core;

import com.finpulse.core.dto.TransactionRequest;
import com.finpulse.core.exception.InsufficientFundsException;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.Transaction;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.TransactionRepository;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User testUser;
    private Account testAccount;
    private Account creditCardAccount;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "alex_hunter", "alex@example.com", "Alex Hunter");
        testAccount = new Account(1L, testUser, "Checking", "CHK-100", "CHECKING", new BigDecimal("500.00"), "INR");
        creditCardAccount = new Account(2L, testUser, "Credit Card", "CC-200", "CREDIT_CARD", new BigDecimal("-1000.00"), "INR");
    }

    @Test
    @DisplayName("Unit Test: Recording expense decreases account balance successfully")
    void testRecordExpenseSuccess() {
        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1L);
        request.setCategory("Groceries & Dining");
        request.setAmount(new BigDecimal("120.00"));
        request.setTransactionType("EXPENSE");
        request.setMerchant("Whole Foods");
        request.setTransactionDate(LocalDate.now());

        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = transactionService.recordTransaction(request);

        assertNotNull(result);
        assertEquals(new BigDecimal("380.00"), testAccount.getBalance());
        verify(accountRepository, times(1)).save(testAccount);
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Unit Test: Overdraft expense throws InsufficientFundsException on checking account")
    void testRecordExpenseThrowsWhenInsufficientFunds() {
        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1L);
        request.setCategory("Shopping");
        request.setAmount(new BigDecimal("1000.00")); // Balance is 500.00
        request.setTransactionType("EXPENSE");
        request.setMerchant("Electronics Store");
        request.setTransactionDate(LocalDate.now());

        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));

        assertThrows(InsufficientFundsException.class, () -> transactionService.recordTransaction(request));
        verify(accountRepository, never()).save(any(Account.class));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Unit Test: Recording income increases account balance")
    void testRecordIncomeSuccess() {
        TransactionRequest request = new TransactionRequest();
        request.setAccountId(1L);
        request.setCategory("Salary");
        request.setAmount(new BigDecimal("2500.00"));
        request.setTransactionType("INCOME");
        request.setMerchant("Employer");
        request.setTransactionDate(LocalDate.now());

        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = transactionService.recordTransaction(request);

        assertNotNull(result);
        assertEquals(new BigDecimal("3000.00"), testAccount.getBalance());
        verify(accountRepository, times(1)).save(testAccount);
    }

    @Test
    @DisplayName("Unit Test: Overdraft guard allows negative balance on CREDIT_CARD account")
    void testOverdraftAllowedOnCreditCard() {
        TransactionRequest request = new TransactionRequest();
        request.setAccountId(2L);
        request.setCategory("Shopping");
        request.setAmount(new BigDecimal("1500.00")); // CC balance starts at -1000.00
        request.setTransactionType("EXPENSE");
        request.setMerchant("Croma");
        request.setTransactionDate(LocalDate.now());

        when(accountRepository.findById(2L)).thenReturn(Optional.of(creditCardAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction result = transactionService.recordTransaction(request);

        assertNotNull(result);
        assertEquals(new BigDecimal("-2500.00"), creditCardAccount.getBalance());
        verify(accountRepository, times(1)).save(creditCardAccount);
    }

    @Test
    @DisplayName("Unit Test: Deleting an expense reverses balance by adding back the amount")
    void testDeleteExpenseReversesBalance() {
        Transaction tx = new Transaction(10L, testAccount, "Shopping", new BigDecimal("100.00"), "EXPENSE", "Amazon", null, LocalDate.now());
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(tx));

        transactionService.deleteTransaction(10L);

        // testAccount started at 500.00, adding back 100.00 makes it 600.00
        assertEquals(new BigDecimal("600.00"), testAccount.getBalance());
        verify(accountRepository, times(1)).save(testAccount);
        verify(transactionRepository, times(1)).delete(tx);
    }

    @Test
    @DisplayName("Unit Test: Updating transaction reverses old balance effect and applies new effect")
    void testUpdateTransactionReversesOldAndAppliesNew() {
        Transaction existing = new Transaction(15L, testAccount, "Shopping", new BigDecimal("100.00"), "EXPENSE", "Old Store", null, LocalDate.now());
        when(transactionRepository.findById(15L)).thenReturn(Optional.of(existing));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionRequest updateReq = new TransactionRequest();
        updateReq.setAccountId(1L);
        updateReq.setCategory("Shopping");
        updateReq.setAmount(new BigDecimal("250.00")); // Increase expense from 100 to 250
        updateReq.setTransactionType("EXPENSE");
        updateReq.setMerchant("New Store");
        updateReq.setTransactionDate(LocalDate.now());

        transactionService.updateTransaction(15L, updateReq);

        // Account balance was 500.00: +100 (reverse) - 250 (new) = 350.00
        assertEquals(new BigDecimal("350.00"), testAccount.getBalance());
        verify(accountRepository, atLeastOnce()).save(testAccount);
    }

    @Test
    @DisplayName("Unit Test: Deleting a transfer pair reverses both account balances and removes both rows")
    void testDeleteTransferPair() {
        String group = "TRF-GROUP-99";
        Transaction sourceTx = new Transaction(21L, testAccount, "Transfer", new BigDecimal("200.00"), "EXPENSE", "Transfer out", null, LocalDate.now(), true, group);
        Transaction destTx = new Transaction(22L, creditCardAccount, "Transfer", new BigDecimal("200.00"), "INCOME", "Transfer in", null, LocalDate.now(), true, group);

        when(transactionRepository.findById(21L)).thenReturn(Optional.of(sourceTx));
        when(transactionRepository.findByTransferGroupId(group)).thenReturn(List.of(sourceTx, destTx));

        transactionService.deleteTransaction(21L);

        // Source account: was 500.00 -> reverse expense (+200) = 700.00
        assertEquals(new BigDecimal("700.00"), testAccount.getBalance());
        // Destination account: was -1000.00 -> reverse income (-200) = -1200.00
        assertEquals(new BigDecimal("-1200.00"), creditCardAccount.getBalance());

        verify(transactionRepository, times(1)).delete(sourceTx);
        verify(transactionRepository, times(1)).delete(destTx);
    }
}
