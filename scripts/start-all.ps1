# Start all NyayaAI services in separate PowerShell windows
# - Infrastructure (docker-compose)
# - Auth Service (8000)
# - Upload Service (8001)
# - Embedding Service (8002)
# - Frontend (npm start)

param(
    [switch]$SkipDocker
)

$repoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "Repo root: $repoRoot"

function Start-Window {
    param(
        [string]$Title,
        [string]$WorkingDir,
        [string]$Command
    )
    $escapedDir = $WorkingDir.Replace("'", "''")
    $args = "-NoExit -Command cd '$escapedDir'; $Command"
    Start-Process -FilePath "powershell" -ArgumentList $args -WindowStyle Normal
    Write-Host "Started: $Title"
}

if (-not $SkipDocker) {
    if (Test-Path (Join-Path $repoRoot "docker-compose.yml")) {
        Write-Host "Starting Docker infrastructure..."
        Set-Location $repoRoot
        docker-compose up -d
        
        Write-Host "Waiting for Docker services to be ready (30 seconds)..."
        Start-Sleep -Seconds 30
    } else {
        Write-Warning "docker-compose.yml not found; skipping infra start."
    }
}

# Run database migrations
Write-Host "Running database migrations..."
$authServicePath = Join-Path $repoRoot "services/auth-service"
if (Test-Path $authServicePath) {
    Set-Location $authServicePath
    Write-Host "  - Auth service migrations..."
    alembic upgrade head
}

$uploadServicePath = Join-Path $repoRoot "services/upload-service"
if (Test-Path $uploadServicePath) {
    Set-Location $uploadServicePath
    Write-Host "  - Upload service migrations..."
    alembic upgrade head
}

Write-Host "Migrations complete. Starting services..."
Set-Location $repoRoot

# Python services
Start-Window -Title "Auth Service (8000)" -WorkingDir (Join-Path $repoRoot "services/auth-service") -Command "uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
Start-Window -Title "Upload Service (8001)" -WorkingDir (Join-Path $repoRoot "services/upload-service") -Command "python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8001"
Start-Window -Title "Embedding Service (8002)" -WorkingDir (Join-Path $repoRoot "services/embedding-service") -Command "python -m uvicorn src.main:app --host 0.0.0.0 --port 8002"
Start-Window -Title "Query Service (8003)" -WorkingDir (Join-Path $repoRoot "services/query-service") -Command "python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8003"

# Ollama server (optional - skip if not installed)
$ollamaFound = $false
$ollamaPath = $null

# Try to find ollama in PATH
try {
    $ollamaCmd = Get-Command ollama -ErrorAction Stop
    $ollamaFound = $true
    $ollamaPath = $ollamaCmd.Source
    Write-Host "Found Ollama in PATH: $ollamaPath"
} catch {
    # Check common Windows installation path
    $defaultOllamaPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
    if (Test-Path $defaultOllamaPath) {
        $ollamaFound = $true
        $ollamaPath = $defaultOllamaPath
        Write-Host "Found Ollama at: $ollamaPath"
    }
}

if ($ollamaFound) {
    Start-Window -Title "Ollama Server" -WorkingDir $repoRoot -Command "& '$ollamaPath' serve"
    Write-Host "Starting Ollama Server..."
} else {
    Write-Host "Warning: Ollama not detected. Install from https://ollama.ai or ensure it's in PATH"
}

# Frontend
Start-Window -Title "Frontend (3000)" -WorkingDir (Join-Path $repoRoot "frontend") -Command "npm start"

Write-Host "All services starting..."