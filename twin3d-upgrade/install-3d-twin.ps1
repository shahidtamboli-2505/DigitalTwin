# Installs the cinematic 3D Digital Twin into digital-twin-sangli/frontend
# Run from the PROJECT ROOT:  powershell -ExecutionPolicy Bypass -File .\twin3d-upgrade\install-3d-twin.ps1
$ErrorActionPreference = "Stop"
$root     = Get-Location
$pkg      = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontend "package.json"))) {
  Write-Host "frontend\package.json nahi mila. Project root (digital-twin-sangli) se chalao." -ForegroundColor Red
  exit 1
}

Write-Host "`n[1/3] Copying 3D twin files..." -ForegroundColor Cyan
Copy-Item -Path (Join-Path $pkg "files\src\*") -Destination (Join-Path $frontend "src") -Recurse -Force
Write-Host "      src\features\digital-twin\*  +  src\pages\DigitalTwin3D.tsx"

Write-Host "`n[2/3] Adding /twin route to App.tsx..." -ForegroundColor Cyan
$app = Join-Path $frontend "src\App.tsx"
$code = Get-Content $app -Raw
if ($code -notmatch "DigitalTwin3D") {
  $code = $code -replace 'import AIModeler from "./pages/AIModeler";', "import AIModeler from `"./pages/AIModeler`";`r`nimport DigitalTwin3D from `"./pages/DigitalTwin3D`";"
  $code = $code -replace '(\s*)<Route path="/ai-modeler"', "`$1<Route path=`"/twin`" element={<DigitalTwin3D />} />`$1<Route path=`"/ai-modeler`""
  Set-Content -Path $app -Value $code -NoNewline
  Write-Host "      route added"
} else { Write-Host "      route already present" }

Write-Host "`n[3/3] Installing 3D packages (2-4 min)..." -ForegroundColor Cyan
Push-Location $frontend
npm install three @react-three/fiber@^9 @react-three/drei@^10 @react-three/postprocessing@^3 postprocessing
npm install -D @types/three
Pop-Location

Write-Host "`nDONE. Ab chalao:  cd frontend ; npm run dev   ->  http://localhost:5173/twin" -ForegroundColor Green
