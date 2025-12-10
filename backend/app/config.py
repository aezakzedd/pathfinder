"""
Configuration and environment variable validation using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # CORS origins
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # Rate limiting
    rate_limit_enabled: bool = True
    route_options_rate_limit: str = "10/minute"
    chat_rate_limit: str = "20/minute"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.cors_origins.split(',')]


# Global settings instance
settings = Settings()

