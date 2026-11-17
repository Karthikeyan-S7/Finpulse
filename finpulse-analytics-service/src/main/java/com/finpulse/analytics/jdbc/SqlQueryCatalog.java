package com.finpulse.analytics.jdbc;

/**
 * Central Catalog of Raw ANSI SQL Queries for Pure JDBC Execution (Unit 3).
 *
 * Rules:
 * - All analytics queries strictly exclude transfers (is_transfer = FALSE, category <> 'Transfer')
 *   and opening balances (merchant <> 'Opening Balance').
 * - Queries are compatible with both MySQL 8.0 and H2 (MySQL Mode).
 * - Queries use standard ANSI SQL set operations (UNION, INTERSECT, EXCEPT),
 *   multi-table joins, and correlated subqueries.
 */
public final class SqlQueryCatalog {

    private SqlQueryCatalog() {}

    /**
     * Fixed, non-parameterized query executed via plain java.sql.Statement
     */
    public static final String HEALTH_CHECK_QUERY = "SELECT 1";

    /**
     * Cashflow Query: Group by calendar month.
     * Parameters: 1: userId, 2: startDate (YYYY-MM-DD)
     */
    public static final String CASHFLOW_QUERY =
            "SELECT " +
            "    SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) AS month_year, " +
            "    COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS total_income, " +
            "    COALESCE(SUM(CASE WHEN t.transaction_type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS total_expenses " +
            "FROM transactions t " +
            "JOIN accounts a ON t.account_id = a.id " +
            "WHERE a.user_id = ? " +
            "  AND t.is_transfer = FALSE " +
            "  AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "  AND t.category <> 'Transfer' " +
            "  AND t.transaction_date >= ? " +
            "GROUP BY SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) " +
            "ORDER BY month_year ASC";

    /**
     * Category Breakdown Query: Multi-table JOIN (transactions - accounts - users).
     * Parameters: 1: userId, 2: monthYear (YYYY-MM)
     */
    public static final String CATEGORY_BREAKDOWN_QUERY =
            "SELECT " +
            "    t.category, " +
            "    SUM(t.amount) AS category_amount " +
            "FROM transactions t " +
            "JOIN accounts a ON t.account_id = a.id " +
            "JOIN users u ON a.user_id = u.id " +
            "WHERE u.id = ? " +
            "  AND t.transaction_type = 'EXPENSE' " +
            "  AND t.is_transfer = FALSE " +
            "  AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "  AND t.category <> 'Transfer' " +
            "  AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "GROUP BY t.category " +
            "ORDER BY category_amount DESC";

    /**
     * Spending Spikes Query: Subquery comparing current month spend against
     * previous 3-month average spend per category (> 120% of 3-month avg, avg > 0).
     * Parameters:
     * 1: userId, 2: startCurrent, 3: endCurrent
     * 4: userId, 5: startPrev3,   6: endPrev3
     */
    public static final String SPENDING_SPIKES_QUERY =
            "SELECT " +
            "    curr.category, " +
            "    curr.current_amount, " +
            "    hist.avg_amount, " +
            "    ROUND(((curr.current_amount - hist.avg_amount) / hist.avg_amount) * 100, 1) AS change_percent " +
            "FROM ( " +
            "    SELECT t.category, SUM(t.amount) AS current_amount " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "      AND t.category <> 'Transfer' " +
            "      AND t.transaction_date >= ? AND t.transaction_date <= ? " +
            "    GROUP BY t.category " +
            ") curr " +
            "JOIN ( " +
            "    SELECT t.category, (SUM(t.amount) / 3.0) AS avg_amount " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "      AND t.category <> 'Transfer' " +
            "      AND t.transaction_date >= ? AND t.transaction_date <= ? " +
            "    GROUP BY t.category " +
            "    HAVING SUM(t.amount) > 0 " +
            ") hist ON curr.category = hist.category " +
            "WHERE curr.current_amount > 1.20 * hist.avg_amount " +
            "ORDER BY (curr.current_amount - hist.avg_amount) DESC";

    /**
     * Timeline UNION Query:
     * Combines actual historical transactions of the last N days
     * with scheduled recurring payments due in the next N days.
     * Parameters:
     * 1: userId, 2: startActual,    3: endActual
     * 4: userId, 5: startScheduled, 6: endScheduled
     */
    public static final String TIMELINE_UNION_QUERY =
            "SELECT " +
            "    event_date, " +
            "    label, " +
            "    category, " +
            "    signed_amount, " +
            "    kind " +
            "FROM ( " +
            "    SELECT " +
            "        t.transaction_date AS event_date, " +
            "        COALESCE(t.merchant, t.description, t.category) AS label, " +
            "        t.category, " +
            "        CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE -t.amount END AS signed_amount, " +
            "        'ACTUAL' AS kind " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.is_transfer = FALSE " +
            "      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "      AND t.category <> 'Transfer' " +
            "      AND t.transaction_date >= ? AND t.transaction_date <= ? " +
            "    UNION ALL " +
            "    SELECT " +
            "        r.next_due_date AS event_date, " +
            "        r.name AS label, " +
            "        r.category, " +
            "        -r.amount AS signed_amount, " +
            "        'SCHEDULED' AS kind " +
            "    FROM recurring_payments r " +
            "    WHERE r.user_id = ? " +
            "      AND r.is_active = TRUE " +
            "      AND r.next_due_date >= ? AND r.next_due_date <= ? " +
            ") timeline " +
            "ORDER BY event_date ASC, label ASC";

