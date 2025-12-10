"""
Pydantic schemas for AI/chat endpoints
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ChatRequest(BaseModel):
    """Request model for AI chat"""
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User's chat prompt or question"
    )

    @field_validator('prompt')
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Prompt cannot be empty or only whitespace')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "What are the best tourist spots in Catanduanes?"
            }
        }


class PlaceInfo(BaseModel):
    """Place information with coordinates"""
    name: str = Field(..., description="Name of the place")
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")
    type: str = Field(..., description="Type of place (surfing, swimming, hiking, etc.)")


class ChatResponse(BaseModel):
    """Response model for AI chat"""
    reply: str = Field(..., description="AI-generated reply")
    places: list[PlaceInfo] = Field(default_factory=list, description="Related places mentioned in the response")


class AllPlacesResponse(BaseModel):
    """Response model for all places endpoint"""
    places: list[PlaceInfo] = Field(..., description="List of all available places")
