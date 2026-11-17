# 07. Frontend Architecture, UI Design & Visual System — FinPulse

## 1. Route Registry & Navigation Architecture

FinPulse implements client-side single-page routing using React Router DOM `6.28.0` with route-level code splitting via `React.lazy()` and `<Suspense>` wrapped by an `<ErrorBoundary>`:

| Route Path | View Component | Code-Split Chunk Name | Primary Functionality |
|:---|:---|:---|:---|
| `/` | `Dashboard.jsx` | `dist/assets/Dashboard-*.js` | Executive financial health overview, stat cards, cash flow bar chart, category donut, recent ledger, and budget risk alerts |
| `/transactions` | `Transactions.jsx` | `dist/assets/Transactions-*.js` | Comprehensive transaction ledger with debounced search, account/category/type filters, date ranges, and modal CRUD |
| `/accounts` | `Accounts.jsx` | `dist/assets/Accounts-*.js` | Multi-account net worth dashboard, asset vs liability distribution, account creation, editing, and soft archival |
| `/budgets` | `Budgets.jsx` | `dist/assets/Budgets-*.js` | Monthly spending ceilings, real-time animated progress bars (OK, WARNING, OVER), and prior-month budget rollover |
| `/recurring` | `Recurring.jsx` | `dist/assets/Recurring-*.js` | Scheduled bill and subscription tracker, due date badges ("In 3 days", "Overdue"), and 1-click payment settlement |
| `/goals` | `Goals.jsx` | `dist/assets/Goals-*.js` | Long-term savings target milestones, completion percentage, and dynamic required monthly deposit amortization |
| `/reports` | `Reports.jsx` | `dist/assets/Reports-*.js` | Analytical suite loading pure JDBC queries (Cash flow, Category breakdown, Spikes, INTERSECT, EXCEPT, UNION) + CSV export |
| `/settings` | `Settings.jsx` | `dist/assets/Settings-*.js` | User profile preferences (Name, Email), currency/locale selector with live preview, theme switcher, and microservice health checks |
| `*` | `NotFound.jsx` | `dist/assets/NotFound-*.js` | Fallback 404 view with navigation recovery links |

---

## 2. Page-by-Page Specifications & Widget Inventory

### 1. Executive Dashboard (`/`)
- **Header:** Personalized greeting ("Welcome back, Aarav"), global month selector, and quick-action buttons ("Add Transaction", "Transfer").
- **Row 1 (StatCards):** 4 metric cards:
  - *Net Worth:* Sum of all active account balances with month-over-month delta.
  - *Income:* Total non-transfer income for selected calendar month.
  - *Expenses:* Total non-transfer living expenses for selected calendar month.
  - *Savings Rate:* Net savings percentage: $\frac{\text{Income} - \text{Expenses}}{\text{Income}} \times 100\%$.
- **Row 2 (Visual Analytics):**
  - *6-Month Cash Flow:* Grouped Canvas 2D bar chart (Income vs Expense) spanning 8 grid columns.
  - *Category Distribution:* Canvas 2D interactive donut chart with legend spanning 4 grid columns.
- **Row 3 (Operational Widgets):**
  - *Recent Transactions:* Last 8 ledger rows with category badges, amounts, and relative dates (span 7).
  - *Budgets at Risk:* Top 3 categories closest to exceeding their limits with animated progress bars (span 5).
  - *Upcoming Bills:* Next 5 recurring payments due within 30 days with due-in-days badges and a "Mark Paid" trigger.
- **Insights Strip:** Plain-language insight pills (Spending spike alerts, unused budget capital, recurring subscriptions) linking directly to Reports sections.
- **Resilience:** Widgets load independently via `Promise.allSettled`. If Analytics service is offline, an inline banner appears while Core ledger widgets remain fully functional.

### 2. Transaction Ledger (`/transactions`)
- **Metric Bar:** Total transaction count, total inflows, and total outflows for the active filtered set.
- **Toolbar:** Debounced text search (merchant/description), account dropdown filter, category filter, transaction type segmented control (All, Expense, Income), and date range inputs.
- **Data Table:** Dense table displaying Date, Account Name, Category Badge, Merchant, Description, Amount (green for income, red for expense), and Action menu (Edit, Delete).
- **Modals:**
  - `TransactionFormModal.jsx`: Amount input with autofocus, account selector, category picker, date picker, merchant, description.
  - `TransferModal.jsx`: Source account, destination account (preventing same-account selection), amount, date, and note.

### 3. Accounts & Net Worth Manager (`/accounts`)
- **Net Worth Hero Banner:** Total Assets, Total Liabilities (negative numbers), and Net Worth.
- **Asset Allocation:** Donut chart breaking down asset distribution across account types (Checking, Savings, Investment, Cash).
- **Account Groups:** Accounts partitioned into Cash & Banking, Credit Cards & Loans, and Investments.
- **Card Actions:** "Transfer", "Edit", "Archive" (with confirmation dialog explaining archive vs delete based on transaction history), and "Update Balance" for investment portfolios.
- **Archival Toggle:** Checkbox to reveal or hide archived historical accounts.

