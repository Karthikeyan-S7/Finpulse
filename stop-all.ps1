# FinPulse: Clean Shutdown Script
# Terminates processes running on ports 8081 (Core), 8082 (Analytics), and 5173 (Frontend).

$ports = @(8081, 8082, 5173)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             FinPulse System Clean Shutdown               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

foreach ($port in $ports) {
    Write-Host "Scanning port $port..." -NoNewline
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        Write-Host " Found active PID(s): $($pids -join ', ')" -ForegroundColor Yellow
        foreach ($procId in $pids) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Stopping PID $procId ($($proc.ProcessName))..." -ForegroundColor Red
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  Could not stop PID $procId : $($_.Exception.Message)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host " [IDLE]" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "All FinPulse service ports (8081, 8082, 5173) have been cleanly closed." -ForegroundColor Green
