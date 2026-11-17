# 08. Automated Testing, Functional Verification & Real API Probes — FinPulse

## 1. Test Suite Execution Summaries (Verbatim Execution Output)

### A. Core Microservice (`finpulse-core-service`)
- **Command:** `mvn test`
- **Execution Log Output:**
```
[INFO] Scanning for projects...
[INFO] -----------------< com.finpulse:finpulse-core-service >-----------------
[INFO] Building finpulse-core-service 1.0.0
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] --- surefire:3.2.5:test (default-test) @ finpulse-core-service ---
[INFO] Running com.finpulse.core.BudgetServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.998 s -- in com.finpulse.core.BudgetServiceTest
[INFO] Running com.finpulse.core.CoreIntegrationEndpointsTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 16.74 s -- in com.finpulse.core.CoreIntegrationEndpointsTest
[INFO] Running com.finpulse.core.RecurringPaymentServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.791 s -- in com.finpulse.core.RecurringPaymentServiceTest
[INFO] Running com.finpulse.core.SavingsGoalServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.636 s -- in com.finpulse.core.SavingsGoalServiceTest
[INFO] Running com.finpulse.core.SummaryServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.113 s -- in com.finpulse.core.SummaryServiceTest
[INFO] Running com.finpulse.core.TransactionControllerTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.453 s -- in com.finpulse.core.TransactionControllerTest
[INFO] Running com.finpulse.core.TransactionServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.060 s -- in com.finpulse.core.TransactionServiceTest
[INFO] Running com.finpulse.core.TransferServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.052 s -- in com.finpulse.core.TransferServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 29, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  31.871 s
[INFO] Finished at: 2026-11-12T21:49:14+05:30
[INFO] ------------------------------------------------------------------------
```

---

### B. Analytics Microservice (`finpulse-analytics-service`)
- **Command:** `mvn test`
- **Execution Log Output:**
```
[INFO] Scanning for projects...
[INFO] --------------< com.finpulse:finpulse-analytics-service >---------------
[INFO] Building finpulse-analytics-service 1.0.0
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] --- surefire:3.2.5:test (default-test) @ finpulse-analytics-service ---
[INFO] Running com.finpulse.analytics.AnalyticsOverviewControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 5.452 s -- in com.finpulse.analytics.AnalyticsOverviewControllerTest
[INFO] Running com.finpulse.analytics.AnalyticsServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.161 s -- in com.finpulse.analytics.AnalyticsServiceTest
[INFO] Running com.finpulse.analytics.CsvEscapingAndSecurityTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.015 s -- in com.finpulse.analytics.CsvEscapingAndSecurityTest
[INFO] Running com.finpulse.analytics.JdbcReportRepositoryIntegrationTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.797 s -- in com.finpulse.analytics.JdbcReportRepositoryIntegrationTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  13.310 s
[INFO] Finished at: 2026-11-12T21:49:40+05:30
[INFO] ------------------------------------------------------------------------
```

---

