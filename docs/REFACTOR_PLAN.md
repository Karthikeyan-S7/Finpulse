# FinPulse v2 — Comprehensive Audit & Refactor Plan

## 1. Current-State Inventory

### 1.1 Backend Entities & Fields (`finpulse-core-service`)
All JPA entities reside under `com.finpulse.core.model`:

1. **`User`** (`users` table):
   - `id`: `Long` (Primary Key, `@GeneratedValue(strategy = IDENTITY)`)
   - `username`: `String(50)`, unique, non-null
   - `email`: `String(100)`, unique, non-null
   - `fullName`: `String(100)`, mapped to column `full_name`, non-null
   - `createdAt`: `LocalDateTime`, non-updatable timestamp
   - `@OneToMany accounts`: `List<Account>` (mappedBy = "user", cascade = ALL, orphanRemoval = true)
   - `@OneToMany budgets`: `List<Budget>` (mappedBy = "user", cascade = ALL, orphanRemoval = true)

2. **`Account`** (`accounts` table):
   - `id`: `Long` (Primary Key, `@GeneratedValue(strategy = IDENTITY)`)
   - `user`: `User` (`@ManyToOne(fetch = EAGER)`, `@JoinColumn(name = "user_id")`)
   - `accountName`: `String(100)`, mapped to column `account_name`
   - `accountNumber`: `String(30)`, mapped to column `account_number`, unique
   - `accountType`: `String(30)`, mapped to column `account_type` (`CHECKING`, `SAVINGS`, `INVESTMENT`, `CREDIT_CARD`)
   - `balance`: `BigDecimal(15, 2)`, defaults to `0.00`
   - `currency`: `String(10)`, defaults to `'USD'`
   - `createdAt`: `LocalDateTime`
   - `@OneToMany transactions`: `List<Transaction>` (mappedBy = "account", cascade = ALL, orphanRemoval = true)

3. **`Transaction`** (`transactions` table):
   - `id`: `Long` (Primary Key, `@GeneratedValue(strategy = IDENTITY)`)
   - `account`: `Account` (`@ManyToOne(fetch = EAGER)`, `@JoinColumn(name = "account_id")`)
   - `category`: `String(50)`, non-null
   - `amount`: `BigDecimal(15, 2)`, non-null
   - `transactionType`: `String(30)`, mapped to column `transaction_type` (`INCOME`, `EXPENSE`, `INVESTMENT_DIVIDEND`)
   - `merchant`: `String(100)`, non-null
   - `description`: `String(255)`, nullable
   - `transactionDate`: `LocalDate`, mapped to column `transaction_date`
   - `createdAt`: `LocalDateTime`

4. **`Budget`** (`budgets` table):
   - `id`: `Long` (Primary Key, `@GeneratedValue(strategy = IDENTITY)`)
   - `user`: `User` (`@ManyToOne(fetch = EAGER)`, `@JoinColumn(name = "user_id")`)
   - `category`: `String(50)`, non-null
   - `monthlyLimit`: `BigDecimal(15, 2)`, mapped to column `monthly_limit`, non-null
   - `monthYear`: `String(7)`, mapped to column `month_year` (`YYYY-MM`), non-null
   - `createdAt`: `LocalDateTime`

*(Note: `audit_logs` table exists in `schema.sql`, but has no corresponding JPA entity; populated only via raw SQL seed).*

---

### 1.2 Endpoints Inventory

#### Core Service (`finpulse-core-service` — Port 8081)
| HTTP Method | Path | Controller | Description |
|:---|:---|:---|:---|
| `GET` | `/api/accounts/user/{userId}` | `AccountController` | Retrieve all accounts for a user |
| `GET` | `/api/accounts/user/{userId}/summary` | `AccountController` | Retrieve account summaries with transaction counts |
| `GET` | `/api/accounts/user/{userId}/net-worth` | `AccountController` | Sum of all account balances for a user |
| `GET` | `/api/accounts/{id}` | `AccountController` | Retrieve single account by ID |
| `POST` | `/api/accounts/user/{userId}` | `AccountController` | Create new account for user |
| `GET` | `/api/transactions/user/{userId}` | `TransactionController` | Retrieve all transactions for user (ordered desc) |
| `GET` | `/api/transactions/user/{userId}/range` | `TransactionController` | Filter transactions by date range |
| `GET` | `/api/transactions/{id}` | `TransactionController` | Retrieve single transaction by ID |
| `GET` | `/api/transactions/user/{userId}/overview`| `TransactionController` | Get financial totals & category expense breakdown |
| `POST` | `/api/transactions` | `TransactionController` | Record a transaction (adjusts account balance) |
| `DELETE` | `/api/transactions/{id}` | `TransactionController` | Delete transaction (reverses balance impact) |
| `GET` | `/api/budgets/user/{userId}` | `BudgetController` | Retrieve budgets for user by monthYear |
| `POST` | `/api/budgets` | `BudgetController` | Create or update budget limit for a category |
| `DELETE` | `/api/budgets/{id}` | `BudgetController` | Delete budget by ID |

