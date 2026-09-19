# PowerShell script to start the MindCare AI FastAPI backend server
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootPath = Split-Path -Parent $scriptPath
$backendPath = Join-Path $rootPath "backend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting MindCare AI FastAPI Backend on port 8000...   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location $backendPath

if (Test-Path ".\.venv\Scripts\python.exe") {
    & ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
} else {
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
}
