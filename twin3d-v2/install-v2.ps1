# v2: GIS Map -> real 3D Digital Twin (satellite + terrain + 3D buildings + 3D infrastructure models)
# Run from PROJECT ROOT:  powershell -ExecutionPolicy Bypass -File .\twin3d-v2\install-v2.ps1
$ErrorActionPreference = "Stop"
$root = Get-Location
$pkg = Split-Path -Parent $MyInvocation.MyCommand.Path
$fe = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $fe "package.json"))) { Write-Host "Project root se chalao (digital-twin-sangli)" -ForegroundColor Red; exit 1 }

Write-Host "[1/4] Copying files (src + public/data + public/models)..." -ForegroundColor Cyan
Copy-Item (Join-Path $pkg "files\src\*") (Join-Path $fe "src") -Recurse -Force
New-Item -ItemType Directory -Force (Join-Path $fe "public") | Out-Null
Copy-Item (Join-Path $pkg "files\public\*") (Join-Path $fe "public") -Recurse -Force

Write-Host "[2/4] App.tsx: /map -> 3D Twin, /twin -> Flood Simulator..." -ForegroundColor Cyan
$app = Join-Path $fe "src\App.tsx"
$c = Get-Content $app -Raw
$c = $c -replace 'import MapView from "\./pages/MapView";', 'import TwinMap from "./pages/TwinMap";'
$c = $c -replace '<MapView />', '<TwinMap />'
if ($c -notmatch 'DigitalTwin3D') {
  $c = $c -replace 'import AIModeler from "\./pages/AIModeler";', "import AIModeler from `"./pages/AIModeler`";`r`nimport DigitalTwin3D from `"./pages/DigitalTwin3D`";"
  $c = $c -replace '(\s*)<Route path="/ai-modeler"', "`$1<Route path=`"/twin`" element={<DigitalTwin3D />} />`$1<Route path=`"/ai-modeler`""
}
Set-Content $app $c -NoNewline

Write-Host "[3/4] Cleaning sidebar..." -ForegroundColor Cyan
$lay = Join-Path $fe "src\layouts\DashboardLayout.tsx"
$l = Get-Content $lay -Raw
$nav = @'
const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/map", icon: Map, label: "3D Digital Twin" },
  { to: "/twin", icon: Waves, label: "Flood Simulator" },
  { to: "/infrastructure", icon: Building2, label: "Infrastructure" },
  { to: "/sensors", icon: Radio, label: "Live Sensors" },
  { to: "/ai-predictions", icon: Brain, label: "AI Predictions" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/reports", icon: FileText, label: "Reports" },
];
'@
$l = [regex]::Replace($l, '(?s)const NAV_ITEMS = \[.*?\];\r?\n', $nav)
$l = $l -replace 'Search, BellRing, Cpu', 'Search, BellRing, Waves'
Set-Content $lay $l -NoNewline

Write-Host "[4/4] Checking 3D packages..." -ForegroundColor Cyan
Push-Location $fe
npm install three @react-three/fiber@^9 @react-three/drei@^10 @react-three/postprocessing@^3 postprocessing --no-audit --no-fund
npm install -D @types/three --no-audit --no-fund
Pop-Location
Write-Host "`nDONE ->  cd frontend ; npm run dev   ->  http://localhost:5173/map" -ForegroundColor Green