#### Analytics Service (`finpulse-analytics-service` — Port 8082, Pure JDBC)
| HTTP Method | Path | Controller | Description |
|:---|:---|:---|:---|
| `GET` | `/api/analytics/user/{userId}/category-breakdown` | `AnalyticsController` | Expense sums and percentages per category via JDBC |
| `GET` | `/api/analytics/user/{userId}/budget-health` | `AnalyticsController` | Budget vs spent per category via JDBC join |
| `GET` | `/api/analytics/set-operations` | `AnalyticsController` | Returns UNION, INTERSECT, and EXCEPT results |
| `GET` | `/api/analytics/set-operations/union` | `AnalyticsController` | Returns UNION query results (Income + Dividends) |
| `GET` | `/api/analytics/set-operations/intersect` | `AnalyticsController` | Returns INTERSECT query results (repeat merchants) |
| `GET` | `/api/analytics/set-operations/except` | `AnalyticsController` | Returns EXCEPT query results (unspent categories) |
| `GET` | `/api/analytics/user/{userId}/export/csv` | `AnalyticsController` | Streams raw CSV audit report from JDBC `ResultSet` |
| `GET` | `/api/analytics/user/{userId}/executive-dashboard` | `AnalyticsController` | Combined REST call to core + local JDBC aggregations |

---

### 1.3 Frontend Routes & Components (`finpulse-frontend`)
- **Router Configuration (`App.jsx`):**
  - Route `/`: `Dashboard.jsx` (Overview cards, CanvasChart, account list, recent transactions)
  - Route `/transactions`: `Transactions.jsx` (Ledger table, search filter, category/type filter, modal trigger)
  - Route `/budgets`: `Budgets.jsx` (Budget progress cards, status badges, set budget form)
  - Route `/reports`: `Reports.jsx` (SQL Set Operations console, live tables, CSV export button)
  - Wildcard `*`: Redirects to `/`
- **Shared Components (`src/components/`):**
  - `Navbar.jsx`: Flexbox header with links, currency selector dropdown, user switcher dropdown
  - `StatCard.jsx`: Metric card displaying value, icon, and trend percentage
  - `CanvasChart.jsx`: Pure HTML5 `<canvas>` rendering 2D Category Donut or Spending Velocity Curve
  - `TransactionModal.jsx`: Modal popup with form inputs and auto-focus `useRef`
- **Contexts & Custom Hooks:**
  - `AuthContext.jsx`: Holds `currentUser` (`id: 1` Alex Hunter, `id: 2` Sarah Connor), accounts state
  - `CurrencyContext.jsx`: Static rate multiplier (`USD: 1.0, EUR: 0.92, INR: 84.5`)
  - `useFinancialAnalytics.js`: Calculates net savings rate, burn velocity, budget threshold alerts
  - `useLocalStorage.js`: Generic hook for localStorage synchronization
- **API Client (`services/api.js`):**
  - Direct `fetch` calls to `http://localhost:8081/api` (Core) and `http://localhost:8082/api/analytics` (Analytics)

---

