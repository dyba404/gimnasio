# gym.ps1 — Prender/apagar el servidor Marsmode gym (gym.marsmode.me)
#
# Stack: Supabase local (docker supabase cli) + web nginx + tunnel cloudflared.
# El dominio gym.marsmode.me resuelve via Cloudflare Tunnel (HTTPS automatico).
#
#   .\scripts\gym.ps1 on      # enciende WSL + docker + supabase + web + tunel
#   .\scripts\gym.ps1 deploy  # reconstruye la imagen marsmode-web y la publica
#   .\scripts\gym.ps1 off     # apaga SOLO el stack gym (no toca odontoflow)
#   .\scripts\gym.ps1 status  # diagnostico sin cambiar nada
#
# Nota: el script de odontoflow (marsmode-solo-prod.sh) apaga contenedores
# ajenos cuando enciende su prod; si eso pasa, este script los re-enciende.

param(
    [Parameter(Position = 0)]
    [ValidateSet("on", "deploy", "off", "status", "help")]
    [string]$cmd = "help"
)

$ErrorActionPreference = "Continue"

$raiz = Split-Path $PSScriptRoot -Parent
$composeWsl = "/mnt/c/Users/Administrator/Documents/projects/gimnasio/deploy/docker-compose.yml"
$envWsl = "/mnt/c/Users/Administrator/Documents/projects/gimnasio/app/.env.production"
$healthUrl = "https://gym.marsmode.me/login"

function Wsl([string]$inner, [int]$timeoutSeg = 120) {
    $job = Start-Job -ScriptBlock {
        param($i) & wsl.exe -d Ubuntu -u dev -- bash -c $i 2>&1
    } -ArgumentList $inner
    if (Wait-Job $job -Timeout $timeoutSeg) {
        $out = Receive-Job $job
        Remove-Job $job -Force
        return ($out | Out-String).Trim()
    }
    Stop-Job $job; Remove-Job $job -Force
    return $null
}

function Invoke-On {
    Write-Host "=== gym ON: encendiendo gym.marsmode.me ===" -ForegroundColor Cyan

    # Limpieza de clientes wsl.exe zombi: los Start-Job de Wsl() que
    # caducan dejan wsl.exe colgado; cientos de ellos agotan los sockets
    # del servicio WSL y wsl.exe empieza a fallar (0x80072747). Un cliente
    # sano vive segundos; >1h es zombi (no toca la VM ni contenedores).
    Get-Process wsl -ErrorAction SilentlyContinue |
        Where-Object { $_.StartTime -lt (Get-Date).AddHours(-1) } |
        Stop-Process -Force

    $null = Wsl "echo vivo" 60
    if (-not (Get-Process vmmem, vmmemWSL -ErrorAction SilentlyContinue)) {
        Write-Host "[on] ERROR: la VM WSL no arranco." -ForegroundColor Red
        return
    }
    Write-Host "[on] VM WSL arriba." -ForegroundColor Green

    Write-Host "[on] Daemon Docker..." -ForegroundColor Cyan
    $null = Wsl "sudo service docker start; sudo service docker status" 90

    Write-Host "[on] Supabase local (kong/db/auth/rest)..." -ForegroundColor Cyan
    $supa = Wsl "sudo docker start supabase_kong_gimnasio supabase_db_gimnasio supabase_auth_gimnasio supabase_rest_gimnasio supabase_studio_gimnasio supabase_realtime_gimnasio supabase_storage_gimnasio supabase_inbucket_gimnasio supabase_pg_meta_gimnasio supabase_vector_gimnasio supabase_analytics_gimnasio 2>&1 | tail -3" 180
    if ($null -eq $supa) { Write-Host "[on] AVISO: supabase no respondio (puede tardar)." -ForegroundColor Yellow }

    Write-Host "[on] Stack web + tunel (nginx + cloudflared)..." -ForegroundColor Cyan
    $out = Wsl "sudo docker compose --env-file $envWsl -f $composeWsl up -d 2>&1 | tail -5" 420
    if ($null -eq $out) {
        Write-Host "[on] ERROR: docker compose up no respondio." -ForegroundColor Red
        return
    }
    $out -split "`n" | ForEach-Object { if ($_.Trim()) { Write-Host "      $_" } }

    Write-Host "[on] Esperando HTTPS publico..." -ForegroundColor Cyan
    $ok = $false
    for ($i = 0; $i -lt 24; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -eq 200) { $ok = $true; break }
        } catch { }
        Start-Sleep 5
    }
    if ($ok) {
        Write-Host "[on] LISTO: https://gym.marsmode.me respondiendo 200." -ForegroundColor Green
    } else {
        Write-Host "[on] El health publico no respondio (tunel puede tardar). Revisa: gym.ps1 status" -ForegroundColor Yellow
    }
}

