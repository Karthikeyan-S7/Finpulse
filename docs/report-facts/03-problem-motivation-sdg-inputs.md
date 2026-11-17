# 03. Problem, Motivation & SDG Alignment — FinPulse

## 1. Project Motivation
Managing personal finances in the modern digital economy has become increasingly fragmented. An average working individual or student maintains multiple financial vehicles simultaneously: a primary salary checking account, a secondary emergency savings account, digital credit cards with recurring bill cycles, physical cash for incidental expenses, equity portfolios, and numerous monthly subscription services (e.g., Netflix, Spotify, gym memberships, broadband).

Commercial personal finance management (PFM) applications often suffer from critical shortcomings:
1. **Cloud Privacy Risks & Credential Demands:** Requiring direct access to sensitive banking credentials via third-party aggregators.
2. **Aggressive Monetization & Clutter:** Overloading user interfaces with credit card promotions, predatory loan offers, and extraneous visual distractions.
3. **Black-Box Analytics:** Utilizing opaque, unverified predictive models that miscalculate net cash flow or hallucinate currency conversion rates.

**FinPulse** was motivated by the need for an institutional-grade, locally hosted, privacy-preserving financial management system. By combining strict relational double-entry ledger mathematics (Spring Boot 3 + Spring Data JPA) with an unadulterated ANSI SQL analytical engine (Pure JDBC), FinPulse delivers mathematical transparency, zero data leakage, and actionable insights.

---

## 2. Problem Statement: Real-World Finance Problems Solved

| Real-World Personal Finance Problem | FinPulse Solution / Concrete Feature | Concrete Implementation Files |
|:---|:---|:---|
| **Fragmented Net Worth & Hidden Debt:** Individuals often track liquid bank balances while ignoring mounting credit card debt and loan liabilities, leading to a distorted sense of wealth. | **Multi-Type Account Ledger with Liability Modeling:** Unifies checking, savings, credit card, cash, investment, and loan accounts. Enforces negative balance conventions for liabilities so that Net Worth = $\sum (\text{Assets}) - \sum (\text{Liabilities})$. | `Account.java`<br/>`AccountService.java`<br/>`Accounts.jsx` |
| **Unconscious Lifestyle Inflation & Spending Surges:** Gradual spending creep in discretionary categories (dining, shopping, entertainment) often goes unnoticed until savings are depleted. | **Spending Spike Anomaly Detection (Subquery):** Correlated SQL subquery analyzes current month expenditure against a rolling 3-month average, alerting users when category spending surges past 120% of normal baseline. | `SqlQueryCatalog.java` (`SPENDING_SPIKES_QUERY`)<br/>`Reports.jsx` |
| **"Zombie" Subscriptions & Forgotten Recurring Charges:** Monthly auto-debits for unused streaming, apps, or gym memberships quietly drain accounts without active user awareness. | **Recurring Merchant Discovery (SQL INTERSECT):** Performs an ANSI SQL `INTERSECT` between current and previous month merchant charges, identifying repeating subscription vendors and displaying their cumulative costs. | `SqlQueryCatalog.java` (`RECURRING_MERCHANTS_INTERSECT_QUERY`)<br/>`Recurring.jsx` |
| **Idle & Trapped Budget Allocations:** Users set monthly budgets but fail to identify when money allocated to specific categories remains unspent, preventing timely reallocation toward debt or savings. | **Unused Budget Optimization (SQL EXCEPT):** ANSI SQL `EXCEPT` operation isolates categories that have allocated budgets but zero recorded expense transactions in the active month. | `SqlQueryCatalog.java` (`UNUSED_BUDGETS_EXCEPT_QUERY`)<br/>`Reports.jsx` |
| **Short-Term Cash Flow & Liquidity Blindspots:** Users fail to anticipate upcoming bills against current checking balances, resulting in overdraft fees or failed auto-debits. | **Unified 60-Day Cash Flow Timeline (SQL UNION):** ANSI SQL `UNION` combines actual historical debits (last 30 days) with upcoming recurring obligations (next 30 days) into a chronological forecast stream. | `SqlQueryCatalog.java` (`TIMELINE_UNION_QUERY`)<br/>`Reports.jsx` |
| **Unachieved Long-Term Savings Goals:** Users set vague savings goals (e.g., "buy a vehicle") without calculating the exact monthly commitment required to reach the target on time. | **Savings Goal Amortization Calculator:** Computes completion percentage and dynamically amortizes required monthly contributions based on remaining months until target date: $\text{Monthly} = \frac{\text{Target} - \text{Saved}}{\text{Months Remaining}}$. | `SavingsGoalService.java`<br/>`Goals.jsx` |
| **Financial Ledger Desynchronization:** Transferring funds between checking and savings often results in duplicate income/expense entries that distort cash flow reports. | **Atomic Double-Entry Transfer Engine:** Executes paired debit/credit transactions with a shared UUID `transfer_group_id` under ACID `@Transactional` rollback protection, strictly excluding transfers from income/expense metrics. | `TransferService.java`<br/>`TransferModal.jsx` |
| **Data Lock-In & Spreadsheet Export Exploitation:** Exporting transactions to CSV often exposes users to formula injection attacks (`=cmd|' /C calc'!A0`) or memory exhaustion on large datasets. | **Secure Unbuffered CSV Streaming:** Pure JDBC `ResultSet` cursor streams CSV data directly to the HTTP response, automatically sanitizing formula triggers (`=`, `+`, `-`, `@`) with tab prefixes. | `JdbcReportRepository.java` (`streamTransactionsCsv`)<br/>`ExportModal.jsx` |

