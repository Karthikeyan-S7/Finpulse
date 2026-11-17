# FinPulse End-to-End Smoke Test Suite
# Tests all Core Service (8081) and Analytics Service (8082) endpoints.
# Usage:
#   .\scripts\smoke-test.ps1

param (
    [string]$CoreUrl = "http://localhost:8081",
    [string]$AnalyticsUrl = "http://localhost:8082"
)

$passed = 0
$failed = 0

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method = "GET",
        [string]$Uri,
        $Body = $null,
        [int[]]$ExpectedStatus = @(200, 201)
    )

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ErrorAction = "Stop"
            TimeoutSec = 10
        }
        if ($Body) {
            $params["ContentType"] = "application/json; charset=utf-8"
            $params["Body"] = ($Body | ConvertTo-Json -Depth 5 -Compress)
        }

        $response = Invoke-RestMethod @params
        Write-Host "  [PASS] $Method $Name" -ForegroundColor Green
        $script:passed++
        return $response
    } catch {
        $status = $null
        if ($_.Exception.Response) {
            $status = $_.Exception.Response.StatusCode.value__
        }
        if ($status -and ($ExpectedStatus -contains $status)) {
            Write-Host "  [PASS] $Method $Name (Status $status)" -ForegroundColor Green
            $script:passed++
            return $null
        } else {
            Write-Host "  [FAIL] $Method $Name - Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:failed++
            return $null
        }
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         FinPulse End-to-End API Smoke Test Suite         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Core Service:      $CoreUrl" -ForegroundColor White
Write-Host "Target Analytics Service: $AnalyticsUrl" -ForegroundColor White
Write-Host ""

# Verify services are responding before beginning
Write-Host "Checking service availability..." -NoNewline
for ($i = 0; $i -lt 15; $i++) {
    try {
        $coreCheck = Invoke-RestMethod -Uri "$CoreUrl/api/users/1" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $analyticsCheck = Invoke-RestMethod -Uri "$AnalyticsUrl/api/analytics/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($coreCheck -and $analyticsCheck) {
            Write-Host " [ALL SERVICES READY]" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}
Write-Host ""

# ----------------------------------------------------
# 1. CORE SERVICE TESTS (Port 8081)
# ----------------------------------------------------
Write-Host "--- Testing finpulse-core-service (Spring Data JPA) ---" -ForegroundColor Yellow

# Users
Test-Endpoint -Name "/api/users/1" -Uri "$CoreUrl/api/users/1"
Test-Endpoint -Name "/api/users/1 (PUT update)" -Method "PUT" -Uri "$CoreUrl/api/users/1" -Body @{
    fullName = "Aarav Sharma"
    email = "aarav.sharma@example.in"
    currency = "INR"
    locale = "en-IN"
}

# Categories
Test-Endpoint -Name "/api/categories" -Uri "$CoreUrl/api/categories"

# Accounts
Test-Endpoint -Name "/api/accounts?userId=1" -Uri "$CoreUrl/api/accounts?userId=1"
Test-Endpoint -Name "/api/accounts/user/1/summary" -Uri "$CoreUrl/api/accounts/user/1/summary"
Test-Endpoint -Name "/api/accounts/user/1/net-worth" -Uri "$CoreUrl/api/accounts/user/1/net-worth"

# Create a temporary test checking account with ample balance
$newAcc = Test-Endpoint -Name "/api/accounts (POST)" -Method "POST" -Uri "$CoreUrl/api/accounts" -Body @{
    userId = 1
    accountName = "Smoke Test Reserve Checking"
    accountNumber = "SMOKE-$(Get-Random)"
    accountType = "CHECKING"
    balance = 100000.00
    currency = "INR"
}
$testAccId = if ($newAcc -and $newAcc.id) { $newAcc.id } else { 2 }

Test-Endpoint -Name "/api/accounts/$testAccId (GET)" -Uri "$CoreUrl/api/accounts/$testAccId"

# Transactions
Test-Endpoint -Name "/api/transactions?userId=1" -Uri "$CoreUrl/api/transactions?userId=1"

# Create sample transaction
$newTx = Test-Endpoint -Name "/api/transactions (POST expense)" -Method "POST" -Uri "$CoreUrl/api/transactions" -Body @{
    userId = 1
    accountId = $testAccId
    amount = 450.00
    transactionType = "EXPENSE"
    category = "Groceries & Dining"
    merchant = "Smoke Test Cafe"
    transactionDate = (Get-Date -Format "yyyy-MM-dd")
    notes = "Automated smoke test transaction"
}
$testTxId = if ($newTx -and $newTx.id) { $newTx.id } else { $null }

if ($testTxId) {
    Test-Endpoint -Name "/api/transactions/$testTxId (PUT update)" -Method "PUT" -Uri "$CoreUrl/api/transactions/$testTxId" -Body @{
        userId = 1
        accountId = $testAccId
        amount = 550.00
        transactionType = "EXPENSE"
        category = "Groceries & Dining"
        merchant = "Smoke Test Cafe"
        transactionDate = (Get-Date -Format "yyyy-MM-dd")
        notes = "Updated smoke test transaction"
    }
    Test-Endpoint -Name "/api/transactions/$testTxId (DELETE)" -Method "DELETE" -Uri "$CoreUrl/api/transactions/$testTxId"
}

# Transfers
Test-Endpoint -Name "/api/transfers (POST atomic transfer)" -Method "POST" -Uri "$CoreUrl/api/transfers" -Body @{
    fromAccountId = $testAccId
    toAccountId = 2
    amount = 500.00
    date = (Get-Date -Format "yyyy-MM-dd")
    note = "Smoke test inter-account transfer"
}

# Budgets
Test-Endpoint -Name "/api/budgets?userId=1&month=2026-11" -Uri "$CoreUrl/api/budgets?userId=1&month=2026-11"
Test-Endpoint -Name "/api/budgets (POST upsert)" -Method "POST" -Uri "$CoreUrl/api/budgets" -Body @{
    userId = 1
    category = "Shopping"
    monthlyLimit = 12000.00
    monthYear = "2026-11"
}
Test-Endpoint -Name "/api/budgets/copy (POST copy)" -Method "POST" -Uri "$CoreUrl/api/budgets/copy?userId=1" -Body @{
    fromMonth = "2026-10"
    toMonth = "2026-11"
}

# Recurring Payments
Test-Endpoint -Name "/api/recurring?userId=1" -Uri "$CoreUrl/api/recurring?userId=1"
$newRec = Test-Endpoint -Name "/api/recurring (POST)" -Method "POST" -Uri "$CoreUrl/api/recurring" -Body @{
    userId = 1
    accountId = $testAccId
    name = "Smoke Test Cloud Storage"
    merchant = "Google Cloud"
    category = "Utilities & Bills"
    amount = 650.00
    frequency = "MONTHLY"
    nextDueDate = (Get-Date -Format "yyyy-MM-dd")
    isActive = $true
}
$testRecId = if ($newRec -and $newRec.id) { $newRec.id } else { $null }

if ($testRecId) {
    # 1. Pay while active
    Test-Endpoint -Name "/api/recurring/$testRecId/pay (POST advance)" -Method "POST" -Uri "$CoreUrl/api/recurring/$testRecId/pay"

    # 2. Toggle active status
    Test-Endpoint -Name "/api/recurring/$testRecId/active (PATCH toggle)" -Method "PATCH" -Uri "$CoreUrl/api/recurring/$testRecId/active" -Body @{
        isActive = $false
    }

    # 3. Delete
    Test-Endpoint -Name "/api/recurring/$testRecId (DELETE)" -Method "DELETE" -Uri "$CoreUrl/api/recurring/$testRecId"
}

# Savings Goals
Test-Endpoint -Name "/api/goals?userId=1" -Uri "$CoreUrl/api/goals?userId=1"
$newGoal = Test-Endpoint -Name "/api/goals (POST)" -Method "POST" -Uri "$CoreUrl/api/goals" -Body @{
    userId = 1
    name = "Smoke Test Vacation Fund"
    targetAmount = 50000.00
    savedAmount = 10000.00
    targetDate = "2027-06-30"
}
$testGoalId = if ($newGoal -and $newGoal.id) { $newGoal.id } else { $null }

if ($testGoalId) {
    Test-Endpoint -Name "/api/goals/$testGoalId/contribute (POST)" -Method "POST" -Uri "$CoreUrl/api/goals/$testGoalId/contribute" -Body @{
        amount = 5000.00
    }
    Test-Endpoint -Name "/api/goals/$testGoalId (DELETE)" -Method "DELETE" -Uri "$CoreUrl/api/goals/$testGoalId"
}

# Summary Overview
Test-Endpoint -Name "/api/summary?userId=1" -Uri "$CoreUrl/api/summary?userId=1"

# Cleanup test account
if ($testAccId -and $testAccId -ne 2) {
    Test-Endpoint -Name "/api/accounts/$testAccId (DELETE)" -Method "DELETE" -Uri "$CoreUrl/api/accounts/$testAccId"
}

Write-Host ""
# ----------------------------------------------------
# 2. ANALYTICS SERVICE TESTS (Port 8082, Pure JDBC)
# ----------------------------------------------------
Write-Host "--- Testing finpulse-analytics-service (Pure JDBC) ---" -ForegroundColor Yellow

# Connectivity statement health check
Test-Endpoint -Name "/api/analytics/health" -Uri "$AnalyticsUrl/api/analytics/health"

# Cashflow (GROUP BY)
Test-Endpoint -Name "/api/analytics/cashflow?months=6" -Uri "$AnalyticsUrl/api/analytics/cashflow?userId=1&months=6"

# Category Breakdown (JOIN)
Test-Endpoint -Name "/api/analytics/category-breakdown?month=2026-11" -Uri "$AnalyticsUrl/api/analytics/category-breakdown?userId=1&month=2026-11"

# Spending Spikes (Correlated Subquery)
Test-Endpoint -Name "/api/analytics/spending-spikes?month=2026-11" -Uri "$AnalyticsUrl/api/analytics/spending-spikes?userId=1&month=2026-11"

# Cash Flow Projection Timeline (UNION)
Test-Endpoint -Name "/api/analytics/timeline?days=30" -Uri "$AnalyticsUrl/api/analytics/timeline?userId=1&days=30"

# Recurring Merchants (INTERSECT)
Test-Endpoint -Name "/api/analytics/recurring-merchants?month=2026-11" -Uri "$AnalyticsUrl/api/analytics/recurring-merchants?userId=1&month=2026-11"

# Unused Budgets (EXCEPT)
Test-Endpoint -Name "/api/analytics/unused-budgets?month=2026-11" -Uri "$AnalyticsUrl/api/analytics/unused-budgets?userId=1&month=2026-11"

# Account Balances
Test-Endpoint -Name "/api/analytics/account-balances" -Uri "$AnalyticsUrl/api/analytics/account-balances?userId=1"

# Analytics Unified Overview
Test-Endpoint -Name "/api/analytics/overview?month=2026-11" -Uri "$AnalyticsUrl/api/analytics/overview?userId=1&month=2026-11"

# Streaming CSV Export (Cursor streaming)
Test-Endpoint -Name "/api/analytics/export/transactions.csv" -Uri "$AnalyticsUrl/api/analytics/export/transactions.csv?userId=1&from=2026-06-01&to=2026-11-30"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "               SMOKE TEST SUMMARY RESULTS                 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Total Passed: $passed" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "Total Failed: $failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Total Failed: 0 (ALL ENDPOINTS OPERATIONAL)" -ForegroundColor Green
    exit 0
}
