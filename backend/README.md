Backend (FastAPI)
- Run:
  cd backend
  python -m venv .venv
  .venv\Scripts\activate  (Windows)
  source .venv/bin/activate  (Linux/Mac)
  pip install -r requirements.txt
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Or use the run.py script (recommended, works on all platforms):
  python run.py

Or use the run.ps1 script on Windows:
  .\run.ps1

If run.ps1 doesn't work:
1. Use the Python script instead: `python run.py` (recommended)
2. Or make sure you're in the backend directory: `cd backend`
3. Check execution policy: `Get-ExecutionPolicy`
4. If restricted, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
5. Or run directly: `powershell -ExecutionPolicy Bypass -File .\run.ps1`

If you see "Fatal error in launcher" or "The system cannot find the file specified":
- This happens when the virtual environment was created in a different location
- Use `python run.py` instead - it handles this automatically
- Or manually delete .venv folder and run the script again

Notes:
- Logging uses loguru to stdout.
- Error middleware catches unhandled exceptions and returns a 500 with minimal detail for safety.
- AI endpoints are placeholders; integrate provider server-side and keep keys in environment variables or secret manager.
`