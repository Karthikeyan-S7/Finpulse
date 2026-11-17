# FinPulse Architecture & Design Decisions Log

This document records the architectural, product, and implementation decisions made throughout the FinPulse v2 refactor.

---

## 1. Scope & Master Constraints (Chunk 1)
- **Frozen Tech Stack:** Java 24, Spring Boot 3, Spring Data JPA, Pure JDBC, React 18/19, Vite, react-router-dom 6, plain CSS, HTML5 Canvas 2D, MySQL 8.0 / H2.
- **Zero New Dependencies:** Strictly no new packages in `pom.xml` or `package.json`. No UI kits, Tailwind, Axios, chart libraries, icon packages, Spring Security, or Actuator.
- **Syllabus Coverage:** All 5 units of the 21CSE354T Full Stack Web Development course syllabus must remain 100% covered and verifiable. Syllabus labels must never appear in the UI and are strictly maintained in `docs/SYLLABUS_MAPPING.md`.

---

## 2. Chunk 1 Decisions & Ambiguity Resolutions

### Decision 1: Currency & Locale Handling
- **Issue:** The existing `CurrencyContext` used hardcoded conversion rates (`USD: 1.0, EUR: 0.92, INR: 84.5`), multiplying stored dollar values to fake live multi-currency conversion. This corrupted financial history.
- **Resolution:** Remove static rate conversions. CurrencyContext will represent a user display preference: currency code (`INR`, `USD`, `EUR`, `GBP`) and locale (`en-IN`, `en-US`), defaulting to `INR` and `en-IN`. All amounts are stored in a single base currency per user and formatted client-side via native `Intl.NumberFormat`.

### Decision 2: Retiring the "Investment Hub" & Mock Dividends
- **Issue:** Fake dividend payments from Apple and Vanguard and stock-broker terminology felt unrealistic for a personal expense tracker.
- **Resolution:** Remove `INVESTMENT_DIVIDEND` transaction type and fake dividend data. Keep `INVESTMENT` solely as an account type (like checking or savings) where users manually update their portfolio valuation, and the balance feeds into total Net Worth.

### Decision 3: Realistic SQL Set Operations (Unit 3)
- **Issue:** Previous `UNION` query combined salary with fake dividends; `INTERSECT` hardcoded October/November 2026 dates without user scoping; `EXCEPT` had cross-database syntax quirks.
- **Resolution:**
  - **`UNION`:** Merges actual historical transactions with active upcoming `recurring_payments` (bills/subscriptions) into a unified forward-looking cash-flow projection timeline.
  - **`INTERSECT`:** Scoped by `user_id` and dynamically computes merchants charged in both the current calendar month and the previous calendar month.
  - **`EXCEPT`:** Scoped by `user_id` to identify budgeted categories that have recorded zero expenditure in the selected month.

### Decision 4: "Spending Spikes" Subquery (Unit 3)
- **Issue:** The planned "80% of average" subquery was never implemented in SQL; only an in-memory budget limit check existed.
- **Resolution:** Implement a correlated SQL subquery in `finpulse-analytics-service` that calculates each category's average monthly expenditure over the preceding 3 full calendar months and returns categories where the current month's spend exceeds 120% of that average.

### Decision 5: H2 Multi-Service Database Sharing
- **Issue:** `finpulse-core-service` configured `jdbc:h2:mem:finpulsedb` (private in-memory), while `finpulse-analytics-service` configured `jdbc:h2:file:.../finpulsedb`. In default H2 mode, the two services communicated with different databases.
- **Resolution:** Standardize both services in `application.yml` on the exact same file-based H2 URL: `jdbc:h2:file:${FINPULSE_H2_PATH:.../database/finpulsedb};MODE=MySQL;AUTO_SERVER=TRUE`. H2's `AUTO_SERVER=TRUE` enables automatic mixed mode so multiple JVM processes share the same database file concurrently.

### Decision 6: Database Credentials & Environment Overrides
- **Issue:** Database passwords (`root123`) were hardcoded in committed `application-mysql.yml` files.
- **Resolution:** Parameterize datasource properties in `application-mysql.yml` with environment variables and safe defaults:
  - `spring.datasource.url: ${FINPULSE_DB_URL:jdbc:mysql://localhost:3306/finpulse_db?...}`
  - `spring.datasource.username: ${FINPULSE_DB_USER:root}`
  - `spring.datasource.password: ${FINPULSE_DB_PASSWORD:root123}`

