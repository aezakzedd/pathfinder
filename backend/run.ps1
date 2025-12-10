# Check if virtual environment exists and is valid
$venvExists = Test-Path .venv\Scripts\Activate.ps1
$venvNeedsRecreation = $false

if ($venvExists) {
    # Check if Python executable in venv actually exists (detects moved/copied venvs)
    $venvPython = ".venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        Write-Host "Virtual environment Python executable not found. Recreating..." -ForegroundColor Yellow
        $venvNeedsRecreation = $true
    } else {
        # Try to run python to verify it works
        try {
            $null = & $venvPython --version 2>&1
        } catch {
            Write-Host "Virtual environment appears broken. Recreating..." -ForegroundColor Yellow
            $venvNeedsRecreation = $true
        }
    }
}

# Recreate venv if needed or if it doesn't exist
if ($venvNeedsRecreation -or -not $venvExists) {
    if ($venvExists) {
        Write-Host "Removing old virtual environment..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force .venv
        Start-Sleep -Seconds 1  # Give filesystem time to release locks
    }
    Write-Host "Creating new virtual environment..." -ForegroundColor Green
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtual environment. Make sure Python is installed." -ForegroundColor Red
        exit 1
    }
    Write-Host "Virtual environment created successfully!" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
. .venv\Scripts\Activate.ps1

# Check if requirements are installed (only install if venv was just created)
if ($venvNeedsRecreation -or -not $venvExists) {
    Write-Host "Installing requirements..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install requirements." -ForegroundColor Red
        exit 1
    }
    Write-Host "Requirements installed successfully!" -ForegroundColor Green
} else {
    # For existing venvs, check if uvicorn exists (skip installation if it does)
    $uvicornOutput = python -m pip show uvicorn 2>&1
    if (-not $? -or $LASTEXITCODE -ne 0) {
        Write-Host "Some packages are missing. Installing requirements..." -ForegroundColor Yellow
        python -m pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install requirements." -ForegroundColor Red
            exit 1
        }
        Write-Host "Requirements installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Requirements already installed. Skipping installation." -ForegroundColor Green
    }
}

# Run the server
Write-Host "Starting FastAPI server..." -ForegroundColor Green
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000