package com.finpulse.analytics;

import com.finpulse.analytics.dto.*;
import com.finpulse.analytics.jdbc.JdbcReportRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class JdbcReportRepositoryIntegrationTest {

    @Autowired
    private JdbcReportRepository jdbcReportRepository;

    @Test
    @DisplayName("Pure JDBC: Plain Statement fixed connectivity check")
    void testPlainStatementConnectivity() {
        boolean connected = jdbcReportRepository.checkDatabaseConnectivity();
        assertTrue(connected, "Plain java.sql.Statement query 'SELECT 1' must succeed");
    }

    @Test
    @DisplayName("Pure JDBC: Cashflow group by calendar month")
    void testGetCashflow() {
        List<CashflowDto> cashflow = jdbcReportRepository.getCashflow(1L, 6);
        assertNotNull(cashflow);
        assertEquals(6, cashflow.size(), "Should return exactly 6 continuous calendar months");

        // Latest month should have positive income (Salary ₹75,000) and expenses
        CashflowDto current = cashflow.get(cashflow.size() - 1);
        assertTrue(current.income().compareTo(BigDecimal.ZERO) > 0, "Current month income should be > 0");
        assertTrue(current.expenses().compareTo(BigDecimal.ZERO) > 0, "Current month expenses should be > 0");
    }

    @Test
    @DisplayName("Pure JDBC: Category breakdown multi-table JOIN with percentage calculation")
    void testGetCategoryBreakdown() {
        String currentMonth = YearMonth.now().toString();
        List<CategoryBreakdownDto> breakdown = jdbcReportRepository.getCategoryBreakdown(1L, currentMonth);

        assertNotNull(breakdown);
        assertFalse(breakdown.isEmpty(), "Category breakdown should not be empty for seeded user");

        double totalShare = breakdown.stream().mapToDouble(CategoryBreakdownDto::sharePercent).sum();
        assertTrue(totalShare >= 99.0 && totalShare <= 101.0, "Share percentages should sum to ~100%");
    }

    @Test
    @DisplayName("Pure JDBC: Spending spikes subquery (>120% of previous 3-month average)")
    void testGetSpendingSpikesSubquery() {
        String currentMonth = YearMonth.now().toString();
        List<SpendingSpikeDto> spikes = jdbcReportRepository.getSpendingSpikes(1L, currentMonth);

        assertNotNull(spikes);
        assertFalse(spikes.isEmpty(), "Seed data must produce at least one spending spike");

        // Category 'Shopping' was deliberately seeded with ₹30,300 current vs ~₹6,333 3-month avg (+378%)
        boolean hasShoppingSpike = spikes.stream()
                .anyMatch(s -> "Shopping".equalsIgnoreCase(s.category()) && s.changePercent() > 120.0);
        assertTrue(hasShoppingSpike, "Shopping category should have a spike exceeding 120%");
    }

    @Test
    @DisplayName("Pure JDBC: Timeline UNION includes both ACTUAL transactions and SCHEDULED recurring payments")
    void testGetTimelineUnion() {
        List<TimelineDto> timeline = jdbcReportRepository.getTimeline(1L, 30);

        assertNotNull(timeline);
        assertFalse(timeline.isEmpty(), "Timeline should return timeline entries within 30 days");

        boolean hasActual = timeline.stream().anyMatch(t -> "ACTUAL".equals(t.kind()));
        boolean hasScheduled = timeline.stream().anyMatch(t -> "SCHEDULED".equals(t.kind()));

        assertTrue(hasActual, "Timeline UNION must include ACTUAL transactions");
        assertTrue(hasScheduled, "Timeline UNION must include SCHEDULED recurring payments");

        // Verify signed amounts: income positive, expense/scheduled negative
        for (TimelineDto item : timeline) {
            if ("SCHEDULED".equals(item.kind())) {
                assertTrue(item.amount().compareTo(BigDecimal.ZERO) < 0, "Scheduled recurring bills must be negative");
            }
        }
    }

    @Test
    @DisplayName("Pure JDBC: Recurring merchants INTERSECT query across consecutive months")
    void testGetRecurringMerchantsIntersect() {
        String currentMonth = YearMonth.now().toString();
        List<RecurringMerchantDto> recurring = jdbcReportRepository.getRecurringMerchants(1L, currentMonth);

        assertNotNull(recurring);
        assertFalse(recurring.isEmpty(), "INTERSECT query must identify repeat merchants across consecutive months");

        // Verify both current and previous amounts are positive
        for (RecurringMerchantDto rm : recurring) {
            assertNotNull(rm.merchant());
            assertTrue(rm.currentAmount().compareTo(BigDecimal.ZERO) > 0);
            assertTrue(rm.previousAmount().compareTo(BigDecimal.ZERO) > 0);
        }
    }

    @Test
    @DisplayName("Pure JDBC: Unused budgets EXCEPT query finds budgeted categories with zero expense")
    void testGetUnusedBudgetsExcept() {
        String currentMonth = YearMonth.now().toString();
        List<UnusedBudgetDto> unused = jdbcReportRepository.getUnusedBudgets(1L, currentMonth);

        assertNotNull(unused);
        assertFalse(unused.isEmpty(), "EXCEPT query must identify budgeted categories with zero expenditure");

        // 'Healthcare' and 'Travel & Vacation' were budgeted but have 0 expenses in seed data
        boolean foundHealthcareOrTravel = unused.stream()
                .anyMatch(u -> "Healthcare".equalsIgnoreCase(u.category()) || "Travel & Vacation".equalsIgnoreCase(u.category()));
        assertTrue(foundHealthcareOrTravel, "Should find Healthcare or Travel & Vacation among unused budgets");
    }

    @Test
    @DisplayName("Pure JDBC: Account balances multi-table LEFT JOIN with transaction counts")
    void testGetAccountBalances() {
        List<AccountBalanceDto> balances = jdbcReportRepository.getAccountBalances(1L);

        assertNotNull(balances);
        assertTrue(balances.size() >= 4, "User 1 should have active unarchived accounts (at least 4)");

        // Verify Credit Card balance convention is negative
        AccountBalanceDto cc = balances.stream()
                .filter(b -> "CREDIT_CARD".equalsIgnoreCase(b.accountType()))
                .findFirst()
                .orElse(null);

        assertNotNull(cc, "Credit Card account must be present");
        assertTrue(cc.balance().compareTo(BigDecimal.ZERO) < 0, "Credit Card balance must be negative");
        assertTrue(cc.transactionCount() > 0, "Accounts should have transaction counts");
    }

    @Test
    @DisplayName("Pure JDBC: Streamed CSV export from ResultSet cursor with proper headers")
    void testStreamTransactionsCsv() throws Exception {
        StringWriter writer = new StringWriter();
        LocalDate from = LocalDate.now().minusMonths(6);
        LocalDate to = LocalDate.now();

        jdbcReportRepository.streamTransactionsCsv(1L, from, to, writer);
        String csvOutput = writer.toString();

        assertNotNull(csvOutput);
        assertTrue(csvOutput.startsWith("date,account,category,merchant,description,type,amount\n"),
                "CSV must start with the canonical header row");

        String[] lines = csvOutput.split("\n");
        assertTrue(lines.length > 50, "Should have streamed over 50 transaction rows");
    }
}