### 1.4 User Scoping Mechanism
- **Current Behavior:** User identity is strictly client-driven via React state (`currentUser` in `AuthContext`). Default user is `id: 1` (Alex Hunter). The user profile can be switched via a `<select>` dropdown in `Navbar.jsx` to `id: 2` (Sarah Connor).
- **Transport Mechanism:** Every API request includes `currentUser.id` as a URL path variable (e.g. `/api/transactions/user/1`), a request parameter (`?userId=1`), or within the JSON body (`{ userId: 1, ... }`).
- **No Authentication Framework:** There are no sessions, cookies, JWTs, or Authorization headers. This intentionally preserves the lightweight collegiate project scope.
- **Future Integration with Settings/Profile:** The Settings page will inspect and display the currently active `currentUser` attributes, allow switching between existing users, permit updating user metadata (`fullName`, `email`, preferred currency/locale), and persist display preferences in `localStorage` without altering the parameter-based API contract.

---

### 1.5 Database & Profiles: `schema.sql` vs JPA `ddl-auto` vs H2 / MySQL
1. **Schema Initialization (`schema.sql` & `data.sql`):**
   - Located in root `database/` and copied to `src/main/resources/` in both microservices.
   - `schema.sql` creates tables (`users`, `accounts`, `budgets`, `transactions`, `audit_logs`) with `CREATE TABLE IF NOT EXISTS`.
   - `data.sql` inserts mock data using `INSERT IGNORE INTO`.
2. **H2 Profile (`application.yml` - Default):**
   - Core Service: `spring.jpa.hibernate.ddl-auto: none`, `spring.sql.init.mode: always`. Spring SQL initialization runs `schema.sql` and `data.sql` directly.
   - Core URL: `jdbc:h2:mem:finpulsedb;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE`.
   - Analytics URL: `jdbc:h2:file:C:/Users/karth/OneDrive/Desktop/FSWD/FinPulse/database/finpulsedb;MODE=MySQL;AUTO_SERVER=TRUE`.
3. **MySQL Profile (`application-mysql.yml`):**
   - Core Service: `spring.jpa.hibernate.ddl-auto: update`, `spring.sql.init.mode: always`, `spring.sql.init.continue-on-error: true`.
   - JDBC URL: `jdbc:mysql://localhost:3306/finpulse_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`.
   - Analytics Service: Runs pure JDBC against `finpulse_db`.

---

## 2. Problems Found & Suspected Issues Verification

### 2.1 Verification of Suspected Issues

| Suspected Issue | Status | Code Evidence & Verification Details |
|:---|:---|:---|
| **Fake or static currency conversion rates** | **CONFIRMED** | `CurrencyContext.jsx` lines 5–9 define hardcoded static multipliers: `EXCHANGE_RATES = { USD: 1.0, EUR: 0.92, INR: 84.5 }`. Converting stored USD into INR by multiplying by 84.5 is unrealistic and produces corrupt historical accounting. |
| **Dividend / Investment mock data** | **CONFIRMED** | `data.sql` lines 36–37 and `Transactions.jsx` lines 12–13 contain fake records: `Apple Inc (AAPL)` ($340.50) and `Vanguard S&P 500` ($185.00) under type `INVESTMENT_DIVIDEND`. The `UNION` query specifically targets `transaction_type = 'INVESTMENT_DIVIDEND'`. |
| **INTERSECT written against non-existent merchant column** | **NOT CONFIRMED** (Column exists, but logic is broken) | `schema.sql` line 40 explicitly defines `merchant VARCHAR(100) NOT NULL`. The column **does exist**; however, `executeIntersectQuery()` in `JdbcAnalyticsRepository.java` hardcodes static dates (`2026-10-01` to `2026-10-31` and `2026-11-01` to `2026-11-30`) and completely omits user scoping (`user_id`), returning cross-user global results. |
| **"80% of average" subquery logic** | **CONFIRMED** | The planned subquery comparing a category's spend against 80% of historical average was **never implemented** in SQL. Only an in-memory budget threshold check (`if (utilization >= 80.0) status = "WARNING"`) was written inside `JdbcAnalyticsRepository.java`. |
| **"Unit X" text visible in the UI** | **CONFIRMED** | `Reports.jsx` line 73 renders: `"Direct demonstration of Syllabus Unit 3: Set Operations (UNION, INTERSECT, EXCEPT) & Raw JDBC Streaming"`. Multiple UI cards have academic badges like `"HTML5 Canvas Financial Visualizer"`. |
| **Hardcoded DB passwords** | **CONFIRMED** | `application-mysql.yml` in both `finpulse-core-service` and `finpulse-analytics-service` has `password: "root123"` committed directly in version control without environment variable fallback. |
| **H2 in-memory DBs that services cannot share** | **CONFIRMED** | `finpulse-core-service` connects to `jdbc:h2:mem:finpulsedb` (private in-memory instance), while `finpulse-analytics-service` connects to `jdbc:h2:file:.../database/finpulsedb`. In default H2 mode, the two microservices query completely different databases! |

