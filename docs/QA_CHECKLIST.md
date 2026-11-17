# FinPulse v2.0 — End-to-End QA Click-Through Verification Checklist

This document provides a comprehensive, step-by-step manual test guide covering every page, flow, edge case, and accessibility requirement in FinPulse.

---

## Pre-Flight: Environment & Service Verification

1. **Start System:** Open PowerShell and execute `.\start-all.ps1`.
   - Confirm all three services initialize:
     - Core Transactional Service: `http://localhost:8081`
     - Analytics JDBC Service: `http://localhost:8082`
     - React Frontend: `http://localhost:5173`
   - Confirm browser automatically opens to `http://localhost:5173`.
2. **Execute Smoke Tests:** In a separate terminal, execute `.\scripts\smoke-test.ps1`.
   - Confirm that all **35 API endpoints** pass with green `[PASS]` status and `0 Failed`.

---

## Test Flow 1: Global Navigation & Theme Switching

- [ ] **Desktop Navigation:** Click through sidebar navigation items: *Dashboard, Transactions, Accounts, Budgets, Recurring, Goals, Reports, Settings*. Confirm that the active route highlights with a crisp accent bar and `aria-current="page"`.
- [ ] **Collapsible Sidebar:** Click the collapse button at the bottom of the sidebar. Confirm that the sidebar smoothly collapses to icon-only mode with tooltips, and the main layout grid expands responsively. Click again to expand.
- [ ] **Theme Switching (Topbar Pill & Settings):**
  - Click the theme toggle icon in the topbar (cycles between Light and Dark).
  - Confirm instant palette switch to dark mode (`#0F1318` background, `#171C23` cards, `#E6E9EE` text).
  - Open Developer Tools, reload the page (`F5`), and verify the selected theme persists without flickering.
- [ ] **Responsive Navigation:**
  - Resize browser viewport to $< 768\text{px}$ (tablet) and $< 640\text{px}$ (mobile).
  - Confirm the desktop sidebar collapses into a slide-over mobile drawer triggered by the hamburger icon.
  - Confirm that bottom navigation tabs appear on mobile screens.

---

## Test Flow 2: Dashboard Overview (`/`)

- [ ] **Greeting & Month Selector:** Confirm header displays personalized greeting (*"Good evening, Aarav"* or time-appropriate) and the active month selector. Change the month and confirm data updates.
- [ ] **Metric StatCards:** Verify the 4 top metrics:
  - *Net Worth:* Equals total assets minus liabilities across non-archived accounts.
  - *Income & Expenses:* Displays total monthly inflows and outflows with percentage change vs. prior month.
  - *Savings Rate:* Displays percentage of income retained.
- [ ] **Interactive Canvas Charts:**
  - **Cash Flow Bar Chart:** Hover mouse or tap on bars. Confirm crisp 2D canvas rendering with DOM tooltip displaying exact month, income, expenses, and net delta.
  - **Category Donut Chart:** Hover mouse over slices. Verify hovered segment expands slightly (+4px) and displays category share percentage in the tooltip.
- [ ] **Analytical Insights Strip:** Confirm top 3 plain-language insight banners:
  - *Spending Spike:* Deep-links to `/reports?section=spending-spikes`.
  - *Zero-Burn Budgets:* Deep-links to `/reports?section=unused-budgets`.
  - *Repeat Vendors:* Deep-links to `/reports?section=recurring-merchants`.
- [ ] **Recent Transactions:** Displays the 8 most recent transactions with type badges and tabular amounts.
- [ ] **Budgets at Risk Widget:** Displays the top 3 budgets with highest percent utilized, with color-coded status badges and progress bars.
- [ ] **Upcoming Bills Widget:** Displays upcoming recurring bills with relative countdown badges (*Due in 3d*, *Due Today*), and a 1-click **"Pay"** button. Click "Pay" and confirm toast notification fires with schedule advancement.

---

## Test Flow 3: Financial Ledger (`/transactions`)

- [ ] **Search & Live Filtering:**
  - Type `"Swiggy"` in the search input. Confirm debounced filtering across merchants and notes.
  - Select transaction type filter: toggle between *All Activity*, *Expenses Only*, and *Income Only*.
  - Filter by Category (e.g. *Groceries & Essentials*).
  - Filter by Account (e.g. *HDFC Checking*).
- [ ] **Date Presets:** Click date presets (*This Month, Last Month, Last 90 Days, Year to Date, All Time*). Confirm table and summary totals update instantaneously.
- [ ] **Filtered Set Totals:** Verify the summary bar below the toolbar displays total Income, Expenses, and Net balance for the filtered subset.
- [ ] **Transfer Consolidation:** Verify inter-account transfers are consolidated into single readable entries: `Transfer: HDFC Checking → ICICI Savings` with neutral transfer badges.
- [ ] **Add Transaction Flow:**
  - Click **"+ Add Transaction"**. Confirm modal opens and autofocuses the amount input.
  - Enter amount: `750.00`, Payee: `"Test Grocery Mart"`, Category: `Groceries & Essentials`, Account: `HDFC Checking`.
  - Click **"Save & Add Another"**. Confirm transaction is recorded, success toast appears, and form resets with amount input refocused for rapid entry.
  - Add another transaction and click **"Save Transaction"**. Modal closes and table refreshes.