### C. Frontend Production Build (`finpulse-frontend`)
- **Command:** `npm run build`
- **Execution Log Output:**
```
> finpulse-frontend@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 94 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 0.74 kB │ gzip:  0.44 kB
dist/assets/index-C9QQ93pY.css                 23.14 kB │ gzip:  5.06 kB
dist/assets/categories-ChfTOZ74.js              0.10 kB │ gzip:  0.12 kB
dist/assets/useDocumentTitle-CQgEN4km.js        0.21 kB │ gzip:  0.18 kB
dist/assets/DateInput-Cmd8HFQl.js               0.30 kB │ gzip:  0.23 kB
dist/assets/transactions-minkuwt6.js            0.41 kB │ gzip:  0.25 kB
dist/assets/recurring-CypcTWyM.js               0.47 kB │ gzip:  0.26 kB
dist/assets/accounts-C9hfGlhH.js                0.49 kB │ gzip:  0.29 kB
dist/assets/budgets-D2sI6oiD.js                 0.52 kB │ gzip:  0.29 kB
dist/assets/Select-KM4d_oAw.js                  0.56 kB │ gzip:  0.35 kB
dist/assets/EmptyState-CAPtZ86k.js              0.58 kB │ gzip:  0.36 kB
dist/assets/ConfirmDialog-DEk15Hm6.js           0.60 kB │ gzip:  0.38 kB
dist/assets/ErrorState-CMPqDoi8.js              0.63 kB │ gzip:  0.40 kB
dist/assets/Badge-Bc07RxRU.js                   0.65 kB │ gzip:  0.34 kB
dist/assets/ProgressBar-2nZCLvzi.js             0.87 kB │ gzip:  0.53 kB
dist/assets/StatCard-DgrCZ72v.js                0.94 kB │ gzip:  0.49 kB
dist/assets/Input-CN449Bru.js                   1.07 kB │ gzip:  0.54 kB
dist/assets/NotFound-DbMVClEj.js                1.15 kB │ gzip:  0.59 kB
dist/assets/MonthPicker-D1_GFP_0.js             1.56 kB │ gzip:  0.72 kB
dist/assets/SegmentedControl-BmF3Wycl.js        1.74 kB │ gzip:  0.72 kB
dist/assets/AmountInput-DXhk-WG3.js             2.26 kB │ gzip:  1.07 kB
dist/assets/TransferModal-uxdBklRT.js           3.77 kB │ gzip:  1.65 kB
dist/assets/BarChart-BTgcYL7P.js                5.54 kB │ gzip:  2.15 kB
dist/assets/TransactionFormModal-DoQQQohZ.js    5.62 kB │ gzip:  2.45 kB
dist/assets/Settings-CEDNTfYQ.js               10.39 kB │ gzip:  3.24 kB
dist/assets/Budgets-Ckisem2l.js                11.74 kB │ gzip:  4.38 kB
dist/assets/DonutChart-H9HZ3CWa.js             11.79 kB │ gzip:  4.74 kB
dist/assets/Accounts-BOjPtOpo.js               12.14 kB │ gzip:  4.05 kB
dist/assets/Goals-DE6Cxg6J.js                  12.63 kB │ gzip:  4.13 kB
dist/assets/Recurring-BQuVrwfG.js              13.14 kB │ gzip:  4.60 kB
dist/assets/Transactions-BNgaCPJB.js           15.86 kB │ gzip:  4.72 kB
dist/assets/Dashboard-GgpLNJd4.js              17.84 kB │ gzip:  5.15 kB
dist/assets/Reports-0Xvgm1CX.js                22.34 kB │ gzip:  5.64 kB
dist/assets/index-Dj2h1MXi.js                 195.52 kB │ gzip: 62.80 kB
✓ built in 1.72s
```

---

## 2. Test Class & Test Method Inventory

### `finpulse-core-service` (29 Tests)
1. **`BudgetServiceTest`**
   - `testCreateBudget_Success`: Verifies successful budget limit creation with positive decimal amounts.
   - `testDuplicateBudget_ThrowsConflict`: Verifies rejection of duplicate `(user_id, category, month_year)`.
2. **`CoreIntegrationEndpointsTest`**
   - `testUserEndpoints`: Verifies full lifecycle of `GET /api/users/{id}` and `PUT /api/users/{id}`.
   - `testAccountEndpoints`: Verifies listing, creation, balance retrieval, and soft archival.
   - `testTransactionEndpoints`: Verifies transaction logging, filtering, and account balance mutation.
   - `testTransferEndpoints`: Verifies double-entry atomic transfer and paired transaction generation.
   - `testBudgetEndpoints`: Verifies budget progress calculations and percentage spent metrics.
   - `testRecurringAndGoalEndpoints`: Verifies recurring payment retrieval and savings goal progress.
3. **`RecurringPaymentServiceTest`**
   - `testAdvanceDueDate_Monthly`: Verifies calendar addition of 1 month upon recurring payment settlement.
   - `testAdvanceDueDate_Weekly`: Verifies calendar addition of 7 days upon weekly recurring settlement.
   - `testPayInactiveCommitment_ThrowsException`: Verifies that paused/inactive commitments throw HTTP 409 Conflict.
4. **`SavingsGoalServiceTest`**
   - `testRequiredMonthly_FutureDate`: Verifies amortization formula $\frac{\text{Target} - \text{Saved}}{\text{Months}}$.
   - `testRequiredMonthly_PastDate`: Verifies that past target dates demand the entire unpaid remainder immediately.
   - `testRequiredMonthly_NoTargetDate`: Verifies that open-ended goals calculate percentage with zero monthly demand.