### 2.2 Functional Bugs & Missing Business Capabilities
1. **No Account Transfers:** Users cannot move money between accounts (e.g. from Checking to Savings). To do so, they must record a fake "Expense" on checking and a fake "Income" on savings.
2. **Missing Recurring Payments:** No capability exists to track monthly subscriptions, bills, or upcoming obligations.
3. **No Savings Goals:** No ability to set aside money toward specific milestones (e.g. Emergency Fund, Vacation).
4. **Unscoped Analytics Queries:** `executeUnionQuery()` and `executeIntersectQuery()` in `JdbcAnalyticsRepository` execute global `SELECT` queries across all users instead of filtering by `a.user_id = ?`.
5. **No Editing of Transactions:** Transactions can only be created or deleted; there is no update/edit endpoint or modal.
6. **Hardcoded Dates:** Analytical queries hardcode the year 2026 and months October/November instead of dynamically computing the current and previous month intervals.

### 2.3 UX & Visual Deficiencies (Page-by-Page)
- **Overall Styling:**
  - Harsh high-contrast dark palette (`#0a0e17`) with intense neon glows (`var(--shadow-glow)`) and loud purple/cyan radial gradients that resemble a crypto gaming site rather than a trustworthy financial platform.
  - Typography is inconsistent; monospace font (`JetBrains Mono`) is overused for non-numeric prose.
  - Lack of a clean light theme toggle (only dark theme CSS variables are active).
- **Navigation (`Navbar.jsx`):**
  - Tacky gradient badge reading `"MICROSERVICES"` in the brand logo.
  - Academic link name `"SQL Analytics (JDBC)"` instead of a professional finance tab like `"Reports"`.
  - Raw HTML `<select>` dropdowns for currency and profile that look unstyled and out of place.
- **Dashboard (`Dashboard.jsx`):**
  - Academic heading: `"HTML5 Canvas Financial Visualizer — Rendered directly via Canvas 2D Context API (No 3rd-party libs)"`.
  - Neon green dot labeled `"Microservices Live (Port 8081 & 8082)"` placed prominently in the user's main workspace.
  - Account cards show unformatted raw account numbers like `ACC-1`.
  - StatCards lack clear context on whether a change is favorable (e.g. higher expenses shown with green arrow).
- **Transactions (`Transactions.jsx`):**
  - Intrusive warning banner at the top (`"Connected to Live Spring Boot Core Service (Port 8081)"`).
  - No pagination or row limits; table will degrade with 100+ transactions.
  - No transaction editing capability.
  - Generic trash icon delete action with native browser `confirm()` popup.
- **Budgets (`Budgets.jsx`):**
  - Manual text input for `"Billing Cycle"` where users must type `"2026-11"` manually.
  - Progress bar colors are harsh neon red/amber/emerald.
  - No visual indication of spending trajectory over time.
- **Reports (`Reports.jsx`):**
  - Styled like an academic developer console: `"Executed SQL Statement (java.sql.PreparedStatement)"`, raw SQL code block, and buttons reading `"Export CSV via Pure JDBC"`.
  - Terminology refers to `"audit logs"` instead of financial statements or transaction export.

---

## 3. Product Decisions Matrix (Target Product)