### Decision 7: User Scoping Without an Authentication Framework
- **Issue:** Master Prompt requires avoiding a heavyweight login/JWT framework while preserving clean multi-user capabilities.
- **Resolution:** Retain the client-driven parameter-based user scoping via `AuthContext` (`userId` passed in REST paths, parameters, or payloads). The new Settings page will allow editing user profile metadata (`fullName`, `email`, default currency) and switching active profiles without adding Spring Security or token overhead.

### Decision 8: Pure Inline SVG Icons
- **Issue:** Master prompt specifies no new dependencies and inline SVG components for icons.
- **Resolution:** Build a native `src/components/icons/Icons.jsx` component library containing clean, scalable SVG paths (Dashboard, Ledger, Accounts, Budgets, Recurring, Goals, Reports, Settings, ArrowUp, ArrowDown, Trash, Edit, Check, Alert, etc.) with consistent stroke width and sizing props.

### Decision 9: Expanded Domain Features
- **Issue:** Users could not record transfers between accounts, manage recurring subscriptions, or track savings goals.
- **Resolution:**
  - Add `recurring_payments` and `savings_goals` tables to `schema.sql` and JPA entities in `finpulse-core-service`.
  - Add `transfer_account_id` to `transactions` table and implement an atomic transfer endpoint adjusting both account balances within a single `@Transactional` boundary.


---

## 3. Chunk 2 Decisions & Database Implementation Details

### Decision 10: Transfer Modeling & Transaction Schema
- **Decision:** Model inter-account transfers as two correlated transaction rows (`EXPENSE` on source account, `INCOME` on destination account) with `is_transfer = TRUE`, `category = 'Transfer'`, and matching UUID string `transfer_group_id`. All transaction `amount` values are strictly positive decimals. Transfers and 'Opening Balance' rows are excluded from income/expense analytical aggregations.

### Decision 11: Balance Conventions & Net Worth
- **Decision:** Credit Card (`CREDIT_CARD`) and Loan (`LOAN`) account balances are stored as negative numbers (representing outstanding debt). Checking, Savings, Cash, and Investment balances are positive. Total Net Worth is calculated simply as `SUM(balance)` across all non-archived (`is_archived = FALSE`) accounts.

### Decision 12: Dual-Engine SQL Compatibility (MySQL 8 & H2 MySQL Mode)
- **Decision:** Formulate all schema and seed SQL expressions using ANSI standard syntax supported by both MySQL 8.0 and H2 (v2.2.224 in MySQL mode):
  - Dynamic relative dates: `CURRENT_DATE - INTERVAL 'x' DAY` and `CURRENT_DATE - INTERVAL 'x' MONTH`.
  - Date substring extraction: `SUBSTRING(CAST(transaction_date AS CHAR(10)), 1, 7)`.
  - Inline table indexes: `INDEX idx_name (columns)` within `CREATE TABLE` statements.
  - Avoid proprietary syntax such as `DATE_SUB()` or `CREATE INDEX IF NOT EXISTS`.

### Decision 13: Exact Balance Invariant Reconciliation
- **Decision:** Guarantee that every account's stored balance equals the exact sum of its transaction effects: $\text{stored\_balance} = \sum(\text{INCOME}) - \sum(\text{EXPENSE})$. A Python generator script (`scripts/generate_seed_data.py`) calculates the net non-opening activity and injects an 'Opening Balance' transaction 180 days prior (`CURRENT_DATE - INTERVAL '180' DAY`, `is_transfer = TRUE`) so `verify.sql` achieves a `0.00` difference for every account.

### Decision 14: Query Triggering Guarantees in Seed Data
- **Decision:** Specifically craft seed transactions to ensure all analytical queries return active data:
  - **INTERSECT:** 10 merchants (Netflix, Spotify, Cult.fit, Airtel Broadband, Amazon, Blinkit, Swiggy, Uber, Prestige, Razorpay) are charged in both current and previous months.
  - **Subquery:** Category 'Shopping' has ₹30,300 in current month expenses vs a 3-month historical average of ₹6,333.33 (+378.4% spike).
  - **EXCEPT:** 'Healthcare' and 'Travel & Vacation' have budgeted limits for the current month but zero recorded expenses.
  - **UNION:** Combines settled transactions with 5 active recurring payments due within 30 days.

### Decision 15: JPA Entity Alignment & Hibernate DDL Validation
- **Decision:** Configure `spring.jpa.hibernate.ddl-auto: validate` on the MySQL profile. In `User.java`, map `currency` explicitly with `@Column(columnDefinition = "CHAR(3)", nullable = false)` to match SQL `CHAR(3)`. Add JPA entity classes for `RecurringPayment` and `SavingsGoal`, and corresponding repositories.

