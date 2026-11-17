# FinPulse: Complete Full-Stack Launch Script (Redirects to Root start-all.ps1)
$root = Split-Path -Parent $PSScriptRoot
& "$root\start-all.ps1" @args
