# FinPulse: Clean Shutdown Script (Redirects to Root stop-all.ps1)
$root = Split-Path -Parent $PSScriptRoot
& "$root\stop-all.ps1" @args