---

## 4. Chunk 3 Decisions & Core Service Implementation Details

### Decision 16: Strict 3-Tier Architecture & Entity Encapsulation
- **Decision:** Controllers never expose JPA entities (`Account`, `Transaction`, `Budget`, `RecurringPayment`, `SavingsGoal`, `User`). All incoming request data are encapsulated into immutable Java records (`*Request`) validated via `@Valid` and Jakarta validation annotations (`@NotNull`, `@NotBlank`, `@Positive`, `@Size`). All outbound payloads are projected into immutable record DTOs (`*Dto`).
- **N+1 Prevention:** All entity relationships (`@ManyToOne`) use `FetchType.LAZY`. Custom JPQL queries in repositories use `JOIN FETCH` (e.g., `SELECT t FROM Transaction t JOIN FETCH t.account a WHERE ...`) to load parent accounts in a single query when serializing `TransactionDto`.

### Decision 17: Canonical Category Registry & Synonym Aliasing
- **Decision:** Create an immutable in-code `CategoryRegistry` defining 18 canonical categories (Income: `Salary`, `Freelance & Consulting`, `Investment Income`, `Gifts & Grants`, `Other Income`; Expense: `Housing & Rent`, `Groceries & Essentials`, `Dining & Takeout`, `Transportation & Commute`, `Utilities & Bills`, `Healthcare & Fitness`, `Entertainment & Leisure`, `Shopping`, `Education & Learning`, `Travel & Vacation`, `Personal Care`, `Gifts & Donations`, `Other Expense`; System: `Transfer`, `Opening Balance`).
- To handle legacy seed data and loose user input, provide a case-insensitive alias map (e.g., `"Food"` -> `"Dining & Takeout"`, `"Fuel"` -> `"Transportation & Commute"`, `"Luxury"` -> `"Shopping"`).

### Decision 18: Overdraft Protection & Credit Account Exemptions
- **Decision:** When recording expenses or transfers from `CHECKING`, `SAVINGS`, or `CASH` accounts, the service enforces an overdraft guard: if `account.balance - expenseAmount < 0`, a `BusinessConflictException` (HTTP 409 Conflict) is thrown with a clear descriptive message (`"Insufficient funds in account '...' (Balance: ..., Required: ...)"`).
- `CREDIT_CARD` and `LOAN` accounts are debt instruments with negative balances by design and are strictly exempt from this balance guard.

### Decision 19: Double-Entry Atomic Inter-Account Transfers
- **Decision:** Endpoint `POST /api/transfers` executes within a single `@Transactional` boundary. It validates that source and destination are different active unarchived accounts owned by the same user. It generates a 36-character `UUID.randomUUID().toString()` as `transfer_group_id` (matching `VARCHAR(36)`), creates two paired transactions (`EXPENSE` on source, `INCOME` on destination with category `'Transfer'`), and atomically debits source and credits destination. Deleting either leg of the transfer automatically deletes the paired transaction and rolls back both account balances.

### Decision 20: Month-End Safe Recurring Due Date Arithmetic
- **Decision:** When executing `POST /api/recurring/{id}/pay`, the next due date advances according to its frequency:
  - `WEEKLY`: adds 7 days.
  - `MONTHLY`: uses `LocalDate.plusMonths(1)`, which natively handles month length variations (e.g., Jan 31 -> Feb 28 in non-leap years, March 31 -> April 30).
  - `YEARLY`: uses `LocalDate.plusYears(1)`.
  Payment creates a settled `EXPENSE` transaction and updates account balance in the same transaction.

### Decision 21: Savings Goal Monthly Amortization
- **Decision:** Savings goals calculate `requiredMonthly` as $\frac{\text{targetAmount} - \text{savedAmount}}{\text{monthsUntilTarget}}$, where months remaining is calculated via `ChronoUnit.MONTHS.between(LocalDate.now(), targetDate)`. If the target date is in the current month or past, required monthly equals the full remaining balance. If target date is null, required monthly is returned as null.

### Decision 22: Safe Soft Archive vs Hard Deletion for Accounts
- **Decision:** `DELETE /api/accounts/{id}` checks if the account has any transaction history. If transaction count is zero, it executes a hard delete. If transactions exist, it toggles `is_archived = true` to preserve foreign key relational integrity and historical audits while removing the account from active balance views and summary calculations. The response indicates `"ARCHIVED"` or `"DELETED"`.

