# 06. Database Schema, Seed Data & SQL Queries — FinPulse

## 1. Relational Database Schema (DDL)

The schema is defined in [`database/schema.sql`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/database/schema.sql) and is fully compatible with both MySQL 8.0 and H2 (in MySQL Compatibility Mode):

```sql
-- FinPulse Database Schema v2
-- Compatible with MySQL 8.0 and H2 (MySQL Mode)

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    locale VARCHAR(10) NOT NULL DEFAULT 'en-IN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(30) NOT NULL UNIQUE,
    account_type VARCHAR(30) NOT NULL, -- CHECKING, SAVINGS, CREDIT_CARD, CASH, INVESTMENT, LOAN
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    monthly_limit DECIMAL(15, 2) NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_budgets_user_cat_month UNIQUE (user_id, category, month_year)
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL, -- INCOME, EXPENSE
    merchant VARCHAR(100) NULL,
    description VARCHAR(255) NULL,
    transaction_date DATE NOT NULL,
    is_transfer BOOLEAN NOT NULL DEFAULT FALSE,
    transfer_group_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_transactions_acc_date (account_id, transaction_date),
    INDEX idx_transactions_category (category),
    INDEX idx_transactions_merchant (merchant)
);

CREATE TABLE IF NOT EXISTS recurring_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    merchant VARCHAR(100) NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- WEEKLY, MONTHLY, YEARLY
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_recurring_user_due (user_id, next_due_date)
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    saved_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    details VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Indexes & Relational Constraints
1. `PRIMARY KEY`: Defined on `id` across all tables with auto-increment.
2. `UNIQUE`:
   - `users(username)`, `users(email)`
   - `accounts(account_number)`
   - `budgets(user_id, category, month_year)` (Prevents duplicate category budgets within the same month)
3. `FOREIGN KEY ... ON DELETE CASCADE`:
   - `accounts.user_id` $\rightarrow$ `users.id`
   - `budgets.user_id` $\rightarrow$ `users.id`
   - `transactions.account_id` $\rightarrow$ `accounts.id`
   - `recurring_payments.user_id` $\rightarrow$ `users.id`
   - `recurring_payments.account_id` $\rightarrow$ `accounts.id`
   - `savings_goals.user_id` $\rightarrow$ `users.id`
4. Performance Indexes:
   - `idx_transactions_acc_date`: Composite index on `(account_id, transaction_date)` for fast ledger queries and timeline intervals.
   - `idx_transactions_category`: Speeds up category breakdown and budget aggregation.
   - `idx_transactions_merchant`: Optimizes the SQL `INTERSECT` recurring merchant audit query.
   - `idx_recurring_user_due`: Composite index on `(user_id, next_due_date)` for billing notifications.

---

## 2. Seed Data Inventory (`database/data.sql`)

The seed file [`database/data.sql`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/database/data.sql) populates a realistic 6-month financial history using relative dynamic dates (`CURRENT_DATE - INTERVAL 'n' MONTH`):

| Table Name | Seeded Row Count | Notes on Seed Dataset |
|:---|:---:|:---|
| `users` | **2** | Primary user: `aarav_sharma` (INR, en-IN); Secondary user: `sarah_connor`. |
| `accounts` | **6** | HDFC Checking (₹68,450), ICICI Savings (₹185,000), Axis Credit Card (-₹14,500), Cash (₹3,200), Zerodha Investment (₹240,000), and Secondary checking (₹15,000). |
| `budgets` | **15** | 7 category budgets for previous calendar month, 8 category budgets for current calendar month. |
| `recurring_payments` | **5** | Netflix (₹649), Cult.fit (₹1,800), Airtel Fiber (₹999), Spotify (₹179), Apartment Rent (₹25,000). |
| `savings_goals` | **2** | "6-Month Emergency Fund" (Target: ₹300,000; Saved: ₹185,000) & "Electric Scooter" (Target: ₹120,000; Saved: ₹45,000). |
| `transactions` | **109** | 6 months of historical transactions including monthly salary deposits, grocery bills, dining, rent, utility auto-debits, and transfers. |

---

## 3. Real SQL Queries from Pure JDBC Catalog & Real Output

Every query below is extracted verbatim from [`com.finpulse.analytics.jdbc.SqlQueryCatalog`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-analytics-service/src/main/java/com/finpulse/analytics/jdbc/SqlQueryCatalog.java) and executed by [`JdbcReportRepository.java`](file:///C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/finpulse-analytics-service/src/main/java/com/finpulse/analytics/jdbc/JdbcReportRepository.java).

### A. Multi-Table JOIN: Category Breakdown
- **Method:** `JdbcReportRepository.getCategoryBreakdown(Long userId, String monthYear)`
- **SQL Query (`CATEGORY_BREAKDOWN_QUERY`):**
```sql
SELECT 
    t.category, 
    SUM(t.amount) AS category_amount 
FROM transactions t 
JOIN accounts a ON t.account_id = a.id 
JOIN users u ON a.user_id = u.id 
WHERE u.id = ? 
  AND t.transaction_type = 'EXPENSE' 
  AND t.is_transfer = FALSE 
  AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') 
  AND t.category <> 'Transfer' 
  AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? 