| Feature / Component | Action | One-Line Rationale |
|:---|:---|:---|
| **Accounts Management** | **KEEP & IMPROVE** | Keep accounts as the core balance ledger; add dedicated `/accounts` page, transfer support, and clear account types. |
| **Transaction CRUD** | **KEEP & IMPROVE** | Retain full CRUD; remove `INVESTMENT_DIVIDEND` type; add `TRANSFER` type and edit capabilities. |
| **Budgets** | **KEEP & IMPROVE** | Category monthly limits with progress tracking, clean month picker, and alert thresholds. |
| **Analytics (Pure JDBC)** | **KEEP & IMPROVE** | Maintain strict pure JDBC in Analytics Service; replace mock queries with meaningful financial intelligence. |
| **CSV Data Export** | **KEEP & IMPROVE** | Retain pure JDBC streaming export; rebrand from "audit log" to clean financial "Data Export". |
| **Theme (Light/Dark)** | **KEEP & IMPROVE** | Refactor CSS variables to provide a polished, modern fintech aesthetic with seamless Light and Dark modes. |
| **Investment Hub & Fake Dividends** | **REMOVE** | Misaligned with personal finance; investments remain solely as an account type with manual balance tracking. |
| **Static Currency Multipliers** | **REMOVE** | Fake conversion rates corrupt financial truth; amounts are stored in user's base currency and formatted via `Intl.NumberFormat`. |
| **Academic / "Unit X" UI Labels** | **REMOVE** | Strip all syllabus references and technical port callouts from the UI; confine mapping to `docs/SYLLABUS_MAPPING.md`. |
| **Hardcoded Database Passwords** | **CHANGE** | Utilize environment variables (`FINPULSE_DB_URL`, `FINPULSE_DB_USER`, `FINPULSE_DB_PASSWORD`) with safe local defaults. |
| **H2 Database URLs** | **CHANGE** | Unify both services on the same file-based H2 URL with `AUTO_SERVER=TRUE` so they share live data in H2 mode. |
| **UNION SQL Query** | **CHANGE** | Merge actual settled transactions with scheduled upcoming recurring payments to produce a forward cash-flow timeline. |
| **INTERSECT SQL Query** | **CHANGE** | Parameterize by `user_id` to find repeat merchants charged in both the current and immediately preceding calendar month. |
| **Subquery SQL Query** | **CHANGE** | Implement "Spending Spikes" subquery finding categories where current month spend exceeds 120% of previous 3-month average. |
| **EXCEPT SQL Query** | **CHANGE** | Parameterize by `user_id` to identify budgeted categories with zero expenditure in the selected month. |
| **Transfers Between Accounts** | **ADD** | Provide atomic transfers adjusting source and destination account balances with linked transaction records. |
| **Recurring Bills & Subscriptions** | **ADD** | Track recurring obligations (frequency, next due date, auto-bill reminders) on a dedicated `/recurring` page. |
| **Savings Goals** | **ADD** | Allow users to define target savings amounts and track milestones visually on a dedicated `/goals` page. |
| **Dashboard Summary Endpoint** | **ADD** | Consolidate net worth, month cash flow, accounts, and alerts into a single performant GET endpoint. |
| **Settings & Preferences Page** | **ADD** | User profile view, currency and locale formatting preferences, theme toggle, and database status indicator. |
| **Accounts Route (`/accounts`)** | **ADD** | Dedicated view to manage account details, add new accounts, and perform inter-account transfers. |

---

## 4. Final Route Map

| Path | Page Component | Purpose & Features |
|:---|:---|:---|
| `/` | `Dashboard.jsx` | Executive financial health overview: Net Worth stat, Monthly Cash Flow (Income vs Expense), HTML5 Canvas charts (Asset Allocation & Spending Trend), Recent Activity, Quick Transfer. |
| `/transactions` | `Transactions.jsx` | Comprehensive ledger: Search by merchant/note, filter by category/account/type, sort by date/amount, record new transaction, edit, and delete. |
| `/accounts` | `Accounts.jsx` | Complete account portfolio: Checking, Savings, Credit Cards, Manual Investments. Balance adjustments and Inter-Account Fund Transfer modal. |
| `/budgets` | `Budgets.jsx` | Category monthly budgets: Progress bars with CSS transitions, remaining allowance indicators, alert badges, and month selector. |
| `/recurring` | `Recurring.jsx` | Subscriptions & recurring bills: Calendar list of recurring expenses, billing frequency (Monthly/Weekly/Annual), next charge date, active toggles. |
| `/goals` | `Goals.jsx` | Savings goals tracker: Target amount, current saved, target completion date, milestone progress bars, contribution modal. |
| `/reports` | `Reports.jsx` | Financial Intelligence & SQL Analytics: Forward cash-flow timeline (UNION), Repeat merchants (INTERSECT), Spending spikes >120% (Subquery), Zero-spend categories (EXCEPT), and 1-click CSV Data Export. |
| `/settings` | `Settings.jsx` | User profile overview, display currency and locale preferences (`Intl.NumberFormat`), light/dark theme switch, user switcher, system connectivity status. |