### 4. Monthly Budgets (`/budgets`)
- **Month Navigator:** Previous/Next month controls with MonthPicker dialog.
- **Summary Banner:** Total Budgeted vs Total Spent vs Total Remaining with overall status badge.
- **Budget Grid:** Responsive cards displaying category icon, monthly spending ceiling, current spend, and CSS-animated `ProgressBar.jsx`. Color and text indicate health:
  - `OK` (Green): Spend $< 80\%$ of limit.
  - `WARNING` (Amber): Spend between $80\%$ and $100\%$.
  - `OVER` (Red): Spend $> 100\%$.
- **Actions:** "Add Budget", "Edit Budget", "Delete Budget", and "Copy from Previous Month" (batch clones prior month limits).

### 5. Recurring Payments & Subscriptions (`/recurring`)
- **Summary Metrics:** Total monthly commitment amount, active subscription count, and charges due within the next 7 days.
- **Subscription Cards:** Service logo/icon, merchant, billing account, frequency (Weekly, Monthly, Yearly), amount, and due status badge:
  - "Due today" (Red alert)
  - "In N days" (Warning/Neutral)
  - "Overdue" (Critical red)
- **Interactive Actions:** 1-click "Mark Paid" button (records expense transaction and advances `next_due_date` by frequency interval); toggle to pause/resume commitments.

### 6. Savings Goals (`/goals`)
- **Summary Banner:** Cumulative target amount, total saved, and overall completion percentage.
- **Goal Cards:** Target name, target amount, current saved amount, progress bar, target date, and required monthly contribution formula.
- **Interactions:** "Deposit Funds" quick action (increments saved amount), "Edit Goal", and "Delete Goal".

### 7. Analytical Reports Suite (`/reports`)
- **Header Controls:** Month selector and "Export CSV" trigger.
- **8 Analytical Sections (Loaded via Pure JDBC):**
  1. *Monthly Performance Summary:* Income, expenses, net savings, and savings rate compared to prior month.
  2. *6-Month Cash Flow Trend:* Interactive Canvas BarChart.
  3. *Category Spending Breakdown:* Interactive Canvas DonutChart + sortable breakdown data table.
  4. *Spending Spikes (Correlated Subquery):* Cards highlighting categories exceeding 120% of 3-month rolling average.
  5. *Recurring Merchants (SQL INTERSECT):* Table of vendors charged in both current and previous months.
  6. *Unused Budgets (SQL EXCEPT):* Categories with allocated budgets but zero recorded spend.
  7. *Unified Cash Flow Timeline (SQL UNION):* Chronological stream of actual historical debits and future scheduled bills with "All", "Actual", and "Scheduled" filter toggles.
  8. *CSV Export Modal:* Date range presets (This Month, Last 30 Days, Year-to-Date, All Time) with unbuffered file download.

### 8. User Settings & Diagnostics (`/settings`)
- **Profile Configuration:** Edit Full Name and Email with instant `PUT /api/users/{id}` dispatch.
- **Localization Preferences:** Currency selector (`INR`, `USD`, `EUR`, `GBP`) and locale selector (`en-IN`, `en-US`, `de-DE`) with dynamic preview of formatted currency.
- **Theme Selection:** Light, Dark, or System mode options with instant CSS variable toggling.
- **System Health Monitor:** Live ping indicators showing connection status for Core Service (Port 8081) and Analytics Service (Port 8082).

---

## 3. Component Inventory