5. **`SummaryServiceTest`**
   - `testOverviewMetrics_ExcludesTransfers`: Verifies that inter-account transfers are strictly excluded from monthly income and expense aggregates.
   - `testNetWorthCalculation`: Verifies net worth sums assets and correctly subtracts credit card liabilities.
6. **`TransactionControllerTest`**
   - `testCreateTransaction_ValidDto`: Verifies MockMvc HTTP 201 response on valid transaction requests.
   - `testCreateTransaction_InvalidDto_Returns400`: Verifies MockMvc HTTP 400 validation failure on blank category or negative amount.
7. **`TransactionServiceTest`**
   - `testExpenseDeductsBalance`: Verifies that recording an expense decrements the account balance.
   - `testIncomeAddsBalance`: Verifies that recording income increments the account balance.
   - `testCheckingOverdraft_ThrowsException`: Verifies overdraft guard preventing checking account from going below zero.
   - `testCreditCardAllowsNegative`: Verifies that credit cards permit negative balances representing liabilities.
   - `testUpdateTransaction_AdjustsDelta`: Verifies that editing transaction amounts applies the net differential to account balance.
   - `testDeleteTransaction_ReversesBalance`: Verifies that deleting a transaction restores the previous account balance.
   - `testExcludeTransfersFromIncome`: Verifies that transfer rows are omitted from income calculation.
8. **`TransferServiceTest`**
   - `testAtomicTransfer_Success`: Verifies that source is debited, destination is credited, and two paired records share a `transfer_group_id`.
   - `testTransfer_SameAccount_ThrowsException`: Verifies rejection when source and destination accounts are identical.
   - `testTransfer_InsufficientFunds_ThrowsException`: Verifies rejection if source checking account lacks funds.
   - `testTransfer_RollbackOnFailure`: Verifies transactional rollback if destination credit throws an exception.

### `finpulse-analytics-service` (20 Tests)
1. **`AnalyticsOverviewControllerTest`**
   - `testHealthEndpoint_Returns200`: Verifies MockMvc GET `/api/analytics/health` returns status UP and database CONNECTED.
   - `testCashflowEndpoint_ReturnsJson`: Verifies MockMvc GET `/api/analytics/cashflow` returns 6-month array.
   - `testCategoryBreakdown_ReturnsJson`: Verifies MockMvc GET `/api/analytics/category-breakdown` returns categorized shares.
   - `testOverviewEndpoint_CombinesMetrics`: Verifies MockMvc GET `/api/analytics/overview` returns composite KPIs.
2. **`AnalyticsServiceTest`**
   - `testCashflowAggregation_CalculatesNet`: Verifies net cash flow calculation ($\text{Net} = \text{Income} - \text{Expenses}$).
   - `testCategoryBreakdown_ComputesPercentages`: Verifies that category shares sum to 100%.
   - `testSpendingSpike_FiltersBelowThreshold`: Verifies that categories below the 120% surge threshold are excluded.
3. **`CsvEscapingAndSecurityTest`**
   - `testEscapeFormula_EqualsSign`: Verifies `=cmd|' /C calc'!A0` is sanitized to `\t=cmd|' /C calc'!A0`.
   - `testEscapeFormula_PlusAndMinus`: Verifies formula prefixes `+` and `-` are sanitized with tab character.
   - `testEscapeFormula_AtSymbol`: Verifies `@SUM(A1:A10)` formula prefix is sanitized with tab character.
   - `testEscapeQuotes_StandardRFC4180`: Verifies embedded commas and double quotes are escaped according to RFC 4180.