---

## 5. Architectural & Technical Deltas

### 5.1 Database Schema Delta (`database/schema.sql`)

```sql
-- Existing tables: users, accounts, budgets, transactions
-- 1. Update transactions to support transfers
ALTER TABLE transactions ADD COLUMN transfer_account_id BIGINT NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_transfer_account 
    FOREIGN KEY (transfer_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- 2. Add recurring payments table
CREATE TABLE IF NOT EXISTS recurring_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    merchant VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- WEEKLY, MONTHLY, ANNUAL
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 3. Add savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NOT NULL,
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5.2 Backend API Delta

#### `finpulse-core-service`
1. **New Entities:** `RecurringPayment.java`, `SavingsGoal.java`.
2. **Updated `Transaction.java`:** Added `transferAccountId` (`Account` reference) for transfers; removed `INVESTMENT_DIVIDEND` from valid transaction types.
3. **New Controllers & Services:**
   - `RecurringPaymentController.java` & `RecurringPaymentService.java` (`/api/recurring/**`)
   - `SavingsGoalController.java` & `SavingsGoalService.java` (`/api/goals/**`)
   - `TransferController.java` (`POST /api/transfers` — atomic balance debit on source and credit on destination)
   - `DashboardController.java` (`GET /api/dashboard/summary/{userId}` — aggregated metrics)
4. **Environment Variables for DataSource:**
   - `url: ${FINPULSE_DB_URL:jdbc:mysql://localhost:3306/finpulse_db?...}`
   - `username: ${FINPULSE_DB_USER:root}`
   - `password: ${FINPULSE_DB_PASSWORD:root123}`

#### `finpulse-analytics-service` (Pure JDBC)
1. **Refactored `JdbcAnalyticsRepository.java`:**
   - `executeCashFlowUnion(Long userId)`: Merges recent transactions with upcoming active `recurring_payments`.
   - `executeRepeatMerchantsIntersect(Long userId, String currentMonth, String prevMonth)`: Parameterized by user and dynamic calendar months.
   - `executeSpendingSpikesSubquery(Long userId, String currentMonth)`: Subquery computing previous 3 months average spend per category and identifying categories where current spend > 1.20 * 3-month average.
   - `executeZeroSpendExcept(Long userId, String monthYear)`: Parameterized by `userId`.
   - `streamCsvDataExport(Long userId)`: Clean CSV streaming without "audit" references.
2. **Unified H2 Connection URL:**
   - Both services point to `jdbc:h2:file:C:/Users/karth/OneDrive/Desktop/FSWD\FinPulse/database/finpulsedb;MODE=MySQL;AUTO_SERVER=TRUE` in default profile.

### 5.3 Frontend Component & Design Plan
1. **Design System & Styling (`src/styles/index.css`):**
   - Professional fintech color palette: Cool grays (`#0f172a`, `#1e293b`), slate borders (`#334155`), clean indigo/emerald accents (`#6366f1`, `#10b981`), refined cards without excessive glow.
   - Comprehensive Light and Dark theme variable definitions.
   - CSS Grid layouts for dashboard, accounts, and reports pages.
   - Smooth CSS transitions for progress bars, hover states, and modal dialogs.
2. **Inline SVG Icons (`src/components/icons/Icons.jsx`):**
   - Clean, lightweight SVG icon library written natively in JSX without adding third-party icon packages.
3. **HTML5 Canvas Visualizers (`src/components/`):**
   - High-DPI retina canvas support (`window.devicePixelRatio`).
   - `AssetAllocationCanvas.jsx`: Donut chart of net worth allocation by account type.
   - `CashFlowTrendCanvas.jsx`: Monthly income vs expense comparative curves with smooth bezier interpolation.
4. **Contexts:**
   - `AuthContext`: Manages active user profile (`id: 1` Alex Hunter, `id: 2` Sarah Connor).
   - `CurrencyContext`: Display preferences for currency code (INR, USD, EUR, GBP) and locale (`en-IN`, `en-US`), formatting via native `Intl.NumberFormat`. No artificial exchange rates.
   - `ThemeContext`: Toggles between `'dark'` and `'light'` class on `document.documentElement`, syncing with `localStorage`.
