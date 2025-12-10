# Pathfinder Backend (FastAPI)

A tourism assistant backend with RAG-based AI powered by ChromaDB and Google Gemini.

## Requirements

- **Python 3.12.3** (recommended for dependency compatibility)
- Google Gemini API key (for enhanced AI responses)

## Quick Start

### Windows (PowerShell)

```powershell
cd backend

# Option 1: Use setup script (first time)
.\setup.ps1

# Option 2: Use run script (handles everything)
.\run.ps1

# Option 3: Manual
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

### Linux/Mac

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Google Gemini API Key (required for enhanced AI responses)
# Get your API key at: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Rate Limiting
RATE_LIMIT_ENABLED=true
ROUTE_OPTIONS_RATE_LIMIT=10/minute
CHAT_RATE_LIMIT=20/minute
```

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat` - Chat with Pathfinder AI
- `GET /api/places` - Get all tourist places
- `POST /api/route-options` - Get route options between two points

### Chat API

**Request:**
```json
{
  "prompt": "What are the best surfing spots in Catanduanes?"
}
```

**Response:**
```json
{
  "reply": "Puraran Beach is the most famous surfing destination in Catanduanes...",
  "places": [
    {
      "name": "Puraran Beach",
      "lat": 13.691803,
      "lng": 124.398829,
      "type": "surfing"
    }
  ]
}
```

## AI Features

The backend includes a RAG (Retrieval-Augmented Generation) pipeline that:

1. **Multilingual Support** - Handles English and Filipino (Tagalog) queries
2. **Place Extraction** - Automatically identifies mentioned places
3. **Offline Mode** - Works without internet (basic responses from RAG)
4. **Online Mode** - Enhanced responses via Google Gemini
5. **Profanity Filter** - Filters inappropriate language

## Troubleshooting

### "Fatal error in launcher" or "The system cannot find the file specified"
- This happens when the virtual environment was created in a different location
- Use `python run.py` instead - it handles this automatically
- Or manually delete `.venv` folder and run the script again

### PowerShell Execution Policy
If `run.ps1` doesn't work:
1. Check execution policy: `Get-ExecutionPolicy`
2. If restricted, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Or run directly: `powershell -ExecutionPolicy Bypass -File .\run.ps1`

### ChromaDB/SQLite Errors
- Make sure you're using Python 3.12.x
- Try deleting the `app/data/chroma_storage` folder to rebuild the database

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── ai.py          # AI chat endpoints
│   │   └── routes.py      # Route planning endpoints
│   ├── data/
│   │   ├── config.yaml    # AI pipeline configuration
│   │   ├── dataset.json   # Knowledge base Q&A pairs
│   │   └── chroma_storage/ # ChromaDB vector database (auto-generated)
│   ├── middleware/
│   │   └── error_middleware.py
│   ├── schemas/
│   │   ├── ai.py          # Pydantic schemas for AI
│   │   └── route.py       # Pydantic schemas for routes
│   ├── services/
│   │   └── pipeline.py    # RAG AI Pipeline
│   ├── config.py          # App settings
│   ├── logging_config.py  # Loguru configuration
│   └── main.py            # FastAPI app entry point
├── requirements.txt       # Python dependencies
├── run.py                 # Cross-platform run script
├── run.ps1               # Windows PowerShell run script
├── setup.ps1             # Windows setup script
└── README.md
```

## Notes

- Logging uses loguru to stdout
- Error middleware catches unhandled exceptions and returns a 500 with minimal detail for safety
- Rate limiting is enabled by default (20 requests/minute for chat)
