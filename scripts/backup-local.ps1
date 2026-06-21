<#
  backup-local.ps1 - Respaldo local de Stella Maris (Windows PowerShell)

  Crea un ZIP fechado del proyecto (sin node_modules/build/.git) en
  C:\Backups\StellaMaris\ y copia .env.local a una carpeta de secretos APARTE
  (fuera del repo y de git). Incluye un MANIFEST con el commit respaldado.

  Uso:
    powershell -ExecutionPolicy Bypass -File scripts\backup-local.ps1
    powershell -ExecutionPolicy Bypass -File scripts\backup-local.ps1 -Dest "D:\MisBackups"

  Nota: archivo en ASCII a proposito (Windows PowerShell 5.1 + UTF-8 sin BOM
  rompe el parser con acentos). No agregar caracteres acentuados aqui.
#>

param(
  [string]$Dest = "C:\Backups\StellaMaris"
)

$ErrorActionPreference = "Stop"

# Raiz del proyecto = carpeta padre de /scripts
$projectRoot = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$secretsDir = Join-Path $Dest "secrets"
$zipPath = Join-Path $Dest "StellaMaris_$stamp.zip"

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
New-Item -ItemType Directory -Force -Path $secretsDir | Out-Null

Write-Host "Proyecto: $projectRoot"
Write-Host "Destino:  $zipPath"

# 1) MANIFEST con el commit y la fecha (se incluye en el ZIP)
$commit = "(sin git)"
try { $commit = (git -C $projectRoot rev-parse HEAD).Trim() } catch {}
$manifest = Join-Path $projectRoot "BACKUP-MANIFEST.txt"
$manifestText = @"
Stella Maris - Backup local
Fecha:   $stamp
Commit:  $commit
Origen:  $projectRoot
Nota:    .env.local se respalda APARTE en $secretsDir (no va en este ZIP).
"@
$manifestText | Out-File -FilePath $manifest -Encoding utf8

# 2) Copiar el proyecto a un staging temporal excluyendo lo pesado/reconstruible
$staging = Join-Path $env:TEMP "sm_backup_$stamp"
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory -Force -Path $staging | Out-Null

$exclude = @("node_modules", "build", ".git", ".vite", "dist", ".vercel")
robocopy $projectRoot $staging /E /XD $exclude /XF "*.log" | Out-Null
# robocopy devuelve codigos 0-7 como exito; normalizar para no abortar el script
if ($LASTEXITCODE -ge 8) { throw "robocopy fallo (codigo $LASTEXITCODE)" }
$global:LASTEXITCODE = 0

# Por las dudas, NO incluir .env* dentro del ZIP del codigo
Get-ChildItem -Path $staging -Recurse -Force -Filter ".env*" -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

# 3) Comprimir
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath
Remove-Item -Recurse -Force $staging
Remove-Item -Force $manifest -ErrorAction SilentlyContinue

# 4) Respaldar secretos APARTE (.env.local)
$envLocal = Join-Path $projectRoot ".env.local"
if (Test-Path $envLocal) {
  Copy-Item $envLocal (Join-Path $secretsDir ".env.local.$stamp")
  Write-Host "Secretos: .env.local respaldado en $secretsDir"
} else {
  Write-Warning ".env.local NO encontrado - recuerda respaldar las credenciales por separado."
}

$zipSize = "{0:N1} MB" -f ((Get-Item $zipPath).Length / 1MB)
Write-Host ""
Write-Host "OK - Backup creado: $zipPath ($zipSize)" -ForegroundColor Green
Write-Host "Commit respaldado: $commit"
Write-Host ""
Write-Host "Recuerda: guarda una copia en un disco o nube DISTINTOS a este PC." -ForegroundColor Yellow
Write-Host "Para datos (Supabase) corre tambien: node scripts/supabase-backup.mjs" -ForegroundColor Yellow
