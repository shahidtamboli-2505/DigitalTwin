# Professional UI upgrade: new layout + theme + animated Command Center + AI Predictions
# Run from PROJECT ROOT:  powershell -ExecutionPolicy Bypass -File .\twin-ui-pro\install-ui.ps1
$ErrorActionPreference = "Stop"
$pkg = Split-Path -Parent $MyInvocation.MyCommand.Path
$fe = Join-Path (Get-Location) "frontend"
if (-not (Test-Path (Join-Path $fe "package.json"))) { Write-Host "Project root se chalao" -ForegroundColor Red; exit 1 }

# backup the files we replace
$bk = Join-Path $fe "src\_backup_ui"
New-Item -ItemType Directory -Force $bk | Out-Null
foreach ($f in "layouts\DashboardLayout.tsx","pages\Dashboard.tsx","pages\AIPredictions.tsx") {
  $p = Join-Path $fe "src\$f"; if (Test-Path $p) { Copy-Item $p (Join-Path $bk ((Split-Path $f -Leaf) + ".bak")) -Force }
}
Copy-Item (Join-Path $pkg "files\src\*") (Join-Path $fe "src") -Recurse -Force

# make full-screen twin pages fit the new header
foreach ($f in "pages\TwinMap.tsx","pages\DigitalTwin3D.tsx") {
  $p = Join-Path $fe "src\$f"
  if (Test-Path $p) { (Get-Content $p -Raw) -replace 'h-\[calc\(100vh-[0-9.]+rem\)\]', 'h-[calc(100vh-6.5rem)]' | Set-Content $p -NoNewline }
}
Write-Host "UI upgrade done. Old files saved in src\_backup_ui" -ForegroundColor Green
