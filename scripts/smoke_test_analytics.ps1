$baseUrl = "http://localhost:8082/api/analytics"
$userId = 1
$month = "2026-11"

Write-Host "`n=== 1. HEALTH (Plain Statement Check) ===" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$baseUrl/health"
Write-Host ($health | ConvertTo-Json)

Write-Host "`n=== 2. CASHFLOW (GROUP BY Month) ===" -ForegroundColor Cyan
$cashflow = Invoke-RestMethod -Uri "$baseUrl/cashflow?months=6&userId=$userId"
Write-Host "Months returned: $($cashflow.Count)"
$cashflow | ForEach-Object {
    Write-Host "Month: $($_.month) | Income: $($_.income) | Expenses: $($_.expenses) | Net: $($_.net)"
}

Write-Host "`n=== 3. CATEGORY BREAKDOWN (Multi-table JOIN) ===" -ForegroundColor Cyan
$breakdown = Invoke-RestMethod -Uri "$baseUrl/category-breakdown?month=$month&userId=$userId"
Write-Host "Categories returned: $($breakdown.Count)"
$breakdown | Select-Object -First 5 | ForEach-Object {
    Write-Host "Category: $($_.category) | Amount: $($_.amount) | Share: $($_.sharePercent)%"
}

Write-Host "`n=== 4. SPENDING SPIKES (SUBQUERY: >120% of 3-Month Avg) ===" -ForegroundColor Cyan
$spikes = Invoke-RestMethod -Uri "$baseUrl/spending-spikes?month=$month&userId=$userId"
Write-Host "Spikes found: $($spikes.Count)"
$spikes | ForEach-Object {
    Write-Host "Category: $($_.category) | Current: $($_.currentAmount) | 3-Mo Avg: $($_.averageAmount) | Change: +$($_.changePercent)%"
}

Write-Host "`n=== 5. TIMELINE (UNION: Actual Transactions + Scheduled Recurring) ===" -ForegroundColor Cyan
$timeline = Invoke-RestMethod -Uri "$baseUrl/timeline?days=30&userId=$userId"
Write-Host "Total Events: $($timeline.Count)"
$actuals = @($timeline | Where-Object { $_.kind -eq "ACTUAL" })
$scheduled = @($timeline | Where-Object { $_.kind -eq "SCHEDULED" })
Write-Host "ACTUAL count: $($actuals.Count), SCHEDULED count: $($scheduled.Count)"
Write-Host "Sample Timeline Entries (First 4 Actual & First 3 Scheduled):"
$actuals | Select-Object -First 4 | ForEach-Object {
    Write-Host "  [$($_.kind)] Date: $($_.date) | $($_.label) ($($_.category)): $($_.amount)"
}
$scheduled | Select-Object -First 3 | ForEach-Object {
    Write-Host "  [$($_.kind)] Date: $($_.date) | $($_.label) ($($_.category)): $($_.amount)"
}

Write-Host "`n=== 6. RECURRING MERCHANTS (INTERSECT: Consecutive Months) ===" -ForegroundColor Cyan
$merchants = Invoke-RestMethod -Uri "$baseUrl/recurring-merchants?month=$month&userId=$userId"
Write-Host "Recurring merchants: $($merchants.Count)"
$merchants | Select-Object -First 5 | ForEach-Object {
    Write-Host "Merchant: $($_.merchant) | Current Month: $($_.currentAmount) | Previous Month: $($_.previousAmount)"
}

Write-Host "`n=== 7. UNUSED BUDGETS (EXCEPT: Zero Spend Categories) ===" -ForegroundColor Cyan
$unused = Invoke-RestMethod -Uri "$baseUrl/unused-budgets?month=$month&userId=$userId"
Write-Host "Unused budgets count: $($unused.Count)"
$unused | ForEach-Object {
    Write-Host "Category: $($_.category) | Monthly Limit: $($_.monthlyLimit)"
}

Write-Host "`n=== 8. ACCOUNT BALANCES (Multi-table LEFT JOIN) ===" -ForegroundColor Cyan
$accounts = Invoke-RestMethod -Uri "$baseUrl/account-balances?userId=$userId"
Write-Host "Accounts count: $($accounts.Count)"
$accounts | ForEach-Object {
    Write-Host "Account: $($_.accountName) ($($_.accountType)) | Balance: $($_.balance) | Tx Count: $($_.transactionCount)"
}

Write-Host "`n=== 9. OVERVIEW (Aggregates Core Summary + Spikes + Counts) ===" -ForegroundColor Cyan
$overview = Invoke-RestMethod -Uri "$baseUrl/overview?month=$month&userId=$userId"
Write-Host "Net Worth: $($overview.netWorth) | Assets: $($overview.assetsTotal) | Liabilities: $($overview.liabilitiesTotal)"
Write-Host "Income: $($overview.income) | Expenses: $($overview.expenses) | Savings Rate: $($overview.savingsRate)%"
Write-Host "Spikes Count: $($overview.spikesCount) | Unused Budgets: $($overview.unusedBudgetsCount) | Recurring Merchants: $($overview.recurringMerchantsCount)"
Write-Host "Top Spikes: $(($overview.topSpikes | ForEach-Object { $_.category + ' (+' + $_.changePercent + '%)' }) -join ', ')"

Write-Host "`n=== 10. TRANSACTIONS CSV EXPORT (Streamed via JDBC) ===" -ForegroundColor Cyan
$csvUrl = "$baseUrl/export/transactions.csv?from=2026-06-01&to=2026-11-30&userId=$userId"
$csvResponse = Invoke-WebRequest -Uri $csvUrl
$csvContent = $csvResponse.Content
$csvLines = $csvContent -split "`n"
Write-Host "Total CSV lines streamed: $($csvLines.Count)"
Write-Host "First 10 lines of CSV output:"
for ($i = 0; $i -lt [Math]::Min(10, $csvLines.Count); $i++) {
    Write-Host "  Line $($i+1): $($csvLines[$i])"
}