function Invoke-Deploy {
    Write-Host "=== gym DEPLOY: reconstruir imagen marsmode-web y publicar ===" -ForegroundColor Cyan

    $null = Wsl "echo vivo" 60
    if (-not (Get-Process vmmem, vmmemWSL -ErrorAction SilentlyContinue)) {
        Write-Host "[deploy] ERROR: la VM WSL no arranco." -ForegroundColor Red
        return
    }

    Write-Host "[deploy] Tag de rollback de la imagen actual..." -ForegroundColor Cyan
    $tagHoy = Get-Date -Format "yyyy-MM-dd"
    $null = Wsl "sudo docker tag marsmode-web:latest marsmode-web:rollback-$tagHoy 2>/dev/null; sudo docker images marsmode-web --format '{{.Repository}}:{{.Tag}}' | head -5" 60

    Write-Host "[deploy] Build de la imagen (npm ci + vite build dentro)..." -ForegroundColor Cyan
    $out = Wsl "sudo docker compose --env-file $envWsl -f $composeWsl build web 2>&1 | tail -8" 900
    if ($null -eq $out) {
        Write-Host "[deploy] ERROR: el build no respondio." -ForegroundColor Red
        return
    }
    $out -split "`n" | ForEach-Object { if ($_.Trim()) { Write-Host "      $_" } }

    Write-Host "[deploy] Publicando (up -d)..." -ForegroundColor Cyan
    $out = Wsl "sudo docker compose --env-file $envWsl -f $composeWsl up -d 2>&1 | tail -5" 300
    if ($null -eq $out) {
        Write-Host "[deploy] ERROR: docker compose up no respondio." -ForegroundColor Red
        return
    }
    $out -split "`n" | ForEach-Object { if ($_.Trim()) { Write-Host "      $_" } }

    Write-Host "[deploy] Esperando HTTPS publico..." -ForegroundColor Cyan
    $ok = $false
    for ($i = 0; $i -lt 24; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -eq 200) { $ok = $true; break }
        } catch { }
        Start-Sleep 5
    }
    if ($ok) {
        Write-Host "[deploy] LISTO: https://gym.marsmode.me respondiendo 200." -ForegroundColor Green
    } else {
        Write-Host "[deploy] El health publico no respondio. Revisa: gym.ps1 status" -ForegroundColor Yellow
    }
}

function Invoke-Off {
    Write-Host "=== gym OFF: apagando stack gym (odontoflow queda intacto) ===" -ForegroundColor Cyan
    # down tambien interpola el compose (args con :?) → necesita el env-file
    $out = Wsl "sudo docker compose --env-file $envWsl -f $composeWsl down 2>&1 | tail -3" 180
    if ($null -eq $out) {
        Write-Host "[off] WSL no responde; los contenedores se detendran al apagar la VM." -ForegroundColor Yellow
        return
    }
    $out -split "`n" | ForEach-Object { if ($_.Trim()) { Write-Host "      $_" } }
    Write-Host "[off] Stack gym abajo. Supabase local sigue corriendo (unless-stopped)." -ForegroundColor Green
    Write-Host "[off] Para liberar toda la RAM: wsl.exe --shutdown (apaga TODO WSL)." -ForegroundColor Yellow
}

function Invoke-Status {
    Write-Host "=== gym status ===" -ForegroundColor Cyan
    $mb = 0
    $p = Get-Process vmmem, vmmemWSL -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($p) { $mb = [math]::Round($p.WorkingSet64 / 1MB) }
    Write-Host ("VM WSL: {0}" -f $(if ($mb -gt 0) { "ENCENDIDA (${mb} MB)" } else { "APAGADA" }))

    if ($mb -gt 0) {
        $ps = Wsl "sudo docker ps --format '{{.Names}} | {{.Status}}' | grep -E 'marsmode|supabase'" 45
        if ($null -eq $ps -or -not $ps.Trim()) {
            Write-Host "Contenedores gym: NINGUNO corriendo." -ForegroundColor Yellow
        } else {
            Write-Host "Contenedores:"
            $ps -split "`n" | ForEach-Object { if ($_.Trim()) { Write-Host "  $_" } }
        }
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
            Write-Host ("HTTPS publico: HTTP {0}" -f $r.StatusCode) -ForegroundColor Green
        } catch {
            Write-Host "HTTPS publico: sin respuesta (VM on pero stack/tunel abajo?)" -ForegroundColor Yellow
        }
    }
}

switch ($cmd) {
    "on"     { Invoke-On }
    "deploy" { Invoke-Deploy }
    "off"    { Invoke-Off }
    "status" { Invoke-Status }
    "help"   { Get-Content $MyInvocation.PSCommandPath | Select-Object -First 10 }
}