| Category | Component File | Description & Props |
|:---|:---|:---|
| **Layout** | `AppShell.jsx` | Top-level layout container with desktop sidebar, mobile drawer, topbar, and skip-link |
| | `Sidebar.jsx` | Collapsible navigation sidebar with `NavLink` active states and theme toggle |
| **UI Primitives** | `Button.jsx` | Accessible button with variants (`primary`, `secondary`, `danger`, `ghost`), loading spinners |
| | `Badge.jsx` | Semantic color pills (`success`, `warning`, `danger`, `neutral`, `info`) |
| | `Card.jsx` | Container with subtle border, surface background, optional header, body, and footer |
| | `Input.jsx` | Text/search input with icon prefixes, error messages, and accessible label bindings |
| | `AmountInput.jsx` | Currency-specific numeric input enforcing positive decimal amounts |
| | `DateInput.jsx` | Accessible HTML5 date picker input |
| | `Select.jsx` | Dropdown selector component |
| | `SegmentedControl.jsx` | Pill-style tab switcher with keyboard navigation |
| | `Modal.jsx` | Dialog overlay with focus trap, Escape key listener, and backdrop click dismissal |
| | `ConfirmDialog.jsx` | Confirmation prompt with destructive action styling |
| | `ProgressBar.jsx` | Animated percentage progress bar with semantic color thresholds and text labels |
| | `StatCard.jsx` | Metric display card with label, formatted balance, change badge, and semantic styling |
| | `Skeleton.jsx` | Shimmer animated placeholder for loading states |
| | `Toast.jsx` | Floating toast notifications with timer dismissal and `aria-live` screen reader announcements |
| | `EmptyState.jsx` | Empty data illustration with contextual call-to-action button |
| | `ErrorState.jsx` | Error notification with retry trigger |
| | `MonthPicker.jsx` | Month-year selector with previous/next chevron buttons |
| | `ErrorBoundary.jsx` | React error boundary catching client crashes with graceful recovery card |
| | `Icon.jsx` | Lucide icon wrapper with case-insensitive name resolution and SVG paths |
| **Charts** | `CanvasChart.jsx` | Base HTML5 Canvas component managing canvas ref, HiDPI scaling, and resize observer |
| | `LineAreaChart.jsx` | Canvas 2D smooth monotone cubic spline line chart with gradient area fill |
| | `BarChart.jsx` | Canvas 2D grouped bar chart (Income vs Expense) with rounded bar corners |
| | `DonutChart.jsx` | Canvas 2D donut chart with sector hover hit-testing and centered aggregate text |
| **Forms / Modals** | `TransactionFormModal.jsx`| Create/edit modal for transactions with auto-focusing amount input |
| | `TransferModal.jsx` | Inter-account double-entry transfer dialog |
| | `AccountFormModal.jsx` | Account creation and editing dialog |
| | `BudgetModal.jsx` | Category budget limit dialog |
| | `RecurringPaymentModal.jsx` | Subscription creation and frequency configuration dialog |
| | `GoalModal.jsx` | Savings goal creation and target date configuration dialog |
| | `ExportModal.jsx` | CSV export configuration dialog with date range presets |

---

## 4. Hooks and Contexts Inventory

| Hook / Context | File Path | Concrete Usage in FinPulse |
|:---|:---|:---|
| **`useState`** | Used in all pages & modals | Form state, modal visibility, filter selections, active tabs, pagination |
| **`useEffect`** | `Dashboard.jsx`, `Transactions.jsx`, `ThemeContext.jsx`, `Modal.jsx` | Asynchronous API fetching, OS theme media query listeners, focus traps, canvas redraws |
| **`useContext`** | `src/context/*` | Accessing `AuthContext` (active user), `CurrencyContext` (native formatting), `ThemeContext` (mode), and `ToastContext` (notifications) |
| **`useMemo`** | `Transactions.jsx`, `CurrencyContext.jsx` | High-performance client filtering/sorting of ledger rows; caching `Intl.NumberFormat` instances |
| **`useRef`** | `TransactionFormModal.jsx`, `Modal.jsx`, `CanvasChart.jsx` | Auto-focusing amount input on open; modal focus traps; HTML5 Canvas DOM element binding |
| **`useCanvas`** | `src/components/charts/useCanvas.js` | Custom hook orchestrating Canvas HiDPI scaling (`devicePixelRatio`), `ResizeObserver`, and `requestAnimationFrame` lifecycle |
| **`useFinancialAnalytics`**| `src/hooks/useFinancialAnalytics.js` | Custom hook computing net cash flow, savings rate %, daily burn velocity, and budget alert flags |
| **`useLocalStorage`** | `src/hooks/useLocalStorage.js` | Persisting user settings and preferences in browser `localStorage` |
| **`useDebounce`** | `src/hooks/useDebounce.js` | Debouncing search inputs on transaction filtering (300ms delay) |
| **`useFetch`** | `src/hooks/useFetch.js` | Generic HTTP fetcher hook managing loading, data, and error states |
| **`useDocumentTitle`** | `src/hooks/useDocumentTitle.js` | Dynamically updating the browser tab title based on the active route |

---

## 5. Design System: Tokens, Themes & Accessibility

### Design Tokens (`styles/tokens.css`)
- **Color Palette (Light Theme):**
  - Background: `#F7F8FA`
  - Surface: `#FFFFFF`
  - Border: `#E5E7EB`
  - Text Primary: `#111827`
  - Text Muted: `#6B7280`
  - Accent (Deep Blue): `#2457D6`
  - Success (Income): `#059669`
  - Danger (Expense): `#DC2626`
  - Warning (Budget Alert): `#D97706`
  - Info: `#2563EB`
