#!/usr/bin/env python3
"""
Backend server startup script.
Handles virtual environment setup and runs the FastAPI server.
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def get_venv_python():
    """Get the path to the venv Python executable."""
    if sys.platform == 'win32':
        return Path('.venv/Scripts/python.exe')
    else:
        return Path('.venv/bin/python')

def get_venv_uvicorn():
    """Get the path to the venv uvicorn executable."""
    if sys.platform == 'win32':
        return Path('.venv/Scripts/uvicorn.exe')
    else:
        return Path('.venv/bin/uvicorn')

def venv_exists():
    """Check if virtual environment exists and is valid."""
    venv_python = get_venv_python()
    if not venv_python.exists():
        return False
    
    # Try to run Python to verify it works
    try:
        result = subprocess.run(
            [str(venv_python), '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, Exception):
        return False

def create_venv():
    """Create a new virtual environment."""
    print("Creating new virtual environment...", flush=True)
    result = subprocess.run(
        [sys.executable, '-m', 'venv', '.venv'],
        cwd=Path.cwd()
    )
    if result.returncode != 0:
        print("ERROR: Failed to create virtual environment.", flush=True)
        print("Make sure Python is installed and accessible.", flush=True)
        sys.exit(1)
    print("Virtual environment created successfully!", flush=True)

def install_requirements():
    """Install requirements in the virtual environment."""
    venv_python = get_venv_python()
    print("Installing requirements...", flush=True)
    result = subprocess.run(
        [str(venv_python), '-m', 'pip', 'install', '-r', 'requirements.txt'],
        cwd=Path.cwd()
    )
    if result.returncode != 0:
        print("ERROR: Failed to install requirements.", flush=True)
        sys.exit(1)
    print("Requirements installed successfully!", flush=True)

def check_requirements():
    """Check if requirements are installed."""
    venv_python = get_venv_python()
    result = subprocess.run(
        [str(venv_python), '-m', 'pip', 'show', 'uvicorn'],
        capture_output=True,
        text=True
    )
    return result.returncode == 0

def run_server():
    """Run the FastAPI server using uvicorn."""
    venv_uvicorn = get_venv_uvicorn()
    venv_python = get_venv_python()
    
    # Use python -m uvicorn for better compatibility
    print("Starting FastAPI server...", flush=True)
    result = subprocess.run(
        [
            str(venv_python), '-m', 'uvicorn',
            'app.main:app',
            '--reload',
            '--host', '0.0.0.0',
            '--port', '8000'
        ],
        cwd=Path.cwd()
    )
    sys.exit(result.returncode)

def main():
    """Main entry point."""
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if venv exists and is valid
    if not venv_exists():
        print("Virtual environment not found or invalid. Creating new one...", flush=True)
        if Path('.venv').exists():
            print("Removing old virtual environment...", flush=True)
            try:
                shutil.rmtree('.venv')
            except Exception as e:
                print(f"Warning: Could not remove old venv: {e}", flush=True)
        create_venv()
        install_requirements()
    else:
        print("Virtual environment found.", flush=True)
        # Check if requirements are installed
        if not check_requirements():
            print("Requirements not installed. Installing...", flush=True)
            install_requirements()
        else:
            print("Requirements already installed. Skipping installation.", flush=True)
    
    # Run the server
    run_server()

if __name__ == '__main__':
    main()