    /**
     * Recurring Merchants INTERSECT Query:
     * Identifies merchants charged in the selected month INTERSECT merchants charged in previous month.
     * Parameters:
     * 1: userId, 2: currentMonth
     * 3: userId, 4: previousMonth
     * 5: userId, 6: currentMonth
     * 7: userId, 8: previousMonth
     */
    public static final String RECURRING_MERCHANTS_INTERSECT_QUERY =
            "SELECT " +
            "    m.merchant, " +
            "    curr.current_amount, " +
            "    prev.previous_amount " +
            "FROM ( " +
            "    SELECT t1.merchant " +
            "    FROM transactions t1 " +
            "    JOIN accounts a1 ON t1.account_id = a1.id " +
            "    WHERE a1.user_id = ? " +
            "      AND t1.transaction_type = 'EXPENSE' " +
            "      AND t1.is_transfer = FALSE " +
            "      AND t1.merchant IS NOT NULL AND t1.merchant <> '' " +
            "      AND SUBSTRING(CAST(t1.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "    INTERSECT " +
            "    SELECT t2.merchant " +
            "    FROM transactions t2 " +
            "    JOIN accounts a2 ON t2.account_id = a2.id " +
            "    WHERE a2.user_id = ? " +
            "      AND t2.transaction_type = 'EXPENSE' " +
            "      AND t2.is_transfer = FALSE " +
            "      AND t2.merchant IS NOT NULL AND t2.merchant <> '' " +
            "      AND SUBSTRING(CAST(t2.transaction_date AS CHAR(10)), 1, 7) = ? " +
            ") m " +
            "JOIN ( " +
            "    SELECT t.merchant, SUM(t.amount) AS current_amount " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "    GROUP BY t.merchant " +
            ") curr ON m.merchant = curr.merchant " +
            "JOIN ( " +
            "    SELECT t.merchant, SUM(t.amount) AS previous_amount " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? " +
            "    GROUP BY t.merchant " +
            ") prev ON m.merchant = prev.merchant " +
            "ORDER BY curr.current_amount DESC";

    /**
     * Unused Budgets EXCEPT Query:
     * Budgeted categories for the month EXCEPT categories with recorded expense.
     * Parameters:
     * 1: userId, 2: monthYear
     * 3: userId, 4: monthYear
     * 5: userId, 6: monthYear
     */
    public static final String UNUSED_BUDGETS_EXCEPT_QUERY =
            "SELECT " +
            "    b.category, " +
            "    b.monthly_limit " +
            "FROM budgets b " +
            "JOIN ( " +
            "    SELECT category " +
            "    FROM budgets " +
            "    WHERE user_id = ? AND month_year = ? " +
            "    EXCEPT " +
            "    SELECT t.category " +
            "    FROM transactions t " +
            "    JOIN accounts a ON t.account_id = a.id " +
            "    WHERE a.user_id = ? " +
            "      AND t.transaction_type = 'EXPENSE' " +
            "      AND t.is_transfer = FALSE " +
            "      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "      AND t.category <> 'Transfer' " +
            "      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? " +
            ") unspent ON b.category = unspent.category " +
            "WHERE b.user_id = ? AND b.month_year = ? " +
            "ORDER BY b.monthly_limit DESC";

    /**
     * Account Balances Query: Multi-table JOIN with LEFT JOIN to count transactions.
     * Parameters: 1: userId
     */
    public static final String ACCOUNT_BALANCES_QUERY =
            "SELECT " +
            "    a.id AS account_id, " +
            "    a.account_name, " +
            "    a.account_type, " +
            "    a.balance, " +
            "    COUNT(t.id) AS transaction_count " +
            "FROM accounts a " +
            "JOIN users u ON a.user_id = u.id " +
            "LEFT JOIN transactions t ON a.id = t.account_id " +
            "WHERE a.user_id = ? AND a.is_archived = FALSE " +
            "GROUP BY a.id, a.account_name, a.account_type, a.balance " +
            "ORDER BY a.id ASC";

    /**
     * Transactions CSV Streaming Query.
     * Parameters: 1: userId, 2: fromDate, 3: toDate
     */
    public static final String TRANSACTIONS_CSV_QUERY =
            "SELECT " +
            "    t.transaction_date, " +
            "    a.account_name, " +
            "    t.category, " +
            "    t.merchant, " +
            "    t.description, " +
            "    t.transaction_type, " +
            "    t.amount " +
            "FROM transactions t " +
            "JOIN accounts a ON t.account_id = a.id " +
            "WHERE a.user_id = ? " +
            "  AND t.is_transfer = FALSE " +
            "  AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') " +
            "  AND t.category <> 'Transfer' " +
            "  AND t.transaction_date >= ? AND t.transaction_date <= ? " +
            "ORDER BY t.transaction_date DESC, t.id DESC";
}