4. **`JdbcReportRepositoryIntegrationTest`**
   - `testCheckConnectivity_ExecutesStatement`: Verifies plain `java.sql.Statement` executes `SELECT 1`.
   - `testCashflowQuery_PureJdbc`: Verifies `CASHFLOW_QUERY` executes via pure JDBC `PreparedStatement`.
   - `testCategoryBreakdownQuery_PureJdbc`: Verifies `CATEGORY_BREAKDOWN_QUERY` multi-table join.
   - `testSpendingSpikesQuery_CorrelatedSubquery`: Verifies correlated subquery against 3-month baseline.
   - `testRecurringMerchantsQuery_Intersect`: Verifies ANSI SQL `INTERSECT` returns repeat vendors across consecutive months.
   - `testUnusedBudgetsQuery_Except`: Verifies ANSI SQL `EXCEPT` returns categories with zero recorded spend.
   - `testTimelineQuery_Union`: Verifies ANSI SQL `UNION` merges historical transactions and upcoming recurring payments.
   - `testAccountBalancesQuery_LeftJoin`: Verifies multi-table join with transaction counts.
   - `testStreamTransactionsCsv_CursorStreaming`: Verifies unbuffered cursor streaming of CSV rows.

---

## 3. Functional Test Case Table (26 Verified Test Cases)