GROUP BY t.category 
ORDER BY category_amount DESC
```
- **Real Execution Output (Parameters: `userId = 1, month = '2026-11'`):**
```json
[
  { "category": "Shopping", "amount": 30300.0, "sharePercent": 47.7 },
  { "category": "Housing & Rent", "amount": 25000.0, "sharePercent": 39.4 },
  { "category": "Groceries & Dining", "amount": 2970.0, "sharePercent": 4.7 },
  { "category": "Entertainment", "amount": 2628.0, "sharePercent": 4.1 },
  { "category": "Utilities & Bills", "amount": 2299.0, "sharePercent": 3.6 },
  { "category": "Transportation", "amount": 340.0, "sharePercent": 0.5 }
]
```

---

### B. Correlated Subquery: Spending Spike Anomaly Detection
- **Method:** `JdbcReportRepository.getSpendingSpikes(Long userId, String monthYear)`
- **SQL Query (`SPENDING_SPIKES_QUERY`):**
```sql
SELECT 
    curr.category, 
    curr.current_amount, 
    hist.avg_amount, 
    ROUND(((curr.current_amount - hist.avg_amount) / hist.avg_amount) * 100, 1) AS change_percent 
FROM ( 
    SELECT t.category, SUM(t.amount) AS current_amount 
    FROM transactions t 
    JOIN accounts a ON t.account_id = a.id 
    WHERE a.user_id = ? 
      AND t.transaction_type = 'EXPENSE' 
      AND t.is_transfer = FALSE 
      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') 
      AND t.category <> 'Transfer' 
      AND t.transaction_date >= ? AND t.transaction_date <= ? 
    GROUP BY t.category 
) curr 
JOIN ( 
    SELECT t.category, (SUM(t.amount) / 3.0) AS avg_amount 
    FROM transactions t 
    JOIN accounts a ON t.account_id = a.id 
    WHERE a.user_id = ? 
      AND t.transaction_type = 'EXPENSE' 
      AND t.is_transfer = FALSE 
      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') 
      AND t.category <> 'Transfer' 
      AND t.transaction_date >= ? AND t.transaction_date <= ? 
    GROUP BY t.category 
    HAVING SUM(t.amount) > 0 
) hist ON curr.category = hist.category 
WHERE curr.current_amount > 1.20 * hist.avg_amount 
ORDER BY (curr.current_amount - hist.avg_amount) DESC
```
- **Real Execution Output (Parameters: `userId = 1, month = '2026-11'`):**
```json
[
  {
    "category": "Shopping",
    "currentAmount": 30300.0,
    "averageAmount": 6333.33,
    "changePercent": 378.4
  },
  {
    "category": "Housing & Rent",
    "currentAmount": 25000.0,
    "averageAmount": 16666.67,
    "changePercent": 50.0
  }
]
```

---

### C. SQL Set Operation: INTERSECT (Recurring Merchant Discovery)
- **Method:** `JdbcReportRepository.getRecurringMerchants(Long userId, String monthYear)`
- **SQL Query (`RECURRING_MERCHANTS_INTERSECT_QUERY`):**
```sql
SELECT 
    m.merchant, 
    curr.current_amount, 
    prev.previous_amount 
FROM ( 
    SELECT t1.merchant 
    FROM transactions t1 
    JOIN accounts a1 ON t1.account_id = a1.id 
    WHERE a1.user_id = ? 
      AND t1.transaction_type = 'EXPENSE' 
      AND t1.is_transfer = FALSE 
      AND t1.merchant IS NOT NULL AND t1.merchant <> '' 
      AND SUBSTRING(CAST(t1.transaction_date AS CHAR(10)), 1, 7) = ? 
    INTERSECT 
    SELECT t2.merchant 
    FROM transactions t2 
    JOIN accounts a2 ON t2.account_id = a2.id 
    WHERE a2.user_id = ? 
      AND t2.transaction_type = 'EXPENSE' 
      AND t2.is_transfer = FALSE 
      AND t2.merchant IS NOT NULL AND t2.merchant <> '' 
      AND SUBSTRING(CAST(t2.transaction_date AS CHAR(10)), 1, 7) = ? 
) m 
JOIN ( 
    SELECT t.merchant, SUM(t.amount) AS current_amount 
    FROM transactions t 
    JOIN accounts a ON t.account_id = a.id 
    WHERE a.user_id = ? 
      AND t.transaction_type = 'EXPENSE' 
      AND t.is_transfer = FALSE 
      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? 
    GROUP BY t.merchant 
) curr ON m.merchant = curr.merchant 
JOIN ( 
    SELECT t.merchant, SUM(t.amount) AS previous_amount 
    FROM transactions t 
    JOIN accounts a ON t.account_id = a.id 
    WHERE a.user_id = ? 
      AND t.transaction_type = 'EXPENSE' 
      AND t.is_transfer = FALSE 
      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? 
    GROUP BY t.merchant 
) prev ON m.merchant = prev.merchant 
ORDER BY curr.current_amount DESC
```
- **Real Execution Output (Parameters: `userId = 1, month = '2026-11'`):**
```json
[
  { "merchant": "Amazon India", "currentAmount": 26300.0, "previousAmount": 3500.0 },
  { "merchant": "Prestige Estate Properties", "currentAmount": 25000.0, "previousAmount": 25000.0 },
  { "merchant": "Blinkit", "currentAmount": 2150.0, "previousAmount": 3900.0 },
  { "merchant": "Cult.fit Fitness", "currentAmount": 1800.0, "previousAmount": 1800.0 },
  { "merchant": "Airtel Broadband", "currentAmount": 999.0, "previousAmount": 999.0 },
  { "merchant": "Netflix India", "currentAmount": 649.0, "previousAmount": 649.0 },
  { "merchant": "Swiggy", "currentAmount": 620.0, "previousAmount": 850.0 },
  { "merchant": "Uber India", "currentAmount": 340.0, "previousAmount": 480.0 },
  { "merchant": "Spotify Premium", "currentAmount": 179.0, "previousAmount": 179.0 }
]
```

---

### D. SQL Set Operation: EXCEPT (Unused Budgets Analysis)
- **Method:** `JdbcReportRepository.getUnusedBudgets(Long userId, String monthYear)`
- **SQL Query (`UNUSED_BUDGETS_EXCEPT_QUERY`):**
```sql
SELECT 
    b.category, 
    b.monthly_limit 