### Decision 23: Standardized API Error Response Payload
- **Decision:** `GlobalExceptionHandler` interceptors format all HTTP 400 (Bad Request), 404 (Not Found), 409 (Conflict), and 500 (Internal Server Error) exceptions into a uniform JSON response structure:
  ```json
  {
    "timestamp": "2026-11-12T19:37:19.456",
    "status": 409,
    "error": "Conflict",
    "message": "Insufficient funds in account 'HDFC Salary Checking'...",
    "fieldErrors": { "amount": "must be greater than 0" },
    "path": "/api/transfers"
  }
  ```

---

## 5. Chunk 4 Decisions & Analytics Service Implementation Details

### Decision 24: Pure JDBC Architecture & Query Catalog
- **Decision:** `finpulse-analytics-service` enforces 100% pure JDBC execution using `java.sql.Connection`, `java.sql.PreparedStatement`, `java.sql.Statement`, and `java.sql.ResultSet` with try-with-resources. Zero `JdbcTemplate` or JPA annotations. All ANSI SQL queries are centralized in `SqlQueryCatalog.java`, and query execution is encapsulated in `JdbcReportRepository.java` (`Controller` $\rightarrow$ `Service` $\rightarrow$ `JdbcReportRepository`).
- A plain, non-parameterized `java.sql.Statement` is explicitly utilized for the database connectivity health check (`SELECT 1` exposed via `GET /api/analytics/health`).

### Decision 25: SQL Set Operations Realization (Unit 3)
- **Decision:**
  - **`UNION` (`/api/analytics/timeline`):** Merges actual historical transactions of the last N days with scheduled recurring payments due in the next N days into a unified cash flow forecast. Amounts are signed (income positive, expenses and scheduled bills negative) and labeled with `kind` (`ACTUAL` or `SCHEDULED`).
  - **`INTERSECT` (`/api/analytics/recurring-merchants`):** Identifies merchants charged in the current month that intersect with merchants charged in the previous month, computing both `currentAmount` and `previousAmount` for recurring vendor audit.
  - **`EXCEPT` (`/api/analytics/unused-budgets`):** Isolates categories that have an active monthly budget but recorded zero expense transactions in that month.
- All analytical queries strictly exclude transfer legs (`is_transfer = FALSE` and `category <> 'Transfer'`) and 'Opening Balance' rows.

### Decision 26: Correlated Spending Spikes Subquery
- **Decision:** Endpoint `/api/analytics/spending-spikes` executes a subquery comparing current calendar month category spend against that category's historical average spend over the previous 3 full calendar months. It filters for categories where current spend exceeds 120% of the historical average (`curr.current_amount > 1.20 * hist.avg_amount`) with historical average $> 0$.

### Decision 27: Cursor-Streamed CSV Generation with RFC 4180 Escaping & Injection Protection
- **Decision:** `GET /api/analytics/export/transactions.csv` uses Spring's `StreamingResponseBody` to stream records directly from the database cursor into the HTTP response stream without buffering all rows in memory.
  - Injects a UTF-8 Byte Order Mark (`\uFEFF`) at the beginning so Microsoft Excel renders accented and international characters natively.
  - Sets `Content-Disposition: attachment; filename="finpulse-transactions-<from>_<to>.csv"`.
  - Enforces RFC 4180 double-quote escaping for values with commas, quotes, or newlines.
  - Implements CSV Formula Injection defense by prepending an apostrophe `'` to any cell whose first character is `=`, `+`, `-`, or `@`.

### Decision 28: Microservice Resilience & HTTP 503 Gateway Mapping
- **Decision:** `CoreServiceClient` configures strict HTTP client timeouts (2000ms connect timeout, 3000ms read timeout) using `RestTemplateBuilder`. If `finpulse-core-service` is unreachable or down when calling `/api/analytics/overview`, `CoreServiceClient` throws `CoreServiceUnavailableException`, which `GlobalExceptionHandler` maps to HTTP 503 (`Service Unavailable`) with a descriptive message and standard error shape. All other analytics endpoints depend strictly on direct JDBC access and remain fully functional even when the core service is down.

---

## 6. Chunk 5 Decisions & Frontend Foundation Details

