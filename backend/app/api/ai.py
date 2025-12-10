"""
AI/chat API endpoints - Integrated with Pathfinder RAG Pipeline
"""
from fastapi import APIRouter, HTTPException, status, Request
from app.schemas.ai import ChatRequest, ChatResponse, PlaceInfo, AllPlacesResponse
from app.services.pipeline import Pipeline
from loguru import logger

router = APIRouter(
    tags=["ai"],
    responses={
        400: {"description": "Invalid request"},
        500: {"description": "Internal server error"}
    }
)

# Initialize the Pipeline globally (singleton pattern for performance)
_pipeline: Pipeline | None = None


def get_pipeline() -> Pipeline:
    """Get or initialize the Pipeline singleton."""
    global _pipeline
    if _pipeline is None:
        logger.info("Initializing Pathfinder AI Pipeline...")
        try:
            _pipeline = Pipeline()
            logger.info("✅ Pathfinder AI Pipeline initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Pipeline: {e}")
            raise RuntimeError(f"Failed to initialize AI Pipeline: {e}")
    return _pipeline


@router.post(
    '/chat',
    response_model=ChatResponse,
    summary="Chat with Pathfinder AI",
    description="Send a question to the Pathfinder tourism assistant and receive a response with related places. Rate limited to 20 requests per minute per IP."
)
async def chat(request: Request, req: ChatRequest) -> ChatResponse:
    """
    Chat with the Pathfinder AI assistant.
    
    - **prompt**: User's question about Catanduanes tourism (1-2000 characters)
    
    Returns an AI-generated response with optional place recommendations.
    """
    try:
        logger.info(f'Received chat request from {request.client.host if request.client else "unknown"}')
        logger.info(f'Request headers: {dict(request.headers)}')
        logger.info(f'Chat prompt (length={len(req.prompt)}): {req.prompt[:100]}...')
        
        pipeline = get_pipeline()
        
        # Call the Pipeline's ask method
        reply, places_data = pipeline.ask(req.prompt)
        
        # Convert places to PlaceInfo schema
        places = [
            PlaceInfo(
                name=p["name"],
                lat=p["lat"],
                lng=p["lng"],
                type=p["type"]
            )
            for p in places_data
        ]
        
        logger.info(f'Generated response with {len(places)} places')
        
        return ChatResponse(reply=reply, places=places)
        
    except ValueError as e:
        logger.warning(f"Validation error in chat request: {e}")
        logger.warning(f"Request body: {await request.body() if hasattr(request, 'body') else 'N/A'}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    except RuntimeError as e:
        logger.error(f"Pipeline error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service is temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )


@router.get(
    '/places',
    response_model=AllPlacesResponse,
    summary="Get all places",
    description="Get all available tourist places with their coordinates for the map."
)
async def get_all_places() -> AllPlacesResponse:
    """
    Get all available places for the map.
    
    Returns a list of all tourist places with names, coordinates, and types.
    """
    try:
        pipeline = get_pipeline()
        places_data = pipeline.get_all_places()
        
        places = [
            PlaceInfo(
                name=p["name"],
                lat=p["lat"],
                lng=p["lng"],
                type=p["type"]
            )
            for p in places_data
        ]
        
        return AllPlacesResponse(places=places)
        
    except Exception as e:
        logger.error(f"Error fetching places: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch places"
        )
