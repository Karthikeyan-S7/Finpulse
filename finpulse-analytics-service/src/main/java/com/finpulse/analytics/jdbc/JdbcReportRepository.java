package com.finpulse.analytics.jdbc;

import com.finpulse.analytics.dto.*;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

/**
 * Pure JDBC Repository implementation (Unit 3: SQL & JDBC).
 *
 * Demonstrates:
 * - Connection, PreparedStatement, Statement, ResultSet
 * - try-with-resources resource management
 * - Parameterized queries for SQL injection immunity
 * - Fixed Statement execution for health queries
 * - Streamed CSV generation from cursor (no in-memory buffering)
 */
@Repository
public class JdbcReportRepository {

    private final DataSource dataSource;

    public JdbcReportRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Plain java.sql.Statement connectivity check.
     */
    public boolean checkDatabaseConnectivity() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(SqlQueryCatalog.HEALTH_CHECK_QUERY)) {
            return rs.next();
        } catch (SQLException e) {
            return false;
        }
    }

    /**
     * Cashflow breakdown grouped by calendar month.
     */
    public List<CashflowDto> getCashflow(Long userId, int months) {
        if (months <= 0) {
            months = 6;
        }

        YearMonth currentYm = YearMonth.now();
        YearMonth startYm = currentYm.minusMonths(months - 1);
        LocalDate startDate = startYm.atDay(1);

        Map<String, CashflowDto> monthMap = new LinkedHashMap<>();
        for (int i = 0; i < months; i++) {
            String ymStr = startYm.plusMonths(i).toString();
            monthMap.put(ymStr, new CashflowDto(ymStr, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        }

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.CASHFLOW_QUERY)) {

            ps.setLong(1, userId);
            ps.setDate(2, Date.valueOf(startDate));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String month = rs.getString("month_year");
                    BigDecimal income = rs.getBigDecimal("total_income");
                    BigDecimal expenses = rs.getBigDecimal("total_expenses");
                    if (income == null) income = BigDecimal.ZERO;
                    if (expenses == null) expenses = BigDecimal.ZERO;
                    BigDecimal net = income.subtract(expenses);

                    monthMap.put(month, new CashflowDto(month, income, expenses, net));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing cashflow via pure JDBC: " + e.getMessage(), e);
        }

        return new ArrayList<>(monthMap.values());
    }

    /**
     * Category breakdown for current month via multi-table JOIN.
     */
    public List<CategoryBreakdownDto> getCategoryBreakdown(Long userId) {
        return getCategoryBreakdown(userId, YearMonth.now().toString());
    }

    /**
     * Category breakdown for a given month via multi-table JOIN.
     */
    public List<CategoryBreakdownDto> getCategoryBreakdown(Long userId, String monthYear) {
        List<CategoryBreakdownDto> results = new ArrayList<>();
        BigDecimal grandTotal = BigDecimal.ZERO;
        List<Map.Entry<String, BigDecimal>> rawList = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.CATEGORY_BREAKDOWN_QUERY)) {

            ps.setLong(1, userId);
            ps.setString(2, monthYear);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String cat = rs.getString("category");
                    BigDecimal amt = rs.getBigDecimal("category_amount");
                    if (amt == null) amt = BigDecimal.ZERO;
                    rawList.add(Map.entry(cat, amt));
                    grandTotal = grandTotal.add(amt);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing category breakdown via pure JDBC: " + e.getMessage(), e);
        }

        for (Map.Entry<String, BigDecimal> entry : rawList) {
            double share = 0.0;
            if (grandTotal.compareTo(BigDecimal.ZERO) > 0) {
                share = entry.getValue()
                        .divide(grandTotal, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            results.add(new CategoryBreakdownDto(entry.getKey(), entry.getValue(), share));
        }

        return results;
    }

    /**
     * Spending spikes subquery: this month > 120% of previous 3-month average.
     */
    public List<SpendingSpikeDto> getSpendingSpikes(Long userId, String monthYear) {
        YearMonth ym = YearMonth.parse(monthYear);
        LocalDate startCurrent = ym.atDay(1);
        LocalDate endCurrent = ym.atEndOfMonth();
        LocalDate startPrev3 = ym.minusMonths(3).atDay(1);
        LocalDate endPrev3 = startCurrent.minusDays(1);

        List<SpendingSpikeDto> spikes = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.SPENDING_SPIKES_QUERY)) {

            ps.setLong(1, userId);
            ps.setDate(2, Date.valueOf(startCurrent));
            ps.setDate(3, Date.valueOf(endCurrent));
            ps.setLong(4, userId);
            ps.setDate(5, Date.valueOf(startPrev3));
            ps.setDate(6, Date.valueOf(endPrev3));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String category = rs.getString("category");
                    BigDecimal currentAmount = rs.getBigDecimal("current_amount");
                    BigDecimal avgAmount = rs.getBigDecimal("avg_amount");
                    double changePercent = rs.getDouble("change_percent");

                    spikes.add(new SpendingSpikeDto(category, currentAmount, avgAmount, changePercent));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing spending spikes subquery via pure JDBC: " + e.getMessage(), e);
        }

        return spikes;
    }

    /**
     * Timeline UNION: actual transactions of the last N days UNION scheduled recurring payments in the next N days.
     */
    public List<TimelineDto> getTimeline(Long userId, int days) {
        if (days <= 0) {
            days = 30;
        }

        LocalDate today = LocalDate.now();
        LocalDate startActual = today.minusDays(days);
        LocalDate endActual = today;
        LocalDate startScheduled = today;
        LocalDate endScheduled = today.plusDays(days);

        List<TimelineDto> timeline = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.TIMELINE_UNION_QUERY)) {

            ps.setLong(1, userId);
            ps.setDate(2, Date.valueOf(startActual));
            ps.setDate(3, Date.valueOf(endActual));
            ps.setLong(4, userId);
            ps.setDate(5, Date.valueOf(startScheduled));
            ps.setDate(6, Date.valueOf(endScheduled));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String date = rs.getDate("event_date").toString();
                    String label = rs.getString("label");
                    String category = rs.getString("category");
                    BigDecimal signedAmount = rs.getBigDecimal("signed_amount");
                    String kind = rs.getString("kind");

                    timeline.add(new TimelineDto(date, label, category, signedAmount, kind));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing timeline UNION via pure JDBC: " + e.getMessage(), e);
        }

        return timeline;
    }

    /**
     * Recurring merchants INTERSECT query: month INTERSECT previous month.
     */
    public List<RecurringMerchantDto> getRecurringMerchants(Long userId, String monthYear) {
        YearMonth ym = YearMonth.parse(monthYear);
        String prevMonth = ym.minusMonths(1).toString();

        List<RecurringMerchantDto> list = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.RECURRING_MERCHANTS_INTERSECT_QUERY)) {

            ps.setLong(1, userId);
            ps.setString(2, monthYear);
            ps.setLong(3, userId);
            ps.setString(4, prevMonth);
            ps.setLong(5, userId);
            ps.setString(6, monthYear);
            ps.setLong(7, userId);
            ps.setString(8, prevMonth);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String merchant = rs.getString("merchant");
                    BigDecimal currentAmount = rs.getBigDecimal("current_amount");
                    BigDecimal previousAmount = rs.getBigDecimal("previous_amount");

                    list.add(new RecurringMerchantDto(merchant, currentAmount, previousAmount));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing recurring merchants INTERSECT via pure JDBC: " + e.getMessage(), e);
        }

        return list;
    }

    /**
     * Unused budgets EXCEPT query: budgeted categories EXCEPT categories with expenses.
     */
    public List<UnusedBudgetDto> getUnusedBudgets(Long userId, String monthYear) {
        List<UnusedBudgetDto> list = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.UNUSED_BUDGETS_EXCEPT_QUERY)) {

            ps.setLong(1, userId);
            ps.setString(2, monthYear);
            ps.setLong(3, userId);
            ps.setString(4, monthYear);
            ps.setLong(5, userId);
            ps.setString(6, monthYear);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String category = rs.getString("category");
                    BigDecimal limit = rs.getBigDecimal("monthly_limit");
                    list.add(new UnusedBudgetDto(category, limit));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing unused budgets EXCEPT via pure JDBC: " + e.getMessage(), e);
        }

        return list;
    }

    /**
     * Account balances with transaction counts via multi-table LEFT JOIN.
     */
    public List<AccountBalanceDto> getAccountBalances(Long userId) {
        List<AccountBalanceDto> list = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.ACCOUNT_BALANCES_QUERY)) {

            ps.setLong(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Long accountId = rs.getLong("account_id");
                    String accountName = rs.getString("account_name");
                    String accountType = rs.getString("account_type");
                    BigDecimal balance = rs.getBigDecimal("balance");
                    Long txCount = rs.getLong("transaction_count");

                    list.add(new AccountBalanceDto(accountId, accountName, accountType, balance, txCount));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error computing account balances via pure JDBC: " + e.getMessage(), e);
        }

        return list;
    }

    /**
     * Streamed CSV export directly from JDBC ResultSet cursor.
     * Prevents loading millions of transactions into memory.
     */
    public void streamTransactionsCsv(Long userId, LocalDate from, LocalDate to, Writer writer) throws IOException {
        writer.write("date,account,category,merchant,description,type,amount\n");

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(SqlQueryCatalog.TRANSACTIONS_CSV_QUERY)) {

            ps.setLong(1, userId);
            ps.setDate(2, Date.valueOf(from));
            ps.setDate(3, Date.valueOf(to));

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String date = rs.getDate("transaction_date").toString();
                    String account = escapeCsv(rs.getString("account_name"));
                    String category = escapeCsv(rs.getString("category"));
                    String merchant = escapeCsv(rs.getString("merchant"));
                    String description = escapeCsv(rs.getString("description"));
                    String type = rs.getString("transaction_type");
                    BigDecimal amount = rs.getBigDecimal("amount");
                    String amountStr = amount != null ? String.format(Locale.US, "%.2f", amount) : "0.00";

                    writer.write(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                            date, account, category, merchant, description, type, amountStr));
                }
            }
            writer.flush();
        } catch (SQLException e) {
            throw new RuntimeException("Error streaming transactions CSV via JDBC: " + e.getMessage(), e);
        }
    }

    // --- Legacy methods for backward-compatibility with tests ---

    public SetOperationResultDto executeUnionQuery() {
        var timeline = getTimeline(1L, 30);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var t : timeline) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("date", t.date());
            map.put("label", t.label());
            map.put("category", t.category());
            map.put("amount", t.amount());
            map.put("kind", t.kind());
            rows.add(map);
        }
        return new SetOperationResultDto("UNION", "Combines transactions with recurring payments", SqlQueryCatalog.TIMELINE_UNION_QUERY, rows);
    }

    public SetOperationResultDto executeIntersectQuery() {
        String currentMonth = YearMonth.now().toString();
        var recurring = getRecurringMerchants(1L, currentMonth);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var r : recurring) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("frequentedMerchant", r.merchant());
            map.put("currentAmount", r.currentAmount());
            map.put("previousAmount", r.previousAmount());
            rows.add(map);
        }
        return new SetOperationResultDto("INTERSECT", "Recurring merchants charged in consecutive months", SqlQueryCatalog.RECURRING_MERCHANTS_INTERSECT_QUERY, rows);
    }

    public SetOperationResultDto executeExceptQuery(String monthYear) {
        var unused = getUnusedBudgets(1L, monthYear);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var u : unused) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("unspentBudgetedCategory", u.category());
            map.put("monthlyLimit", u.monthlyLimit());
            map.put("status", "100% Budget Intact / No Expense Incurred");
            rows.add(map);
        }
        return new SetOperationResultDto("EXCEPT", "Budgeted categories with zero spending", SqlQueryCatalog.UNUSED_BUDGETS_EXCEPT_QUERY, rows);
    }

    public List<BudgetHealthDto> getBudgetHealth(Long userId, String monthYear) {
        var unused = getUnusedBudgets(userId, monthYear);
        List<BudgetHealthDto> dtos = new ArrayList<>();
        for (var u : unused) {
            dtos.add(new BudgetHealthDto(u.category(), u.monthlyLimit(), BigDecimal.ZERO, u.monthlyLimit(), 0.0, "UNSPENT"));
        }
        return dtos;
    }

    public String streamCsvAuditReport(Long userId) {
        StringWriter sw = new StringWriter();
        try {
            LocalDate from = LocalDate.now().minusMonths(6);
            LocalDate to = LocalDate.now();
            streamTransactionsCsv(userId, from, to, sw);
        } catch (Exception e) {
            throw new RuntimeException("Error generating CSV audit report: " + e.getMessage(), e);
        }
        return sw.toString();
    }

    /**
     * RFC 4180 CSV cell escaping with CSV-injection mitigation.
     * Prefixes cells beginning with =, +, -, @ with an apostrophe.
     */
    public static String escapeCsv(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }
        // CSV injection mitigation
        char first = input.charAt(0);
        if (first == '=' || first == '+' || first == '-' || first == '@') {
            input = "'" + input;
        }

        // Quote and escape if field contains special CSV characters
        if (input.contains("\"") || input.contains(",") || input.contains("\n") || input.contains("\r")) {
            return "\"" + input.replace("\"", "\"\"") + "\"";
        }
        return input;
    }
}