### Decision 29: Design Tokens & Strict WCAG AA Light/Dark Theming
- **Decision:** All visual design is governed by CSS variables in `src/styles/tokens.css` with semantic light (`#F7F8FA` bg, `#FFFFFF` surface, `#E5E7EB` border, `#111827` text) and dark (`#0F1318` bg, `#171C23` surface, `#262D36` border, `#E6E9EE` text) modes toggled via `[data-theme]` on the root HTML element.
- Deep blue accent (`#2457D6` light / `#6C93FF` dark) paired with semantic green (income), red (expense), amber (warning), and info. High contrast meeting WCAG AA requirements in both modes.
- `font-variant-numeric: tabular-nums` enforced on all financial figures and currency displays to prevent digit jitter during animation or sorting.
- `prefers-reduced-motion: reduce` fully respected with `transition: none` and `animation: none` overrides.

### Decision 30: Zero External Icon Library / Pure Inline SVG Set
- **Decision:** Created handcrafted SVG icons in `src/components/ui/Icon.jsx` with consistent viewport, viewBox, and 1.75px stroke width.
- Fully decoupled frontend from external icon libraries (`lucide-react`), ensuring zero external icon package bloat and 100% offline self-contained rendering.

### Decision 31: Responsive App Shell & Multi-Tier Navigation
- **Decision:**
  - **Desktop ($\ge$ 1024px):** Sticky collapsible sidebar (240px $\rightarrow$ 68px) with brand logo, 8 core routes, and collapse toggle persisted in `localStorage`.
  - **Tablet/Mobile (< 1024px):** Slide-in drawer with backdrop dismiss.
  - **Mobile (< 640px):** Sticky bottom tab navigation bar for immediate one-thumb access to top 5 routes (`/`, `/transactions`, `/budgets`, `/reports`, `/settings`).
  - Accessibility: Includes `#main-content` skip link and `aria-label` landmarks on nav containers.

### Decision 32: Accessible Modal Dialog & Focus Trap
- **Decision:** Custom `Modal` component implements WAI-ARIA dialog pattern: `role="dialog"`, `aria-modal="true"`, focus trap (`useRef`), Escape key listener, backdrop click dismiss, and automatic restoration of focus to the triggering element upon closure.
- Reusable `ConfirmDialog` built on top of `Modal` for destructive actions (transaction deletion, account archiving).

### Decision 33: Client API Layer & AbortController Fetch Wrapper
- **Decision:** Centralized generic client in `src/api/client.js` targeting Core Service (port 8081) and Analytics Service (port 8082).
- Handles HTTP 204 No Content, parses standard `ApiError` payloads (including `fieldErrors`), and supports `AbortController` cancellation for unmounted components.

### Decision 34: State Contexts & Native Number Formatting
- **Decision:** Refactored `CurrencyContext` to use native `Intl.NumberFormat` with active user's currency and locale, eliminating legacy static rate tables.
- `AuthContext` provides profile switching between Aarav Sharma (user 1) and Sarah Connor (user 2).
- `ThemeContext` reacts to OS `prefers-color-scheme` changes while respecting explicit user persistence in `localStorage`.
- `ToastContext` manages accessible toast alerts (`aria-live="polite"`).

---

## 7. Chunk 6 Decisions & Pure HTML5 Canvas 2D Charting Details

### Decision 35: Pure HTML5 Canvas 2D Architecture (Zero External Chart Libraries)
- **Decision:** Build a custom charting engine directly on the browser's HTML5 Canvas 2D Context API (`CanvasRenderingContext2D`) without using 3rd-party charting libraries (no Chart.js, Recharts, Victory, D3).
- **Core Abstraction:**
  - Base component `src/components/charts/CanvasChart.jsx` owns the `<canvas>` element, its DOM ref (`useRef`), container ref, accessibility landmarks (`role="img"`, `aria-label`), loading skeleton, empty state fallback, and floating tooltip container.
  - Custom hook `src/components/charts/useCanvas.js` orchestrates HiDPI scaling, `ResizeObserver` lifecycle, `requestAnimationFrame` animation loops, and theme reactivity.
  - Utility module `src/components/charts/chartUtils.js` provides "nice numbers" axis scaling, cubic ease-out calculation, monotone spline interpolation, rounded rectangle geometry, and dynamic CSS variable theme resolution.

### Decision 36: HiDPI & Retina Rendering via Dual-Layer Scaling
- **Decision:** Solve canvas blurriness across 100%, 125%, 150%, and 200% displays:
  - Backing store resolution is scaled by physical device pixel ratio: `canvas.width = Math.floor(width * dpr)` and `canvas.height = Math.floor(height * dpr)`.
  - CSS display style remains locked to logical pixels: `canvas.style.width = width + 'px'` and `canvas.style.height = height + 'px'`.
  - The 2D context is calibrated via `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`, allowing all drawing logic to operate 1:1 in standard CSS pixels while rendering razor-sharp vectors at any display density.