- **Color Palette (Dark Theme via `[data-theme="dark"]`):**
  - Background: `#0F1318`
  - Surface: `#171C23`
  - Border: `#262D36`
  - Text Primary: `#E6E9EE`
  - Text Muted: `#9AA4B2`
  - Accent: `#6C93FF`
  - Success: `#10B981`
  - Danger: `#EF4444`
  - Warning: `#F59E0B`
  - Info: `#60A5FA`
- **Typography & Geometry:**
  - Font Stack: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Numeric Formatting: `font-variant-numeric: tabular-nums` (Guarantees vertical column alignment on currency numbers)
  - Type Scale: 12px, 13px, 14px, 16px, 20px, 24px, 30px
  - Spacing Scale: 4px base grid (`var(--space-1)` through `var(--space-12)`)
  - Border Radii: 8px (inputs, badges, cards) and 12px (modals, hero sections)
  - Shadows: Subtle 1px borders with minimal elevation (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`)

### Responsive Breakpoints
1. **Desktop Wide ($\ge 1440\text{px}$):** Full 12-column grid layout; persistent expanded sidebar.
2. **Desktop / Tablet Landscape ($1024\text{px} - 1439\text{px}$):** Compact 12-column grid; responsive widget reflow.
3. **Tablet Portrait ($768\text{px} - 1023\text{px}$):** 2-column stacked layout; collapsed icon sidebar.
4. **Mobile ($\le 767\text{px}$, tested at $390\text{px}$):** Single-column stacked layout; slide-in drawer navigation; full-width action buttons; zero horizontal scroll.

### Accessibility Standards (WCAG 2.1 AA)
- Contrast ratio exceeding 4.5:1 for normal text and 3:1 for large text across both light and dark themes.
- Status is never conveyed by color alone (always paired with text badges: "OK", "WARNING", "OVER").
- Fully operable via keyboard: visible `focus-visible` rings on all interactive elements.
- Accessible modal focus traps returning focus to trigger element upon closing.
- Screen reader accessibility on Canvas charts via visually hidden HTML tables (`role="img"` with `aria-label`).
- Full support for `prefers-reduced-motion` media queries disabling animations.

---

## 6. Screenshot Shot List for Manual Capture

| # | Target Filename | Target Route / URL | Required UI State & Interactions | Viewport Resolution |
|:---:|:---|:---|:---|:---:|
| 1 | `01-dashboard-light.png` | `http://localhost:5173/` | Default view, light theme, active user (Aarav Sharma), showing 4 stat cards, cash flow bar chart, category donut, and recent ledger | 1440 × 900 (Desktop) |
| 2 | `02-dashboard-dark.png` | `http://localhost:5173/` | Dark theme toggled via sidebar/settings, showing dark palette contrast on cards and canvas charts | 1440 × 900 (Desktop) |
| 3 | `03-transactions-ledger.png` | `http://localhost:5173/transactions`| Filtered transaction list with search input active, showing category badges and green/red amount formatting | 1440 × 900 (Desktop) |
| 4 | `04-add-transaction-modal.png` | `http://localhost:5173/transactions`| Click "Add Transaction" button; modal open with autofocus on amount input | 1440 × 900 (Desktop) |
| 5 | `05-accounts-manager.png` | `http://localhost:5173/accounts` | Accounts page showing Net Worth banner, asset distribution donut chart, checking, savings, credit cards, and investments | 1440 × 900 (Desktop) |
| 6 | `06-budgets-progress.png` | `http://localhost:5173/budgets` | Budgets page showing category cards with animated progress bars reflecting OK (green), WARNING (amber), and OVER (red) statuses | 1440 × 900 (Desktop) |
| 7 | `07-recurring-subscriptions.png`| `http://localhost:5173/recurring` | Subscriptions page showing active commitments with due date badges ("Due today", "In 5 days") and "Mark Paid" buttons | 1440 × 900 (Desktop) |
| 8 | `08-savings-goals.png` | `http://localhost:5173/goals` | Goals page showing "6-Month Emergency Fund" and "Electric Scooter" cards with completion percentage and required monthly savings | 1440 × 900 (Desktop) |
| 9 | `09-reports-analytics.png` | `http://localhost:5173/reports` | Analytical reports page showing 6-month cashflow chart, category breakdown table, spending spike cards, and unused budgets | 1440 × 900 (Desktop) |
| 10| `10-reports-timeline.png` | `http://localhost:5173/reports` | Scrolled to Timeline section showing chronological stream of Actual vs Scheduled events with filter toggles | 1440 × 900 (Desktop) |
| 11| `11-settings-diagnostics.png` | `http://localhost:5173/settings` | Settings page showing profile form, currency/locale selector preview, theme options, and green microservice health badges | 1440 × 900 (Desktop) |
| 12| `12-dashboard-mobile-390.png` | `http://localhost:5173/` | Mobile viewport (iPhone 14 width), showing single-column responsive reflow, mobile header, and drawer button | 390 × 844 (Mobile) |