FROM budgets b 
JOIN ( 
    SELECT category 
    FROM budgets 
    WHERE user_id = ? AND month_year = ? 
    EXCEPT 
    SELECT t.category 
    FROM transactions t 
    JOIN accounts a ON t.account_id = a.id 
    WHERE a.user_id = ? 
      AND t.transaction_type = 'EXPENSE' 
      AND t.is_transfer = FALSE 
      AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') 
      AND t.category <> 'Transfer' 
      AND SUBSTRING(CAST(t.transaction_date AS CHAR(10)), 1, 7) = ? 
) unspent ON b.category = unspent.category 
WHERE b.user_id = ? AND b.month_year = ? 
ORDER BY b.monthly_limit DESC
```
- **Real Execution Output (Parameters: `userId = 1, month = '2026-11'`):**
```json
[
  { "category": "Travel & Vacation", "monthlyLimit": 10000.0 },
  { "category": "Healthcare", "monthlyLimit": 3000.0 }
]
```

---

### E. SQL Set Operation: UNION (Timeline Projection)
- **Method:** `JdbcReportRepository.getTimeline(Long userId, int days)`
- **SQL Query (`TIMELINE_UNION_QUERY`):**
```sql
SELECT 
    t.transaction_date AS event_date, 
    COALESCE(t.merchant, t.description, t.category) AS label, 
    t.category, 
    t.amount, 
    t.transaction_type, 
    'ACTUAL' AS status 
FROM transactions t 
JOIN accounts a ON t.account_id = a.id 
WHERE a.user_id = ? 
  AND t.is_transfer = FALSE 
  AND (t.merchant IS NULL OR t.merchant <> 'Opening Balance') 
  AND t.category <> 'Transfer' 
  AND t.transaction_date >= ? AND t.transaction_date <= ? 

UNION ALL 

SELECT 
    r.next_due_date AS event_date, 
    r.name AS label, 
    r.category, 
    r.amount, 
    'EXPENSE' AS transaction_type, 
    'SCHEDULED' AS status 
FROM recurring_payments r 
WHERE r.user_id = ? 
  AND r.is_active = TRUE 
  AND r.next_due_date >= ? AND r.next_due_date <= ? 
ORDER BY event_date ASC
```
- **Real Execution Output Sample (Parameters: `userId = 1, days = 30`):**
```json
[
  { "date": "2026-10-15", "label": "Blinkit", "category": "Groceries & Dining", "amount": 650.0, "type": "EXPENSE", "status": "ACTUAL" },
  { "date": "2026-11-01", "label": "Monthly Salary", "category": "Salary & Income", "amount": 75000.0, "type": "INCOME", "status": "ACTUAL" },
  { "date": "2026-11-17", "label": "Netflix 4K Subscription", "category": "Entertainment", "amount": 649.0, "type": "EXPENSE", "status": "SCHEDULED" },
  { "date": "2026-11-22", "label": "Cult.fit Gym Membership", "category": "Entertainment", "amount": 1800.0, "type": "EXPENSE", "status": "SCHEDULED" },
  { "date": "2026-11-24", "label": "Airtel Fiber Broadband", "category": "Utilities & Bills", "amount": 999.0, "type": "EXPENSE", "status": "SCHEDULED" }
]
```

---

### F. Fixed Non-Parameterized Statement: Health Probe
- **Method:** `JdbcReportRepository.checkConnectivity()`
- **SQL Query (`HEALTH_CHECK_QUERY`):** `SELECT 1`
- **Real Execution Output:**
```json
{
  "service": "finpulse-analytics-service",
  "database": "CONNECTED",
  "status": "UP"
}
```