### Decision 37: Memory Leak Prevention & Observer Lifecycle
- **Decision:** Both `ResizeObserver` instances and `requestAnimationFrame` IDs are strictly tied to component unmount lifecycle in `useEffect` cleanup handlers. If the container resizes rapidly or components unmount during an active ease-out tween, `cancelAnimationFrame` and `observer.disconnect()` guarantee zero memory leaks or dangling frame iterations.

### Decision 38: Hit-Testing, Pointer Events & DOM Tooltip Overlay
- **Decision:**
  - To support both mouse and mobile touch pointers seamlessly, chart containers listen to `pointermove`, `pointerdown`, and `pointerleave` events with `touchAction: pan-y`.
  - **Donut Chart:** Hit-testing converts pointer coordinates $(x, y)$ to relative polar coordinates ($r = \sqrt{\Delta x^2 + \Delta y^2}$ and $\theta = \text{atan2}(\Delta y, \Delta x)$ normalized from $-\pi/2$). Hovered segments expand by $+4\text{px}$ radius. Categories beyond the top 5 are automatically aggregated into an "Other" category slice.
  - **Line Area Chart:** Performs $O(1)$ nearest X-coordinate interpolation, drawing a dashed vertical crosshair guide and pinpoint highlight circles.
  - **Bar Chart:** Calculates active month slot indices, highlighting the column background and showing grouped income, expense, and net variance metrics.
  - Tooltips are rendered as lightweight HTML DOM elements positioned above the canvas rather than static canvas text, ensuring proper font antialiasing, crisp text borders, and accessibility.

---

## 8. Chunk 7 Decisions & Dashboard / Transactions Implementation Details

### Decision 39: Independent Failure Boundaries for Microservice Dashboard Widgets
- **Decision:** To guarantee high availability and resilience, the Dashboard avoids monolithic data loading. It queries `accounts`, `transactions`, `budgets`, `recurring`, and `analytics` independently using `Promise.allSettled`.
- If `finpulse-analytics-service` (port 8082) is offline or throws a 503 error, a discreet inline warning notice is rendered in the insights strip with an individual retry trigger. The remaining widgets (net worth, budgets at risk, upcoming bills, recent activity table) continue to function with full fidelity using live Spring Data JPA data from port 8081.

### Decision 40: Dual-Leg Transfer Consolidation in the Ledger View
- **Decision:** Inter-account transfers are modeled in the database as two paired relational records (`EXPENSE` on source, `INCOME` on destination) with a shared `transfer_group_id`.
- The frontend ledger consolidates paired transfer rows into a single unified row displaying `Transfer: Source Account → Destination Account`, showing the transfer amount and memo. This eliminates duplicate visual entries in the transaction list while preserving relational integrity and double-entry accounting in the database.

### Decision 41: Combined Server-Side Range Querying & Reactive Client Refinement
- **Decision:** The transaction ledger queries the server by date range (`from`, `to`) and `accountId` to keep payloads manageable.
- Text search across merchants, descriptions, and categories, transaction type tab selection (`AllActivity`, `Expenses`, `Income`), category filtering, and column sorting are executed reactively in-memory via `useMemo`. Filtered set summary totals (Income, Expenses, Net) update instantaneously without redundant HTTP roundtrips.

### Decision 42: Transaction Modals with Overdraft Protection & Rapid Entry
- **Decision:**
  - `TransactionFormModal` autofocuses the amount input via `useRef` upon opening and dynamically populates categories based on the selected type (Income vs Expense).
  - Handles backend validation errors by mapping `fieldErrors` inline under relevant inputs.
  - Intercepts HTTP 409 Conflict overdraft errors (`"Insufficient funds in account '...'"`), rendering a clear alert banner on the modal rather than crashing or closing unexpectedly.
  - Provides a "Save & Add Another" action that commits the transaction, resets the amount and payee inputs while retaining the date, account, and type, and refocuses the amount input for fast sequential receipt entry.

---

## 9. Chunk 8 Decisions & Accounts, Budgets, Recurring, and Goals Architecture

