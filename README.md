# MapBoard React

A React project that displays a 3D model on a map using MapLibre GL JS and Three.js.

## Project Structure

```
.
├── backend/          # FastAPI backend server
├── frontend/         # React frontend application
│   ├── src/         # React source code
│   ├── public/      # Static assets (3D models, etc.)
│   ├── package.json # Frontend dependencies
│   └── ...
└── README.md
```

## Getting Started

### Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

**Important: Create a `.env` file** in the frontend directory with your MapTiler API key:

```bash
# frontend/.env
VITE_MAPTILER_KEY=your_maptiler_api_key_here
VITE_API_URL=http://localhost:8000/api
```

Install the dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

**Optional: Create a `.env` file** in the backend directory to configure CORS origins:

```bash
# backend/.env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

Create a virtual environment (Windows):
```bash
python -m venv .venv
.venv\Scripts\activate
```

Or on Linux/Mac:
```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the PowerShell script (Windows):
```bash
.\run.ps1
```

The backend API will be available at `http://localhost:8000`

### Build

Build for production (from frontend directory):

```bash
cd frontend
npm run build
```

### Preview

Preview the production build (from frontend directory):

```bash
cd frontend
npm run preview
```

## Technologies

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **MapLibre GL JS** - Map rendering
- **Three.js** - 3D model rendering
- **React Router** - Client-side routing
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Loguru** - Logging

