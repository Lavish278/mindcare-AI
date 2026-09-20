# PowerShell script to start the MindCare AI Vite React frontend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootPath = Split-Path -Parent $scriptPath
$frontendPath = Join-Path $rootPath "frontend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting MindCare AI Frontend Dev Server on port 5173... " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location $frontendPath
npm run dev