### Decision 43: Accounts Architecture, Net Worth Header & Dynamic Donut Breakdown
- **Decision:**
  - The `/accounts` page calculates **Net Worth = Total Assets - Total Liabilities**. Asset accounts (`CHECKING`, `SAVINGS`, `INVESTMENT`, `CASH`) with positive balances are dynamically aggregated into an asset allocation `DonutChart` rendered on HTML5 Canvas.
  - Liability accounts (`CREDIT_CARD`, `LOAN`) are styled with negative red currency values and omitted from the positive asset breakdown.
  - **Archive vs Delete Flow:** The account deletion modal calls `DELETE /api/accounts/{id}`. When the account contains transaction history, the backend automatically sets `isArchived = true` to preserve ledger integrity; when zero transactions exist, it executes a hard delete. The API response clarifies the action performed, which is reflected in the toast notice.
  - **Valuation Updates for Investment Accounts:** `INVESTMENT` accounts include an "Update Valuation" modal that computes the delta between current balance and new valuation, creating an automated adjustment transaction to keep ledger auditing synchronized.
  - Archived accounts are kept out of sight by default behind an "Archived Accounts" toggle section.

### Decision 44: Budgets Page Status Logic & Intelligent Limit Suggestions
- **Decision:**
  - The `/budgets` page features a monthly navigator (`MonthPicker`) and an aggregate summary bar (Budgeted vs Spent vs Remaining).
  - Each budget card includes an animated `ProgressBar` whose color transitions dynamically based on percentage utilized:
    - $\le 80\%$: Green (`On Track`)
    - $80\% - 100\%$: Amber (`Warning`)
    - $> 100\%$: Red (`Over Limit`)
    - To satisfy WCAG AA accessibility, status is always accompanied by explicit text labels rather than color alone.
  - **3-Month Trailing Limit Suggestions:** When adding or editing a budget, the modal queries `useFinancialAnalytics` to calculate the category's 3-month trailing average expenditure, displaying an inline prompt with a 1-click "Use suggestion" button.
  - **Unbudgeted Spending Strip:** The page detects categories where spending occurred in the active month without a corresponding budget rule, presenting a subtle warning strip with a "+ Budget" shortcut.
  - **"Copy from Last Month":** Calls `POST /api/budgets/copy` to duplicate previous month budget limits to the active month with a single click.

### Decision 45: Recurring Commitments & Run Rate Normalization
- **Decision:**
  - `/recurring` sorts commitments chronologically by `nextDueDate`.
  - Computes a normalized **Monthly Commitment** metric:
    - Weekly: $\text{amount} \times 52 / 12$
    - Monthly: $\text{amount}$
    - Yearly: $\text{amount} / 12$
    This displays total committed monthly outflow alongside projected annual run rate.
  - **Status Badges:** Calculates delta days until due:
    - Overdue: `danger` badge (`Overdue by Xd`)
    - Today: `warning` badge (`Due Today`)
    - Next 7 days: `info` badge (`Due in Xd`)
    - Paused: `neutral` badge (`Paused`)
  - **"Mark Paid" Workflow:** Calls `POST /api/recurring/{id}/pay`, which atomically advances `nextDueDate` (WEEKLY +7d, MONTHLY +1mo, YEARLY +1yr) and inserts an expense transaction in the ledger, followed by an immediate toast notification confirming schedule advancement.
  - **Active State Toggling:** Supports one-click pause and resume via `PATCH /api/recurring/{id}/active`.

### Decision 46: Savings Goals Pacing & Incremental Contribution Flow
- **Decision:**
  - `/goals` renders visual goal cards displaying saved vs target amounts, progress percentage, target completion date, and the required monthly contribution pace (`requiredMonthly`).
  - **Celebration State:** Goals with $\ge 100\%$ funding display success badges, celebratory messaging, and distinct green borders.
  - **"Add Money" Contribution Modal:** Supports rapid deposits via quick preset chips (+₹1,000, +₹5,000, +₹10,000) or custom input, calling `POST /api/goals/{id}/contribute` and firing a celebratory toast when a milestone reaches 100%.
  - Full CRUD lifecycle with accessible focus-trapped modals and `ConfirmDialog` for goal deletion.

---

## 10. Chunk 9 Decisions & Reports, Analytics Visualizations, and Settings Architecture

### Decision 47: Independent Analytical Section Boundaries & Fallback Resilience
- **Decision:**
  - The `/reports` page queries 7 distinct analytical endpoints independently using `Promise.allSettled`: overview (`/overview`), cashflow trends (`/cashflow`), category distribution (`/category-breakdown`), spending spikes (`/spending-spikes`), recurring vendors (`/recurring-merchants`), unused budgets (`/unused-budgets`), and projection timeline (`/timeline`).
  - If a particular query times out or returns null, sibling sections continue to render without interrupting page operation.
  - If `finpulse-analytics-service` is unreachable, an explicit `ErrorState` banner is rendered, specifying the port (`8082`) and exact service name to restart (`finpulse-analytics-service`).

