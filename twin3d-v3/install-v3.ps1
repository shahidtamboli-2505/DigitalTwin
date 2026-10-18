# v3: detailed 3D structures (textured arch bridge with traffic, gravity dam with spillway, hospital helipad...)
# Run from PROJECT ROOT:  powershell -ExecutionPolicy Bypass -File .\twin3d-v3\install-v3.ps1
$ErrorActionPreference = "Stop"
$pkg = Split-Path -Parent $MyInvocation.MyCommand.Path
$fe = Join-Path (Get-Location) "frontend"
if (-not (Test-Path (Join-Path $fe "package.json"))) { Write-Host "Project root se chalao" -ForegroundColor Red; exit 1 }
Copy-Item (Join-Path $pkg "files\src\*") (Join-Path $fe "src") -Recurse -Force
Copy-Item (Join-Path $pkg "files\public\*") (Join-Path $fe "public") -Recurse -Force
Write-Host "v3 files copied. Ab OSM script chalao, phir npm run dev." -ForegroundColor Green
