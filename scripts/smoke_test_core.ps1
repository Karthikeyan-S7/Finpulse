$baseUrl = "http://localhost:8081/api"

Write-Host "=== 1. USERS ==="
$user = Invoke-RestMethod -Uri "$baseUrl/users/1"
Write-Host "GET /api/users/1 -> User: $($user.fullName), Email: $($user.email), Currency: $($user.currency)"

Write-Host "=== 2. ACCOUNTS ==="
$accounts = Invoke-RestMethod -Uri "$baseUrl/accounts?userId=1"
Write-Host "GET /api/accounts -> Count: $($accounts.Count), First: $($accounts[0].accountName) (Balance: $($accounts[0].balance))"

Write-Host "=== 3. TRANSACTIONS ==="
$txs = Invoke-RestMethod -Uri "$baseUrl/transactions?userId=1"
Write-Host "GET /api/transactions -> Count: $($txs.Count), Recent: $($txs[0].merchant) ($($txs[0].amount) $($txs[0].transactionType))"

Write-Host "=== 4. CATEGORIES ==="
$cats = Invoke-RestMethod -Uri "$baseUrl/categories"
Write-Host "GET /api/categories -> Total Canonical Categories: $($cats.Count)"

Write-Host "=== 5. BUDGETS ==="
$budgets = Invoke-RestMethod -Uri "$baseUrl/budgets?userId=1&month=2026-11"
Write-Host "GET /api/budgets -> Count: $($budgets.Count), First: $($budgets[0].category) [Limit: $($budgets[0].monthlyLimit), Spent: $($budgets[0].spent), Status: $($budgets[0].status)]"

Write-Host "=== 6. RECURRING PAYMENTS ==="
$recurring = Invoke-RestMethod -Uri "$baseUrl/recurring?userId=1"
Write-Host "GET /api/recurring -> Count: $($recurring.Count), First: $($recurring[0].name) ($($recurring[0].amount), Due: $($recurring[0].nextDueDate))"

Write-Host "=== 7. SAVINGS GOALS ==="
$goals = Invoke-RestMethod -Uri "$baseUrl/goals?userId=1"
Write-Host "GET /api/goals -> Count: $($goals.Count), First: $($goals[0].name) [Saved: $($goals[0].savedAmount)/$($goals[0].targetAmount), ReqMonthly: $($goals[0].requiredMonthly)]"

Write-Host "=== 8. SUMMARY ==="
$summary = Invoke-RestMethod -Uri "$baseUrl/summary?userId=1&month=2026-11"
Write-Host "GET /api/summary -> NetWorth: $($summary.netWorth), Assets: $($summary.assetsTotal), Liabilities: $($summary.liabilitiesTotal), Income: $($summary.income), Expenses: $($summary.expenses), SavingsRate: $($summary.savingsRate)%"

Write-Host "=== 9. TRANSFERS (Smoke Test) ==="
$transferPayload = @{
    fromAccountId = 1
    toAccountId = 2
    amount = 500.00
    date = (Get-Date).ToString("yyyy-MM-dd")
    note = "Smoke test inter-account transfer"
} | ConvertTo-Json
$transferRes = Invoke-RestMethod -Uri "$baseUrl/transfers" -Method Post -Body $transferPayload -ContentType "application/json"
Write-Host "POST /api/transfers -> GroupId: $($transferRes.transferGroupId), Status: $($transferRes.status)"

Write-Host "=== 10. RECURRING PAY (Smoke Test) ==="
$payRes = Invoke-RestMethod -Uri "$baseUrl/recurring/1/pay" -Method Post
Write-Host "POST /api/recurring/1/pay -> Paid: $($payRes.amount), TxId: $($payRes.id)"
$recAfter = Invoke-RestMethod -Uri "$baseUrl/recurring/1"
Write-Host "Recurring #1 New Due Date: $($recAfter.nextDueDate)"

Write-Host "=== 11. GOAL CONTRIBUTE (Smoke Test) ==="
$contribPayload = @{ amount = 1000.00 } | ConvertTo-Json
$goalRes = Invoke-RestMethod -Uri "$baseUrl/goals/1/contribute" -Method Post -Body $contribPayload -ContentType "application/json"
Write-Host "POST /api/goals/1/contribute -> New Saved: $($goalRes.savedAmount), Percent: $($goalRes.percentComplete)%"