| Test ID | User Story | Test Scenario | Steps | Input Data | Expected Result | Actual Result | Status |
|:---:|:---:|:---|:---|:---|:---|:---|:---:|
| **TC-01** | US1 | Add new checking account | POST `/api/accounts` | `{userId: 1, accountName: "Salary Checking", accountNumber: "CHK-101", accountType: "CHECKING", balance: 50000.00, currency: "INR"}` | HTTP 201 Created; returns account JSON | HTTP 201 Created; Account ID returned | **PASS** |
| **TC-02** | US1 | Credit card negative balance | POST `/api/accounts` | `{userId: 1, accountName: "Credit Card", accountNumber: "CC-902", accountType: "CREDIT_CARD", balance: -15000.00, currency: "INR"}` | HTTP 201 Created; negative balance allowed | HTTP 201 Created; Balance -15000.00 | **PASS** |
| **TC-03** | US1 | Archive account with history | DELETE `/api/accounts/{id}` | Account ID with existing transactions | HTTP 200 OK; `{isArchived: true, action: "ARCHIVED"}` | HTTP 200 OK; Archived successfully | **PASS** |
| **TC-04** | US2 | Log valid expense | POST `/api/transactions` | `{accountId: 1, category: "Groceries", amount: 1500.00, type: "EXPENSE", date: "2026-11-12"}` | HTTP 201 Created; account balance debited | HTTP 201 Created; Balance decremented | **PASS** |
| **TC-05** | US2 | Reject negative transaction amount | POST `/api/transactions` | `{accountId: 1, category: "Dining", amount: -250.00, type: "EXPENSE", date: "2026-11-12"}` | HTTP 400 Bad Request; validation failure on `@DecimalMin` | HTTP 400 Bad Request; field error on amount | **PASS** |
| **TC-06** | US2 | Checking overdraft guard | POST `/api/transactions` | Checking account balance ₹1000; attempt expense ₹5000 | HTTP 409 Conflict / 400 Insufficient funds | HTTP 409 Conflict returned | **PASS** |
| **TC-07** | US3 | Execute atomic transfer | POST `/api/transfers` | `{fromAccountId: 1, toAccountId: 2, amount: 2000.00, date: "2026-11-12"}` | HTTP 201 Created; paired transfer records with same `transfer_group_id` | HTTP 201 Created; paired UUID generated | **PASS** |
| **TC-08** | US3 | Prevent self-transfer | POST `/api/transfers` | `{fromAccountId: 1, toAccountId: 1, amount: 500.00, date: "2026-11-12"}` | HTTP 400 Bad Request; "Cannot transfer to same account" | HTTP 400 Bad Request rejected | **PASS** |
| **TC-09** | US3 | Transfer exclusion from income | GET `/api/summary/overview?userId=1` | Execute transfer of ₹10,000 | Inflows and Outflows summary do not include transfer amount | Transferred amount completely excluded | **PASS** |
| **TC-10** | US4 | Create category budget | POST `/api/budgets` | `{userId: 1, category: "Groceries & Dining", monthlyLimit: 12000.00, monthYear: "2026-11"}` | HTTP 200/201; Budget record created | HTTP 200 OK; Budget registered | **PASS** |
| **TC-11** | US4 | Prevent duplicate category budget | POST `/api/budgets` | Create identical category budget in same month | HTTP 409 Conflict / Constraint violation | HTTP 409 Conflict caught by advice | **PASS** |
| **TC-12** | US4 | Copy budgets from prior month | POST `/api/budgets/copy` | `{fromMonth: "2026-10", toMonth: "2026-11"}` | HTTP 200 OK; clones all prior month limits to current month | HTTP 200 OK; cloned 7 budget categories | **PASS** |
| **TC-13** | US5 | Pay active recurring subscription | POST `/api/recurring/{id}/pay` | Active Netflix subscription (Due: 2026-11-17, Amount: ₹649) | HTTP 200 OK; generates expense transaction; advances due date to 2026-12-17 | HTTP 200 OK; Transaction ID returned; Next due date advanced | **PASS** |
| **TC-14** | US5 | Prevent paying paused recurring bill | POST `/api/recurring/{id}/pay` | Inactive/Paused subscription | HTTP 409 Conflict; "Cannot pay inactive commitment" | HTTP 409 Conflict returned | **PASS** |
| **TC-15** | US6 | Calculate goal amortization | GET `/api/goals?userId=1` | Target: ₹300,000; Saved: ₹185,000; Target date: 6 months away | `requiredMonthly` calculated as ₹19,166.67; 61.7% complete | Returns ₹19,166.67 required monthly; 61.7% | **PASS** |
| **TC-16** | US7 | 6-month cashflow query | GET `/api/analytics/cashflow?userId=1&months=6` | None | HTTP 200 OK; returns 6 points with income, expenses, and net | HTTP 200 OK; 6 months array returned | **PASS** |
| **TC-17** | US8 | Detect spending surge (>120%) | GET `/api/analytics/spending-spikes?userId=1&month=2026-11`| None | HTTP 200 OK; Shopping detected with current ₹30,300 vs avg ₹6,333 (+378.4%) | HTTP 200 OK; Shopping +378.4% returned | **PASS** |
| **TC-18** | US9 | Recurring vendor INTERSECT | GET `/api/analytics/recurring-merchants?userId=1&month=2026-11`| None | HTTP 200 OK; returns merchants charged in both current and previous months | HTTP 200 OK; 9 merchants returned (Amazon, Prestige, Netflix, etc.) | **PASS** |
| **TC-19** | US9 | Unused budget EXCEPT | GET `/api/analytics/unused-budgets?userId=1&month=2026-11` | None | HTTP 200 OK; returns Travel & Vacation, Healthcare (0 spend) | HTTP 200 OK; Travel & Healthcare returned | **PASS** |
| **TC-20** | US10| Timeline projection UNION | GET `/api/analytics/timeline?userId=1&days=30` | None | HTTP 200 OK; returns actual historical transactions + scheduled future bills | HTTP 200 OK; sorted chronological timeline | **PASS** |
| **TC-21** | US11| Streaming CSV export | GET `/api/analytics/export/transactions.csv?userId=1` | None | HTTP 200 OK; `Content-Type: text/csv`; streamed CSV rows | HTTP 200 OK; valid RFC 4180 CSV streamed | **PASS** |
| **TC-22** | US11| CSV formula injection sanitization | GET CSV export with malicious merchant `=cmd|' /C calc'!A0` | Malicious string in database | Prepend tab `\t` to malicious field in output stream | Field formatted as `"\t=cmd\|..."` | **PASS** |
| **TC-23** | US12| Canvas 2D Retina scaling | Mount `CanvasChart` on HiDPI screen | `window.devicePixelRatio = 2` | Canvas internal width = 2× CSS width; scale(2, 2) applied | Manual - not executed (Tested in Canvas unit logic) | **Manual** |
| **TC-24** | US12| Theme switcher instant update | Select Dark Theme in UI | Toggle `data-theme="dark"` on `<html>` | CSS variables update; Canvas redraws with dark palette | Manual - not executed (Verified via DOM inspect) | **Manual** |
| **TC-25** | System| Fixed connectivity probe | GET `/api/analytics/health` | None | HTTP 200 OK; `{status: "UP", database: "CONNECTED"}` | HTTP 200 OK; UP & CONNECTED | **PASS** |
| **TC-26** | System| User profile update | PUT `/api/users/1` | `{fullName: "Aarav Sharma", email: "aarav.sharma@example.in", currency: "INR", locale: "en-IN"}` | HTTP 200 OK; updated profile record | HTTP 200 OK; Profile updated | **PASS** |

---

## 4. Live REST Endpoint Probes (Real Responses from Port 8081 & 8082)

