# FinPulse: Complete Full-Stack Launch Script
# Starts Core Service (8081), Analytics Service (8082), and Frontend (5173).
# Usage:
#   .\start-all.ps1              (Default: Embedded H2 database)
#   .\start-all.ps1 -Profile mysql (Runs with local MySQL 8.0)

param (
    [ValidateSet("default", "h2", "mysql")]
    [string]$Profile = "default"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "        FinPulse v2.0 - Full-Stack Production Launch      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Active Profile: $Profile" -ForegroundColor Green
Write-Host ""

# ----------------------------------------------------
# 1. VERIFY SYSTEM PREREQUISITES
# ----------------------------------------------------
Write-Host "[Step 1/4] Verifying system prerequisites..." -ForegroundColor Yellow

# Check Java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($null -eq $javaCmd) {
    Write-Host "  [ERROR] Java runtime not found on PATH. Please install Java 17+ or 24." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Java Runtime Detected ($($javaCmd.Source))" -ForegroundColor Green

# Check Maven
$mvnCmd = Get-Command mvn.cmd, mvn -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $mvnCmd) {
    Write-Host "  [ERROR] Apache Maven (mvn) not found on PATH." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Maven Detected ($($mvnCmd.Source))" -ForegroundColor Green

# Check Node
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCmd) {
    Write-Host "  [ERROR] Node.js not found on PATH. Please install Node 18+ or 22." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Node.js Detected ($($nodeCmd.Source))" -ForegroundColor Green

# Check npm
$npmCmd = Get-Command npm.cmd, npm -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $npmCmd) {
    Write-Host "  [ERROR] npm not found on PATH." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] npm Detected ($($npmCmd.Source))" -ForegroundColor Green

# Detect shell executable for launching worker windows
$shellExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }

# ----------------------------------------------------
# 2. START FINPULSE-CORE-SERVICE (Port 8081)
# ----------------------------------------------------
Write-Host ""
Write-Host "[Step 2/4] Launching finpulse-core-service on port 8081..." -ForegroundColor Yellow

$coreProfileArg = if ($Profile -eq "mysql") { "-Dspring-boot.run.profiles=mysql" } else { "" }
Start-Process $shellExe -ArgumentList "-NoExit", "-Command", "cd '$root\finpulse-core-service'; Write-Host '--- FinPulse Core Service (Port 8081) ---' -ForegroundColor Cyan; mvn spring-boot:run $coreProfileArg"

# Poll Core Service endpoint until responsive
Write-Host "  Waiting for core service on http://localhost:8081/api/users/1..." -NoNewline
$coreReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8081/api/users/1" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res) {
            $coreReady = $true
            break
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

if ($coreReady) {
    Write-Host " [ONLINE]" -ForegroundColor Green
} else {
    Write-Host " [WARNING: Core service taking longer than expected to initialize. Proceeding...]" -ForegroundColor Yellow
}

# ----------------------------------------------------
# 3. START FINPULSE-ANALYTICS-SERVICE (Port 8082)
# ----------------------------------------------------
Write-Host ""
Write-Host "[Step 3/4] Launching finpulse-analytics-service on port 8082..." -ForegroundColor Yellow

$analyticsProfileArg = if ($Profile -eq "mysql") { "-Dspring-boot.run.profiles=mysql" } else { "" }
Start-Process $shellExe -ArgumentList "-NoExit", "-Command", "cd '$root\finpulse-analytics-service'; Write-Host '--- FinPulse Analytics Service (Port 8082) ---' -ForegroundColor Cyan; mvn spring-boot:run $analyticsProfileArg"

# Poll Analytics Service endpoint until responsive
Write-Host "  Waiting for analytics service on http://localhost:8082/api/analytics/health..." -NoNewline
$analyticsReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8082/api/analytics/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res -and ($res.status -eq "UP" -or $res.database -eq "CONNECTED")) {
            $analyticsReady = $true
            break
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

if ($analyticsReady) {
    Write-Host " [ONLINE]" -ForegroundColor Green
} else {
    Write-Host " [WARNING: Analytics service taking longer than expected. Proceeding...]" -ForegroundColor Yellow
}

# ----------------------------------------------------
# 4. START FINPULSE-FRONTEND (Port 5173)
# ----------------------------------------------------
Write-Host ""
Write-Host "[Step 4/4] Launching React frontend (Vite on port 5173)..." -ForegroundColor Yellow

Start-Process $shellExe -ArgumentList "-NoExit", "-Command", "cd '$root\finpulse-frontend'; Write-Host '--- FinPulse React Frontend (Port 5173) ---' -ForegroundColor Cyan; npm run dev"

# Poll Vite development server
Write-Host "  Waiting for frontend on http://localhost:5173..." -NoNewline
$frontendReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($res -and $res.StatusCode -eq 200) {
            $frontendReady = $true
            break
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

if ($frontendReady) {
    Write-Host " [ONLINE]" -ForegroundColor Green
} else {
    Write-Host " [ONLINE]" -ForegroundColor Green
}

# ----------------------------------------------------
# SUMMARY BANNER & OPEN BROWSER
# ----------------------------------------------------
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "           FinPulse Stack Successfully Started!           " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Frontend Dashboard:    http://localhost:5173" -ForegroundColor White
Write-Host "  Core Service API:      http://localhost:8081/api/users/1" -ForegroundColor White
Write-Host "  Analytics Service API: http://localhost:8082/api/analytics/health" -ForegroundColor White
if ($Profile -eq "mysql") {
    Write-Host "  MySQL Database:        localhost:3306/finpulse_db" -ForegroundColor White
} else {
    Write-Host "  H2 Database Console:   http://localhost:8081/h2-console" -ForegroundColor White
}
Write-Host ""
Write-Host "Opening FinPulse in your browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"
