"""
Pydantic schemas for AI/chat endpoints
"""
from pydantic import BaseModel, Field, field_validator


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


class ChatResponse(BaseModel):
    """Response model for AI chat"""
    reply: str = Field(..., description="AI-generated reply")