### Decision 48: SQL Set Operations and Subquery Visualization
- **Decision:**
  - **Spending Spikes (Correlated Subquery):** Visualizes categories where the active month's expenditure exceeds 120% of the 3-month trailing average. If zero spikes exist, displays an encouraging positive state ("No unusual spending spikes this month").
  - **Recurring Merchants (INTERSECT):** Tabulates payees billed across consecutive monthly cycles, highlighting variances and tagging likely subscriptions.
  - **Unused Budgets (EXCEPT):** Details budgeted categories with zero expense recorded, highlighting available surplus funds.
  - **Cash Flow Timeline (UNION):** Chronologically merges past 30-day actual transactions with next 30-day scheduled commitments, with interactive filtering (`All`, `Actual`, `Scheduled`).

### Decision 49: Streaming CSV Export via Pure JDBC Cursors
- **Decision:**
  - Integrates direct date-range presets (`This Month`, `Last Month`, `Last 90 Days`, `Last 6 Months`, `Year to Date`, `All History`) and manual ISO date inputs.
  - Directly accesses `GET /api/analytics/export/transactions.csv?userId={id}&from={from}&to={to}`, which streams UTF-8 CSV with an Excel BOM prefix directly from JDBC `ResultSet` cursors for maximum memory efficiency.

### Decision 50: Global Formatting Reactivity, Local Persistence & Microservice Health Probes
- **Decision:**
  - **Live Formatting Preview:** Settings provides a dynamic preview banner that evaluates `Intl.NumberFormat` in real-time as the user selects currency (`INR`, `USD`, `EUR`, `GBP`) or locale (`en-IN`, `en-US`, `de-DE`, `en-GB`).
  - **Persistence:** Profile updates persist to the database via `PUT /api/users/{id}` and simultaneously cache in `localStorage` (`finpulse-user-pref`), ensuring instant re-rendering across the entire application without reload flickers.
  - **Theme Persistence:** Theme selection (`Light`, `Dark`, `System`) updates `[data-theme]` immediately and persists to `localStorage`.
  - **Live Microservice Health Indicators:** Settings features real-time health badges that independently probe `finpulse-core-service` (port 8081) and `finpulse-analytics-service` (port 8082), with a manual "Refresh" trigger.
  - **Zero Syllabus Wording:** All academic syllabus labels remain strictly confined to `docs/SYLLABUS_MAPPING.md`.

---

## 11. Chunk 10 Decisions & Quality, Architecture, and Final Delivery

### Decision 51: Route-Level Code Splitting & React Error Boundaries
- **Decision:**
  - Converted all 8 page views plus `NotFound` to dynamic `React.lazy` imports in `src/App.jsx`.
  - Wrapped routes within a React `Suspense` boundary providing an accessible shimmer `PageLoader` placeholder.
  - Introduced `ErrorBoundary.jsx` around application routes to catch client-side runtime errors and display a recovery card with a "Reload Page" button rather than a blank white screen.

### Decision 52: Case-Insensitive Inline SVG Icon Dispatcher
- **Decision:**
  - Standardized `src/components/ui/Icon.jsx` to support case-insensitive icon name lookup with normalized fallback handling.
  - Expanded icon dictionary to support all navigation, financial, status, and analytical icons natively as inline SVGs with zero external library dependencies.

### Decision 53: Production Launch & Clean Shutdown Architecture
- **Decision:**
  - Updated `start-all.ps1` with prerequisite validation (`java`, `mvn`, `node`, `npm`), sequential microservice orchestration, and non-Actuator HTTP polling against existing endpoints (`/api/users/1` on 8081, `/api/analytics/health` on 8082, and `/` on 5173).
  - Configured `stop-all.ps1` to query network connections using `Get-NetTCPConnection` on ports 8081, 8082, and 5173, cleanly terminating owning processes.

### Decision 54: Automated End-to-End API Smoke Testing Suite
- **Decision:**
  - Implemented `scripts/smoke-test.ps1` querying 35 endpoints across both services using `Invoke-RestMethod`.
  - Tests user updates, account CRUD, transaction creation and deletion, atomic transfers, budget upserts and copy, recurring schedule advances, savings goal amortization, pure JDBC analytical endpoints, SQL set operations, and CSV streaming with clear `[PASS]` / `[FAIL]` indicators.








