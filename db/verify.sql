-- FinPulse Verification Script (v2)
-- Verifies:
-- 1. Account balance reconciliation (diff = 0.00 for all accounts)
-- 2. UNION query (settled transactions + upcoming recurring payments)
-- 3. INTERSECT query (repeat merchants across current and previous month)
-- 4. EXCEPT query (budgeted categories with zero spend in current month)
-- 5. Subquery (spending spikes > 120% of previous 3-month average)

-- ======================================================================
-- CHECK 1: Account Balance Invariant Reconciliation
-- ======================================================================
SELECT 'CHECK 1: Account Balance Reconciliation' AS check_name;
SELECT a.id,
       a.account_name,
       a.account_type,
       a.balance AS stored_balance,
       COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE -t.amount END), 0.00) AS reconciled_balance,
       ROUND(a.balance - COALESCE(SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount ELSE -t.amount END), 0.00), 2) AS diff
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.account_name, a.account_type, a.balance
ORDER BY a.id;

-- ======================================================================
-- CHECK 2: SQL UNION Operation (Settled + Scheduled Cash-Flow)
-- ======================================================================
SELECT 'CHECK 2: UNION Query' AS check_name;
SELECT 'SETTLED' AS entry_type, category, amount, merchant, transaction_date AS event_date
FROM transactions
WHERE is_transfer = FALSE AND transaction_date >= CURRENT_DATE - INTERVAL '30' DAY
UNION
SELECT 'SCHEDULED' AS entry_type, category, amount, merchant, next_due_date AS event_date
FROM recurring_payments
WHERE is_active = TRUE AND next_due_date >= CURRENT_DATE
ORDER BY event_date DESC
LIMIT 10;

-- ======================================================================
-- CHECK 3: SQL INTERSECT Operation (Repeat Merchants Across Months)
-- ======================================================================
SELECT 'CHECK 3: INTERSECT Query' AS check_name;
SELECT merchant
FROM transactions
WHERE SUBSTRING(CAST(transaction_date AS CHAR(10)), 1, 7) = SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)
  AND is_transfer = FALSE
INTERSECT
SELECT merchant
FROM transactions
WHERE SUBSTRING(CAST(transaction_date AS CHAR(10)), 1, 7) = SUBSTRING(CAST(CURRENT_DATE - INTERVAL '1' MONTH AS CHAR(10)), 1, 7)
  AND is_transfer = FALSE
ORDER BY merchant;

-- ======================================================================
-- CHECK 4: SQL EXCEPT Operation (Zero-Spend Budgeted Categories)
-- ======================================================================
SELECT 'CHECK 4: EXCEPT Query' AS check_name;
SELECT category AS unspent_budgeted_category
FROM budgets
WHERE user_id = 1 AND month_year = SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)
EXCEPT
SELECT category
FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE a.user_id = 1 AND t.transaction_type = 'EXPENSE' AND t.is_transfer = FALSE
  AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)
ORDER BY unspent_budgeted_category;

-- ======================================================================
-- CHECK 5: Subquery (Spending Spikes > 120% of 3-Month Average)
-- ======================================================================
SELECT 'CHECK 5: Spending Spike Subquery' AS check_name;
SELECT curr.category,
       curr.current_month_spend,
       ROUND(hist.avg_prev_spend, 2) AS prev_3m_avg_spend,
       ROUND((curr.current_month_spend - hist.avg_prev_spend) / hist.avg_prev_spend * 100, 1) AS spike_percentage
FROM (
    SELECT t.category, SUM(t.amount) AS current_month_spend
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE a.user_id = 1 AND t.transaction_type = 'EXPENSE' AND t.is_transfer = FALSE
      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = SUBSTRING(CAST(CURRENT_DATE AS CHAR(10)), 1, 7)
    GROUP BY t.category
) curr
JOIN (
    SELECT t.category, SUM(t.amount) / 3.0 AS avg_prev_spend
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE a.user_id = 1 AND t.transaction_type = 'EXPENSE' AND t.is_transfer = FALSE
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '105' DAY
      AND t.transaction_date < CURRENT_DATE - INTERVAL '15' DAY
    GROUP BY t.category
) hist ON curr.category = hist.category
WHERE curr.current_month_spend > 1.20 * hist.avg_prev_spend;
