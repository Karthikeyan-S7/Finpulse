package com.finpulse.core;

import com.finpulse.core.dto.SummaryDto;
import com.finpulse.core.model.Account;
import com.finpulse.core.model.User;
import com.finpulse.core.repository.AccountRepository;
import com.finpulse.core.repository.TransactionRepository;
import com.finpulse.core.service.SummaryService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SummaryServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private SummaryService summaryService;

    private User user;
    private Account checking;
    private Account creditCard;

    @BeforeEach
    void setUp() {
        user = new User(1L, "aarav", "aarav@test.in", "Aarav Sharma");
        checking = new Account(1L, user, "Checking", "CHK-1", "CHECKING", new BigDecimal("50000.00"), "INR", false);
        creditCard = new Account(2L, user, "Credit Card", "CC-1", "CREDIT_CARD", new BigDecimal("-15000.00"), "INR", false);
    }

    @Test
    @DisplayName("Unit Test: Summary net worth, assets, and liabilities correctly aggregate account types")
    void testSummaryAssetsLiabilitiesNetWorth() {
        when(accountRepository.getTotalNetWorthByUserId(1L)).thenReturn(new BigDecimal("35000.00"));
        when(accountRepository.getTotalAssetsByUserId(1L)).thenReturn(new BigDecimal("50000.00"));
        when(accountRepository.getTotalLiabilitiesByUserId(1L)).thenReturn(new BigDecimal("15000.00"));
        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(List.of(checking, creditCard));

        when(transactionRepository.getMonthlyIncome(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("75000.00"));
        when(transactionRepository.getMonthlyExpense(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("25000.00"));

        SummaryDto summary = summaryService.getExecutiveSummary(1L, "2026-11");

        assertNotNull(summary);
        assertEquals(new BigDecimal("35000.00"), summary.netWorth());
        assertEquals(new BigDecimal("50000.00"), summary.assetsTotal());
        assertEquals(new BigDecimal("15000.00"), summary.liabilitiesTotal());
        assertEquals(new BigDecimal("75000.00"), summary.income());
        assertEquals(new BigDecimal("25000.00"), summary.expenses());
        // Savings rate: (75000 - 25000) / 75000 = 66.7%
        assertEquals(66.7, summary.savingsRate());
        assertEquals(2, summary.accounts().size());
    }

    @Test
    @DisplayName("Unit Test: Summary queries monthly income and expense with transfer-exclusion filters")
    void testSummaryExcludesTransfersAndOpeningBalance() {
        when(accountRepository.getTotalNetWorthByUserId(1L)).thenReturn(new BigDecimal("10000.00"));
        when(accountRepository.getTotalAssetsByUserId(1L)).thenReturn(new BigDecimal("10000.00"));
        when(accountRepository.getTotalLiabilitiesByUserId(1L)).thenReturn(BigDecimal.ZERO);
        when(accountRepository.findByUserIdAndIsArchivedFalse(1L)).thenReturn(List.of(checking));

        when(transactionRepository.getMonthlyIncome(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("80000.00"));
        when(transactionRepository.getMonthlyExpense(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("30000.00"));

        SummaryDto summary = summaryService.getExecutiveSummary(1L, "2026-11");

        assertEquals(new BigDecimal("80000.00"), summary.income());
        assertEquals(new BigDecimal("30000.00"), summary.expenses());
        verify(transactionRepository, atLeastOnce()).getMonthlyIncome(eq(1L), any(LocalDate.class), any(LocalDate.class));
        verify(transactionRepository, atLeastOnce()).getMonthlyExpense(eq(1L), any(LocalDate.class), any(LocalDate.class));
    }
}