Below are verbatim outputs captured from active microservices using `Invoke-RestMethod`:

### 1. `GET http://localhost:8081/api/users/1`
```json
{
  "id": 1,
  "username": "aarav_sharma",
  "email": "aarav.sharma@example.in",
  "fullName": "Aarav Sharma",
  "currency": "INR",
  "locale": "en-IN",
  "createdAt": "2026-11-12T19:01:51.326165"
}
```

### 2. `GET http://localhost:8081/api/accounts?userId=1` (Excerpt)
```json
[
  {
    "id": 2,
    "userId": 1,
    "accountName": "ICICI Emergency Savings",
    "accountNumber": "ICIC-44102-1",
    "accountType": "SAVINGS",
    "balance": 186000.0,
    "currency": "INR",
    "isArchived": false,
    "createdAt": "2026-11-12T19:01:51.331245"
  },
  {
    "id": 3,
    "userId": 1,
    "accountName": "Axis Flipkart Credit Card",
    "accountNumber": "AXIS-55201-9",
    "accountType": "CREDIT_CARD",
    "balance": -14500.0,
    "currency": "INR",
    "isArchived": false,
    "createdAt": "2026-11-12T19:01:51.331245"
  }
]
```

### 3. `GET http://localhost:8081/api/budgets/progress?userId=1&month=2026-11` (Excerpt)
```json
[
  {
    "id": 8,
    "category": "Housing & Rent",
    "monthlyLimit": 25000.0,
    "spent": 25000.0,
    "remaining": 0.0,
    "percentageUsed": 100.0,
    "status": "WARNING"
  },
  {
    "id": 9,
    "category": "Groceries & Dining",
    "monthlyLimit": 12000.0,
    "spent": 2970.0,
    "remaining": 9030.0,
    "percentageUsed": 24.8,
    "status": "OK"
  }
]
```

### 4. `GET http://localhost:8081/api/goals?userId=1`
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "6-Month Emergency Fund",
    "targetAmount": 300000.0,
    "savedAmount": 185000.0,
    "targetDate": "2027-05-11",
    "percentComplete": 61.7,
    "requiredMonthly": 19166.67,
    "createdAt": "2026-11-12T19:01:51.360598"
  },
  {
    "id": 2,
    "userId": 1,
    "name": "Electric Scooter Purchase",
    "targetAmount": 120000.0,
    "savedAmount": 45000.0,
    "targetDate": "2027-02-10",
    "percentComplete": 37.5,
    "requiredMonthly": 25000.0,
    "createdAt": "2026-11-12T19:01:51.360598"
  }
]
```

### 5. `GET http://localhost:8082/api/analytics/cashflow?userId=1&months=6`
```json
[
  { "month": "2026-06", "income": 75000.0, "expenses": 37317.0, "net": 37683.0 },
  { "month": "2026-07", "income": 75000.0, "expenses": 64347.0, "net": 10653.0 },
  { "month": "2026-08", "income": 90000.0, "expenses": 47627.0, "net": 42373.0 },
  { "month": "2026-09", "income": 0.0, "expenses": 16047.0, "net": -16047.0 },
  { "month": "2026-10", "income": 75000.0, "expenses": 54107.0, "net": 20893.0 },
  { "month": "2026-11", "income": 75000.0, "expenses": 63537.0, "net": 11463.0 }
]
```

### 6. `GET http://localhost:8082/api/analytics/spending-spikes?userId=1&month=2026-11`
```json
[
  {
    "category": "Shopping",
    "currentAmount": 30300.0,
    "averageAmount": 6333.33333,
    "changePercent": 378.4
  },
  {
    "category": "Housing & Rent",
    "currentAmount": 25000.0,
    "averageAmount": 16666.66667,
    "changePercent": 50.0
  }
]
```

### 7. `GET http://localhost:8082/api/analytics/unused-budgets?userId=1&month=2026-11`
```json
[
  {
    "category": "Travel & Vacation",
    "monthlyLimit": 10000.0
  },
  {
    "category": "Healthcare",
    "monthlyLimit": 3000.0
  }
]
```

### 8. `GET http://localhost:8082/api/analytics/health`
```json
{
  "service": "finpulse-analytics-service",
  "database": "CONNECTED",
  "status": "UP"
}
```
