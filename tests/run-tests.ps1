# ============================================================================
# Stella Maris - Runner de pruebas automatizadas (PowerShell)
# ============================================================================
#
# Ejecuta los tests integrales y de estres en secuencia, guardando los outputs
# en tests/output/ para que despues los pegues en el INFORME.md.
#
# Uso:
#   cd "C:\Users\gusta\Downloads\Aplicacion Movil para Coros (front)"
#   .\tests\run-tests.ps1
#
# Si bloquea por politica:
#   powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
#
# ============================================================================

$ErrorActionPreference = 'Stop'

# Forzar UTF-8 en la consola para que los logs no salgan en UTF-16
# (compatible con PowerShell 5.1 y 7+).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Ir a la raiz del proyecto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

# Carpeta para los outputs
$outputDir = Join-Path $projectRoot 'tests/output'
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

function Write-Header {
    param([string]$Title)
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host '================================================================' -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "  -> $Message" -ForegroundColor Yellow
}

function Write-Ok {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Err {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
}

# ----------------------------------------------------------------------------
# 1. Verificar dependencias
# ----------------------------------------------------------------------------

Write-Header 'Verificando entorno'

try {
    $nodeVersion = node --version
    Write-Ok "Node.js detectado: $nodeVersion"
} catch {
    Write-Err 'Node.js no esta instalado o no esta en el PATH.'
    Write-Host '  Instalalo desde https://nodejs.org' -ForegroundColor White
    exit 1
}

$envLocal = Join-Path $projectRoot '.env.local'
if (-not (Test-Path $envLocal)) {
    Write-Err 'No se encontro .env.local en la raiz del proyecto.'
    Write-Host '  Debe contener al menos VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.' -ForegroundColor White
    exit 1
}
Write-Ok '.env.local encontrado'

$nodeModules = Join-Path $projectRoot 'node_modules'
if (-not (Test-Path $nodeModules)) {
    Write-Step 'node_modules no existe. Instalando dependencias...'
    npm install
}
Write-Ok 'Dependencias instaladas'

# ----------------------------------------------------------------------------
# 2. Setup de tests/.env
# ----------------------------------------------------------------------------

Write-Header 'Configurando tests/.env'

$testsEnv = Join-Path $projectRoot 'tests/.env'

if (Test-Path $testsEnv) {
    Write-Ok 'tests/.env ya existe - usando el actual'
} else {
    Write-Step 'Copiando .env.local -> tests/.env'
    Copy-Item $envLocal $testsEnv
    Write-Ok 'Archivo copiado'
}

# Verificar PUBLIC_BASE_URL
$envContent = Get-Content $testsEnv -Raw
if ($envContent -notmatch 'PUBLIC_BASE_URL\s*=\s*\S+') {
    Write-Host ''
    Write-Host '  PUBLIC_BASE_URL no esta en tests/.env.' -ForegroundColor Yellow
    Write-Host '  Necesario para probar los endpoints /api de Vercel.' -ForegroundColor Yellow
    $baseUrl = Read-Host '  Pega la URL de produccion (ej. https://stella-maris.vercel.app) o ENTER para saltar'

    if ($baseUrl -and $baseUrl.Trim() -ne '') {
        Add-Content -Path $testsEnv -Value "`nPUBLIC_BASE_URL=$baseUrl"
        Write-Ok "PUBLIC_BASE_URL agregado: $baseUrl"
    } else {
        Write-Host '  [WARN] Los tests de /api se van a saltar.' -ForegroundColor Yellow
    }
} else {
    Write-Ok 'PUBLIC_BASE_URL ya esta configurado'
}

# ----------------------------------------------------------------------------
# 3. Ejecutar pruebas integradas
# ----------------------------------------------------------------------------

Write-Header '1/2 - Pruebas integradas (Supabase + Vercel)'
Write-Host '  Esto valida RLS, RPC, Storage policies y CORS.' -ForegroundColor White
Write-Host '  No genera carga significativa.' -ForegroundColor White
Write-Host ''

$integrationLog = Join-Path $outputDir "integration_$timestamp.log"
$integrationExit = 0

try {
    # Capturar todo, mostrar en consola, y escribir a archivo con encoding UTF-8.
    # Esto reemplaza Tee-Object -Encoding utf8 que solo existe en PowerShell 6+.
    $rawOutput = node tests/integration/run-all.mjs 2>&1 | Out-String
    $integrationExit = $LASTEXITCODE
    Write-Host $rawOutput
    [System.IO.File]::WriteAllText($integrationLog, $rawOutput, [System.Text.Encoding]::UTF8)
} catch {
    Write-Err "Error ejecutando run-all.mjs: $_"
    $integrationExit = 99
}

if ($integrationExit -eq 0) {
    Write-Ok 'Pruebas integradas: TODAS pasaron'
} elseif ($integrationExit -eq 1) {
    Write-Err 'Pruebas integradas: hay fallas - revisar el output arriba'
} else {
    Write-Err 'Pruebas integradas: error fatal de ejecucion'
}

Write-Host ''
Write-Host "  Output guardado en: $integrationLog" -ForegroundColor Cyan

# ----------------------------------------------------------------------------
# 4. Confirmar estres
# ----------------------------------------------------------------------------

Write-Header '2/2 - Pruebas de estres (carga BAJA: 35 req/min)'
Write-Host '  Dispara 35 peticiones a /api/sheets durante 60 segundos.' -ForegroundColor White
Write-Host '  Verifica que el rate limit responda con 429 cuando se excede.' -ForegroundColor White
Write-Host ''

$response = Read-Host '  Ejecutar prueba de estres? (s/N)'
$stressLog = ''

if ($response -match '^[sS]') {
    $stressLog = Join-Path $outputDir "stress_$timestamp.log"

    try {
        $rawStress = node tests/stress/rate-limit.mjs 2>&1 | Out-String
        Write-Host $rawStress
        [System.IO.File]::WriteAllText($stressLog, $rawStress, [System.Text.Encoding]::UTF8)
    } catch {
        Write-Err "Error ejecutando rate-limit.mjs: $_"
    }

    Write-Host ''
    Write-Host "  Output guardado en: $stressLog" -ForegroundColor Cyan
} else {
    Write-Host '  Salteada.' -ForegroundColor DarkGray
}

# ----------------------------------------------------------------------------
# 5. Proximos pasos manuales
# ----------------------------------------------------------------------------

Write-Header 'Pruebas completas - proximos pasos manuales'

Write-Host ''
Write-Host '  Para completar el ciclo de QA, falta correr:' -ForegroundColor White
Write-Host ''
Write-Host '  3. Verificaciones SQL en el SQL Editor de Supabase' -ForegroundColor White
Write-Host '     Abri:  tests/sql/checks.sql' -ForegroundColor White
Write-Host '     Pega cada bloque (separados por --- ---) y ejecuta uno por uno.' -ForegroundColor White
Write-Host '     Anota los resultados en INFORME.md seccion 4.' -ForegroundColor White
Write-Host ''
Write-Host '  4. Smoke test caja negra desde celular real' -ForegroundColor White
Write-Host '     Abri:  tests/smoke/CHECKLIST.md' -ForegroundColor White
Write-Host '     Conectate al dominio de produccion desde tu telefono y marca' -ForegroundColor White
Write-Host '     cada [ ] mientras vas probando los 68 casos.' -ForegroundColor White
Write-Host ''
Write-Host '  5. Armar el informe final' -ForegroundColor White
Write-Host '     Abri:  tests/INFORME.md' -ForegroundColor White
Write-Host '     Pega los outputs guardados en tests/output/:' -ForegroundColor White
Write-Host "       - $integrationLog" -ForegroundColor White

if ($stressLog -ne '') {
    Write-Host "       - $stressLog" -ForegroundColor White
}

Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host '  Listo. Outputs en: tests/output/' -ForegroundColor Cyan
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ''