---

## 3. UN Sustainable Development Goals (SDG) Alignment

### Primary Goal: SDG 8 — Decent Work and Economic Growth
- **Target 8.10:** *Strengthen the capacity of domestic financial institutions to encourage and expand access to banking, insurance, and financial services for all.*
- **Two-Sentence Justification:**
  > FinPulse directly advances SDG Target 8.10 by equipping individuals with institutional-grade personal financial budgeting tools, multi-account debt tracking, and automated savings amortization schedules that foster sound personal financial discipline. By providing transparent net-worth tracking and dynamic burn-rate analytics without third-party fees or cloud lock-in, the platform democratizes digital financial literacy and empowers users to maintain liquidity, avoid predatory debt traps, and build long-term economic resilience.

### Secondary Goal: SDG 12 — Responsible Consumption and Production
- **Target 12.8:** *Ensure that people everywhere have the relevant information and awareness for sustainable development and lifestyles in harmony with nature.*
- **Two-Sentence Justification:**
  > FinPulse operationalizes SDG Target 12.8 by providing consumers with actionable visibility into their recurring spending habits through automated spending spike detection and category breakdown visualizations that expose wasteful consumption patterns. Through its SQL INTERSECT-powered recurring merchant discovery, the system actively highlights repeating subscription fees and zombie bills, encouraging individuals to eliminate unnecessary digital consumption and practice mindful, sustainable financial habits.

---

## 4. User Personas, Audience Needs & Differentiators

### Audience Segmentation
1. **Primary: Early-Career Professionals & Salaried Employees (Age 21–35)**
   - *Needs:* Unified visibility across salary checking, emergency savings, and credit cards; tracking recurring lifestyle subscriptions (rent, utilities, gym, streaming); automated monthly savings targets.
2. **Secondary: College Students & Budget-Conscious Individuals**
   - *Needs:* Strict category spending limits (groceries, dining, entertainment); early warning notifications before budgets are breached; simple, responsive mobile-friendly interface.
3. **Tertiary: Academic & Technical Evaluators**
   - *Needs:* Clean, verifiable codebase demonstrating full-stack competencies (REST APIs, relational modeling, pure JDBC, reactive state, custom Canvas 2D graphics) without reliance on bloated third-party abstractions.

### Product Differentiators
- **Zero Third-Party Chart Bloat:** Visualizations are rendered using a custom HTML5 Canvas 2D engine (`useCanvas.js`) with sub-millisecond draw times and zero runtime library overhead (no Chart.js, Recharts, or D3).
- **Pure Relational ANSI SQL Analytics:** Analytics microservice bypasses ORM overhead entirely, demonstrating raw SQL mastery (`UNION`, `INTERSECT`, `EXCEPT`, correlated subqueries).
- **Zero Financial Hallucination:** All currency formatting uses standard browser `Intl.NumberFormat`; no hardcoded exchange rates, mock dividends, or fake crypto feeds.
- **Resilient Microservice Decoupling:** Core transaction ledger and analytical reporting operate on independent Spring Boot microservices (ports 8081 and 8082); if analytics goes offline, the core ledger remains fully operational.
- **Accessibility & Theme Inclusivity:** Full WCAG AA color contrast compliance, automatic OS `prefers-color-scheme` adaptation, keyboard-trapped modals, and hidden data tables for screen reader accessibility.

### Core Product Values
1. **Integrity & Accuracy:** Double-entry ledger mathematics; zero floating-point rounding errors on currency (`DECIMAL(15,2)`).
2. **Calm, Trustworthy UX:** Information-dense, restrained fintech design (Stripe/Linear inspired) with no neon gradients, emojis, or intrusive decorative clutter.
3. **User Autonomy:** Local-first architecture; full data exportability via CSV without proprietary locking.
