"""
Configuration and environment variable validation using Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # CORS origins (use "*" for development to allow network access, or specify IPs)
    cors_origins: str = "*"  # Allows all origins - change to specific IPs in production
    
    # Rate limiting
    rate_limit_enabled: bool = True
    route_options_rate_limit: str = "10/minute"
    chat_rate_limit: str = "20/minute"
    
    # AI Settings (optional - loaded by pipeline directly from env)
    gemini_api_key: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # Ignore extra env vars not defined here
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.cors_origins.split(',')]


# Global settings instance
settings = Settings()

