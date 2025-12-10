# Pathfinder

A tourist spot discovery and route planning application that displays 3D models on a map using MapLibre GL JS and Three.js, powered by an AI chatbot assistant for personalized tourism recommendations.

## Project Structure

```
.
├── backend/          # FastAPI backend server with AI chatbot
├── frontend/         # React frontend application
│   ├── src/         # React source code
│   ├── public/      # Static assets (3D models, etc.)
│   ├── package.json # Frontend dependencies
│   └── ...
└── README.md
```

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **Python 3.12.3** (recommended for dependency compatibility)
- **MapTiler API Key** - Get one at [maptiler.com](https://www.maptiler.com/)
- **Google Gemini API Key** - Get one at [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) (required for enhanced AI chatbot responses)

## Step-by-Step Setup Guide

### Step 1: Clone and Navigate to Project

```bash
# If you haven't already cloned the repository
git clone <repository-url>
cd pathfinder
```

### Step 2: Backend Setup (AI Chatbot)

#### 2.1 Navigate to Backend Directory

```bash
cd backend
```

#### 2.2 Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```bash
# backend/.env

# Google Gemini API Key (REQUIRED for enhanced AI chatbot responses)
# Get your API key at: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Rate Limiting (optional - defaults provided)
RATE_LIMIT_ENABLED=true
ROUTE_OPTIONS_RATE_LIMIT=10/minute
CHAT_RATE_LIMIT=20/minute
```

**Important:** Replace `your_gemini_api_key_here` with your actual Google Gemini API key. The chatbot will work in offline mode without this key, but responses will be basic. With the API key, you get enhanced, context-aware responses.

#### 2.3 Setup Python Virtual Environment

**Windows (PowerShell):**
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
python -m venv .venv
source .venv/bin/activate
```

**Note:** If you encounter "ExecutionPolicy" errors on Windows, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2.4 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages including:
- FastAPI (web framework)
- ChromaDB (vector database for RAG)
- Google Generative AI (Gemini API client)
- And other dependencies

#### 2.5 Initialize AI Vector Database (First Time Only)

The AI chatbot uses a RAG (Retrieval-Augmented Generation) pipeline with ChromaDB. The vector database will be automatically created on first run, but if you need to rebuild it:

```bash
python init_ai.py
```

This initializes the vector store from the knowledge base in `app/data/dataset.json`.

#### 2.6 Run the Backend Server

**Windows (using PowerShell script):**
```powershell
.\run.ps1
```

**Or manually:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/Mac:**
```bash
python run.py
```

The backend API will be available at `http://localhost:8000`

**Verify Backend is Running:**
- Visit `http://localhost:8000/api/health` in your browser
- You should see a health check response
- Check the console for any startup errors

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend Directory

Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
```

#### 3.2 Create Environment File

Create a `.env` file in the `frontend` directory with the following content:

```bash
# frontend/.env
VITE_MAPTILER_KEY=your_maptiler_api_key_here
VITE_API_URL=http://localhost:8000/api
```

**Important:** Replace `your_maptiler_api_key_here` with your actual MapTiler API key.

#### 3.3 Install Frontend Dependencies

```bash
npm install
```

#### 3.4 Run the Frontend Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

**Verify Frontend is Running:**
- Open your browser and visit `http://localhost:5173`
- You should see the Pathfinder application
- The map should load with tourist spots displayed

### Step 4: Test the AI Chatbot

1. **Ensure both backend and frontend are running:**
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:5173`

2. **Open the chatbot interface** in the frontend application (usually accessible via a chat icon or button)

3. **Test the chatbot with sample queries:**
   - "What are the best surfing spots in Catanduanes?"
   - "Tell me about tourist attractions near Virac"
   - "Ano ang mga lugar na pwedeng puntahan sa Catanduanes?" (Filipino/Tagalog)

4. **Verify AI features:**
   - The chatbot should provide relevant tourism information
   - If you configured `GEMINI_API_KEY`, responses should be more detailed and context-aware
   - The chatbot should identify and suggest places mentioned in the conversation

### Step 5: Verify Complete Setup

✅ **Checklist:**

- [ ] Backend server is running on port 8000
- [ ] Frontend server is running on port 5173
- [ ] Backend `.env` file has `GEMINI_API_KEY` configured
- [ ] Frontend `.env` file has `VITE_MAPTILER_KEY` configured
- [ ] Map loads correctly in the frontend
- [ ] Tourist spots are visible on the map
- [ ] AI chatbot responds to queries
- [ ] Health endpoint (`http://localhost:8000/api/health`) returns success

## AI Chatbot Features

The Pathfinder AI chatbot is powered by a RAG (Retrieval-Augmented Generation) pipeline that provides intelligent tourism assistance:

### Key Features

1. **Multilingual Support**
   - Handles English and Filipino (Tagalog) queries
   - Natural language understanding for tourism-related questions

2. **Smart Place Extraction**
   - Automatically identifies tourist places mentioned in conversations
   - Provides coordinates and details for map integration

3. **Two Modes of Operation**
   - **Offline Mode**: Works without internet using the local knowledge base (basic responses)
   - **Online Mode**: Enhanced responses via Google Gemini API (requires `GEMINI_API_KEY`)

4. **Knowledge Base**
   - Pre-loaded with comprehensive information about Catanduanes tourist spots
   - Located in `backend/app/data/dataset.json`
   - Vector database stored in `backend/app/data/chroma_storage/`

5. **Content Safety**
   - Built-in profanity filter
   - Safe and appropriate responses for tourism queries

### Using the Chatbot

**API Endpoint:** `POST http://localhost:8000/api/chat`

**Request Example:**
```json
{
  "prompt": "What are the best surfing spots in Catanduanes?"
}
```

**Response Example:**
```json
{
  "reply": "Puraran Beach is the most famous surfing destination in Catanduanes, known for its 'Majestic' waves...",
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

## 3D Models with Three.js

Pathfinder uses **Three.js** to render interactive 3D models of tourist attractions directly on the map. This creates an immersive experience where users can see detailed 3D representations of landmarks and tourist spots.

### Key Features

1. **3D Model Rendering**
   - Renders GLTF/GLB 3D models on MapLibre maps
   - Models are positioned at precise geographic coordinates
   - Supports custom scaling, rotation, and altitude offsets
   - Automatically adapts to terrain elevation when terrain is enabled

2. **Performance Optimizations**
   - Model caching to avoid re-downloading models
   - Automatic retry logic with exponential backoff
   - Efficient rendering using MapLibre's custom layer interface
   - Performance toggle to disable 3D models on lower-end devices

3. **Interactive Markers**
   - Circular gradient markers for each 3D model location
   - Click handlers to select and zoom to models
   - Smooth camera animations with proper pitch and zoom
   - Visual feedback on hover

### How It Works

**Architecture:**
- **Three.js** (`v0.181.2`) provides 3D rendering capabilities
- **GLTFLoader** loads GLTF/GLB model files from the `public/` directory
- **MapLibre Custom Layers** integrate Three.js scenes into the map
- Models share the map's WebGL context for optimal performance

**Implementation Details:**
- Models are loaded asynchronously with progress tracking
- Each model creates a custom MapLibre layer with a Three.js scene
- The renderer uses MapLibre's projection matrices for geographic accuracy
- Models automatically adjust their position based on terrain elevation

### Adding New 3D Models

To add a new 3D model to the map:

1. **Add the model file** to `frontend/public/` (e.g., `frontend/public/my-model/`)

2. **Update the configuration** in `frontend/src/config/touristSpots.ts`:

```typescript
export const touristSpotModels: Model3DConfig[] = [
  {
    id: 'unique-model-id',
    modelPath: '/my-model/model.glb',  // Path relative to public/
    coordinates: [124.324955, 13.559159],  // [longitude, latitude]
    altitude: 25,  // Meters above ground (or terrain)
    rotation: [Math.PI / 2, 0, 0],  // [x, y, z] in radians
    scale: 4.0,  // Scale factor (1.0 = original size)
    name: "Model Display Name"
  }
]
```

3. **Model Configuration Options:**
   - `id`: Unique identifier for the model
   - `modelPath`: Relative path to GLTF/GLB file from `public/`
   - `coordinates`: `[longitude, latitude]` in decimal degrees
   - `altitude`: Height offset in meters (0 = ground level)
   - `rotation`: `[x, y, z]` rotation in radians (default: `[π/2, 0, 0]`)
   - `scale`: Scale multiplier (default: `0.3`)

### Model Format Requirements

- **Format**: GLTF (`.gltf`) or GLB (`.glb`) binary format
- **Optimization**: Recommended to use compressed GLB format for smaller file sizes
- **Origin**: Model origin should be at the base/bottom for proper terrain alignment
- **File Size**: Keep models under 10MB for optimal loading performance

### Custom Hooks

**`useMap3DModels` Hook:**
- Manages loading and displaying multiple 3D models
- Handles visibility toggles
- Provides loading state and error handling
- Automatically syncs with terrain changes

**`useMap3DMarkers` Hook:**
- Creates interactive markers for each 3D model
- Supports geographic offset for marker placement
- Handles click events and camera animations

### Example: Camera Animation

When a user clicks on a marker, the map smoothly animates to the model:

```typescript
map.flyTo({
  center: model.coordinates,
  zoom: 17.7,  // Dynamically calculated based on model scale
  pitch: 65,   // Tilted view to see 3D model better
  duration: 1500,
  essential: true
})
```

### Troubleshooting 3D Models

#### Models Not Loading
- **Check**: Verify the model path in `touristSpots.ts` matches the file location in `public/`
- **Check**: Ensure the model file is in GLTF/GLB format
- **Check**: Check browser console for loading errors

#### Models Appear Too Small or Large
- **Solution**: Adjust the `scale` property in the model configuration
- **Default**: Scale of `0.3` works well for most models

#### Models Floating or Sunk Underground
- **Solution**: Adjust the `altitude` property (positive = higher, negative = lower)
- **Note**: Models automatically adjust for terrain elevation when terrain is enabled

#### Performance Issues
- **Solution**: Enable Performance Mode using the gear icon (disables 3D models)
- **Optimization**: Use compressed GLB format and optimize model geometry

## Building for Production

### Frontend Build

Build the frontend for production:

```bash
cd frontend
npm run build
```

The production build will be created in the `frontend/dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
cd frontend
npm run preview
```

### Backend Production

For production deployment, use a production ASGI server like Gunicorn:

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

### Backend Issues

#### "Fatal error in launcher" or "The system cannot find the file specified"
- **Cause**: Virtual environment was created in a different location
- **Solution**: 
  - Delete the `.venv` folder
  - Recreate the virtual environment and reinstall dependencies
  - Or use `python run.py` which handles this automatically

#### PowerShell Execution Policy Error
- **Solution**: Run this command in PowerShell:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  Or run directly: `powershell -ExecutionPolicy Bypass -File .\run.ps1`

#### ChromaDB/SQLite Errors
- **Cause**: Database corruption or Python version incompatibility
- **Solution**:
  1. Ensure you're using Python 3.12.x
  2. Delete the `backend/app/data/chroma_storage` folder
  3. Restart the server (database will rebuild automatically)

#### AI Chatbot Not Responding
- **Check**: Verify `GEMINI_API_KEY` is set in `backend/.env`
- **Note**: The chatbot will still work in offline mode, but responses will be more basic
- **Test**: Visit `http://localhost:8000/api/health` to verify backend is running

#### Rate Limiting Issues
- **Cause**: Too many requests in a short time
- **Defaults**: 20 requests/minute for chat, 10 requests/minute for route options
- **Adjust**: Modify rate limits in `backend/.env` file

### Frontend Issues

#### Map Not Loading
- **Check**: Verify `VITE_MAPTILER_KEY` is set in `frontend/.env`
- **Check**: Ensure `VITE_API_URL` points to your backend (`http://localhost:8000/api`)
- **Restart**: Stop and restart the dev server after changing `.env` file

#### API Connection Errors
- **Verify**: Backend is running on port 8000
- **Check**: CORS settings in `backend/.env` include your frontend URL
- **Test**: Visit `http://localhost:8000/api/health` directly

#### Port Already in Use
- **Solution**: 
  - Frontend: Vite will automatically use the next available port
  - Backend: Change the port in the run command: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`
  - Update `VITE_API_URL` in frontend `.env` to match the new port

## API Endpoints

### Health Check
- `GET /api/health` - Verify backend is running

### AI Chatbot
- `POST /api/chat` - Chat with Pathfinder AI
  - Body: `{ "prompt": "your question" }`
  - Returns: `{ "reply": "...", "places": [...] }`

### Tourist Places
- `GET /api/places` - Get all tourist places

### Route Planning
- `POST /api/route-options` - Get route options between two points
  - Body: `{ "from": { "lat": ..., "lng": ... }, "to": { "lat": ..., "lng": ... } }`

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
- **ChromaDB** - Vector database for RAG
- **Google Gemini API** - Enhanced AI responses
- **LangChain** - AI pipeline orchestration

## Additional Resources

- **Backend Documentation**: See `backend/README.md` for detailed backend setup and configuration
- **API Documentation**: When backend is running, visit `http://localhost:8000/docs` for interactive API documentation
- **MapTiler**: [maptiler.com](https://www.maptiler.com/) - Get your API key
- **Google Gemini**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) - Get your API key

