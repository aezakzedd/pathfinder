from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.api import ai, routes
from app.middleware.error_middleware import catch_exceptions_middleware
from app.config import settings
import app.logging_config as logging_config
from loguru import logger

app = FastAPI(
    title='Pathfinder API',
    description='API for Pathfinder - Tourist spot discovery and route planning',
    version='1.0.0',
    docs_url='/api/docs',
    redoc_url='/api/redoc',
    openapi_url='/api/openapi.json'
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS - allow all origins for development
# This enables network access from phones and other devices
# CORS middleware automatically handles OPTIONS preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Cannot use credentials with wildcard
    allow_methods=["*"],  # Allow all HTTP methods (CORS middleware handles OPTIONS)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

app.middleware('http')(catch_exceptions_middleware)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with detailed logging"""
    body = None
    try:
        body = await request.body()
    except:
        pass
    
    logger.error(f"Validation error on {request.url.path}")
    logger.error(f"Request method: {request.method}")
    logger.error(f"Request headers: {dict(request.headers)}")
    logger.error(f"Request body: {body.decode('utf-8') if body else 'None'}")
    logger.error(f"Validation errors: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "message": "Invalid request format. Please check your request body."
        }
    )

app.include_router(ai.router, prefix='/api')
app.include_router(routes.router, prefix='/api')

@app.get('/api/health')
async def health():
    """Health check endpoint"""
    return {'status': 'ok'}