- [ ] **Overdraft Protection Guard:**
  - Open "+ Add Transaction". Select a checking account with balance ₹50,000.
  - Enter expense amount: `999999.00`. Click Save.
  - Confirm an alert banner displays: `"Insufficient funds in account '...' (HTTP 409 Conflict)"`. The form stays open without crashing.
- [ ] **Edit & Delete Transactions:**
  - Click the edit (pencil) icon on any transaction. Change the note or amount and save.
  - Click the delete (trash) icon. Confirm `ConfirmDialog` opens with warning text. Confirm deletion and verify toast notice.

---

## Test Flow 4: Accounts Management (`/accounts`)

- [ ] **Net Worth Header:** Displays Total Assets, Total Liabilities (styled in bold red), and Net Worth.
- [ ] **Asset Allocation Donut:** Verifies positive accounts (Checking, Savings, Investment, Cash) are visualized in the canvas donut chart with hover tooltips.
- [ ] **Account Groups:** Accounts are organized into sections by type (*Cash & Checking, Savings & Deposits, Investments, Credit Cards & Liabilities*).
- [ ] **Add Account Flow:** Click "+ Add Account". Create a new `SAVINGS` account with initial balance `25000.00`. Confirm new account card appears under Savings.
- [ ] **Archive vs. Hard Delete:**
  - Click delete on the newly created empty account. Confirm API hard-deletes the row. Toast states: `"Account permanently deleted"`.
  - Click delete on an established account with past transactions. Confirm API archives the account instead. Toast states: `"Account contains transactions and has been safely archived to protect ledger history"`.
- [ ] **Archived Accounts Toggle:** Click the "Show Archived Accounts" toggle. Confirm archived accounts appear in a semi-transparent state.
- [ ] **Investment Valuation Adjustment:**
  - Locate an `INVESTMENT` account (e.g., *Zerodha Equity Portfolio*).
  - Click **"Update Valuation"**. Enter a new market value.
  - Confirm that FinPulse automatically records a valuation adjustment transaction in the ledger to keep historical audits synchronized.

---

## Test Flow 5: Budget Planning (`/budgets`)

- [ ] **Month Navigation:** Use `<` and `>` or the `MonthPicker` to select previous/future months.
- [ ] **Summary Health Bar:** Displays Total Budgeted, Total Spent, and Remaining Budget with visual ratio bar.
- [ ] **Budget Cards & Status Thresholds:**
  - $\le 80\%$: Green progress bar with explicit text label `On Track`.
  - $80\% - 100\%$: Amber progress bar with explicit text label `Warning`.
  - $> 100\%$: Red progress bar with explicit text label `Over Limit`.
- [ ] **Smart 3-Month Average Limit Suggestion:**
  - Click **"+ Create Budget"**.
  - Select category *Dining & Takeout*.
  - Verify that an inline suggestion prompt appears: *"3-Month Trailing Average: ₹X,XXX.XX"* with a 1-click **"Use suggestion"** button.
  - Click "Use suggestion" and confirm the amount input auto-populates with that exact value.
- [ ] **Duplicate Guard:** Verify that categories already budgeted for the active month are disabled in the category dropdown.
- [ ] **Unbudgeted Spending Strip:** If categories recorded spending in the active month without a budget rule, verify they are listed in the subtle alert strip with a 1-click **"+ Budget"** shortcut.
- [ ] **Copy From Last Month:** Click **"Copy from Last Month"**. Confirm that budget categories and limits from the previous month duplicate into the current month via `POST /api/budgets/copy`.

---

## Test Flow 6: Recurring Commitments (`/recurring`)

- [ ] **Run Rate Metric Cards:**
  - *Monthly Commitment:* Displays normalized monthly outflow (accounting for Weekly $\times 52/12$, Monthly, and Yearly $/12$).
  - *Annual Run Rate:* Displays projected 12-month outflow.
  - *Due in Next 7 Days:* Displays count of upcoming bills.
- [ ] **Chronological Sorting & Due Badges:**
  - Commitments are ordered by upcoming `nextDueDate`.
  - Badges: `Overdue (Xd)` (danger), `Due Today` (warning), `Due in Nd` (info), `Paused` (neutral).
- [ ] **"Mark Paid" Workflow:**
  - Click **"Pay"** on any active commitment.
  - Confirm API advances `nextDueDate` (Weekly +7d, Monthly +1mo, Yearly +1yr) and automatically records an expense transaction in the ledger.
  - Confirm toast notice states: *"Recorded payment of ₹X. Next scheduled date: ..."*.
- [ ] **Pause / Resume Toggle:**
  - Click "Pause" on a commitment. Confirm status changes to `Paused`, opacity dims slightly, and monthly commitment total recalculates without it.
  - Click "Resume" to restore active schedule.
- [ ] **Add / Edit / Delete Commitment:**
  - Click "+ Add Recurring". Enter Name, Merchant, Category, Amount, Frequency (`MONTHLY`), Next Due Date, and Account.
  - Save and verify entry appears in schedule.
  - Delete commitment via `ConfirmDialog`.

---

## Test Flow 7: Savings Goals (`/goals`)

- [ ] **Goal Cards Grid:** Displays goal title, target completion date, saved amount, target amount, and percentage funded.
- [ ] **Monthly Pace Callout:** Shows required monthly savings pace (*"Save ₹X / month to reach your target by date"*).
- [ ] **Incremental Contribution ("Add Money"):**
  - Click **"Add Money"** on an active goal.
  - Click quick preset chip: `+₹5,000`. Confirm amount input populates with `5000.00`.
  - Click **"Confirm Deposit"**. Verify saved amount increments and progress bar advances.
- [ ] **100% Milestone Celebration:**
  - Contribute enough funds to reach $\ge 100\%$ on a goal.
  - Confirm card transitions to achievement state (green border, `Completed` badge, success callout) and a celebratory toast fires: *"🎉 Congratulations! You reached your goal!"*.

---

## Test Flow 8: Reports & Analytics (`/reports`)

- [ ] **6-Month Cash Flow Bar Chart:** Verify Pure JDBC query outputs 6-month bars.
- [ ] **Where the Money Went:** Donut chart and sortable table with category expenditure breakdown.
- [ ] **Spending Spikes (Correlated Subquery):**
  - Cards show categories with $>120\%$ spend vs. 3-month trailing average.
  - If no spikes exist, displays positive empty state: *"No unusual spending spikes this month!"*.
- [ ] **Recurring Merchants (SQL INTERSECT):** Tabulates payees billed across consecutive months with subscription tagging.
- [ ] **Unused Budgets (SQL EXCEPT):** Lists budgeted categories with zero expense recorded, highlighting available surplus funds.
- [ ] **Timeline Projection (SQL UNION):**
  - Chronologically merges past 30 days of actual transactions with next 30 days of scheduled commitments.
  - Toggle segmented filter: `All (60 Days)`, `Actual (Past)`, `Scheduled (Next)`.
- [ ] **CSV Data Export:**
  - Click date presets (*Last 90 Days*, *Last 6 Months*, *All History*).
  - Verify filename preview: `finpulse-transactions-{from}_{to}.csv`.
  - Click **"Download Verified CSV Export"**. Confirm browser downloads valid UTF-8 CSV containing all transaction columns.

---

## Test Flow 9: Settings, Regional Formatting & Service Health (`/settings`)

- [ ] **Profile Updates:** Change Full Name and Email Address. Click "Save Profile". Confirm success toast and updated greeting across pages.
- [ ] **Live Currency Formatting Preview:**
  - Select Currency: `USD ($)`.
  - Select Locale: `en-US`.
  - Observe the **Live Number Formatting Preview** card updating in real time to `$125,450.75`.
  - Click "Save Regional Preferences".
  - Navigate to Dashboard, Transactions, Accounts, and Reports. Confirm **every financial amount across the entire application is now formatted in USD (`$`)**!
  - Switch back to `INR (₹)` and `en-IN`. Confirm all amounts revert to Indian Rupee formatting (`₹1,25,000.00`).
- [ ] **Service Health Probes:**
  - Check the "About & Service Health" card.
  - Verify green indicators for *Core Transactional Service (Port 8081)* and *Analytics JDBC Service (Port 8082)*.
  - Click **"Refresh"** to trigger a real-time connectivity probe.

---

## Test Flow 10: Accessibility & Resilience Verification

- [ ] **Keyboard-Only Navigation:** Unplug or ignore mouse. Press `Tab` and `Shift+Tab` to navigate through topbar, sidebar, table rows, and modal inputs. Confirm visible focus ring (`:focus-visible`) is always prominently visible.
- [ ] **Modal Focus Trap:** Open any modal. Press `Tab` repeatedly. Confirm focus wraps within modal elements and does not escape to the background document. Press `Escape` to close modal; confirm focus returns to the opening trigger button.
- [ ] **Screen Reader Labels:** Confirm all icon-only buttons carry descriptive `aria-label` attributes (e.g. `aria-label="Delete commitment"`, `aria-label="Close dialog"`).
- [ ] **Service Downtime Resilience:**
  - Stop the analytics service on port 8082 (`Stop-Process -Id <pid>`).
  - Refresh the Dashboard. Confirm the app does not crash: core widgets continue to function, and the insights strip displays an inline offline notice with a retry button.
  - Visit `/reports`. Confirm clear `ErrorState` banner explaining port 8082 downtime with a retry button.
  - Restart analytics service and click "Retry". Confirm data reloads immediately.
