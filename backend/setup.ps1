# Pathfinder Backend Setup Script for Windows
# Requires Python 3.12.3

Write-Host "=== Pathfinder Backend Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check Python version
$pythonVersion = python --version 2>&1
Write-Host "Detected Python: $pythonVersion" -ForegroundColor Yellow

if ($pythonVersion -notmatch "3\.12") {
    Write-Host "WARNING: Python 3.12.x is recommended for compatibility." -ForegroundColor Red
    Write-Host "Current version: $pythonVersion" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Python 3.12.3, visit: https://www.python.org/downloads/release/python-3123/" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Green
python -m venv .venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
.\.venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Green
python -m pip install --upgrade pip

# Install requirements
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Green
pip install -r requirements.txt

# Create .env file if not exists
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env file..." -ForegroundColor Green
    @"
# Pathfinder Backend Environment Variables

# Google Gemini API Key (required for enhanced AI responses)
# Get your API key at: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Rate Limiting
RATE_LIMIT_ENABLED=true
ROUTE_OPTIONS_RATE_LIMIT=10/minute
CHAT_RATE_LIMIT=20/minute
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "Created .env file. Please update GEMINI_API_KEY with your actual key." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To run the backend:" -ForegroundColor Green
Write-Host "  1. Activate virtual environment: .\.venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  2. Update .env with your GEMINI_API_KEY" -ForegroundColor White
Write-Host "  3. Run: python run.py" -ForegroundColor White
Write-Host ""
Write-Host "Or simply use: .\run.ps1" -ForegroundColor White

