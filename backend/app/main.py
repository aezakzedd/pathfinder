from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.api import ai, routes
from app.middleware.error_middleware import catch_exceptions_middleware
from app.config import settings
import app.logging_config as logging_config

app = FastAPI(
    title='IoTinerary API',
    description='API for IoTinerary - Tourist spot discovery and route planning',
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

# Configure CORS from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.middleware('http')(catch_exceptions_middleware)

app.include_router(ai.router, prefix='/api')
app.include_router(routes.router, prefix='/api')

@app.get('/api/health')
async def health():
    return {'status':'ok'}
