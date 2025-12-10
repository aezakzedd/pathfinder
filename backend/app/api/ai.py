"""
AI/chat API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Request
from app.schemas.ai import ChatRequest, ChatResponse
from loguru import logger

router = APIRouter(
    tags=["ai"],
    responses={
        400: {"description": "Invalid request"},
        500: {"description": "Internal server error"}
    }
)


@router.post(
    '/chat',
    response_model=ChatResponse,
    summary="Chat with AI",
    description="Send a prompt to the AI assistant and receive a response. Rate limited to 20 requests per minute per IP."
)
async def chat(request: Request, req: ChatRequest) -> ChatResponse:
    """
    Chat with the AI assistant.
    
    - **prompt**: User's question or prompt (1-2000 characters)
    
    Returns an AI-generated response. This is currently a placeholder implementation.
    """
    try:
        logger.info(f'Received chat prompt (length={len(req.prompt)})')
        
        # TODO: Placeholder AI pipeline:
        # - validate prompt (already done by Pydantic)
        # - enqueue or call provider (do NOT store provider keys here in code)
        # - return a safe placeholder response
        # Replace this section with actual AI provider integration on backend when ready.
        
        # Placeholder response
        reply = "This is a placeholder reply from the backend AI pipeline. Integrate provider later."
        
        return ChatResponse(reply=reply)
    except ValueError as e:
        logger.warning(f"Validation error in chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )
