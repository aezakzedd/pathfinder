"""
Pydantic schemas for route-related endpoints
"""
from pydantic import BaseModel, Field, field_validator
from typing import List


class Coordinates(BaseModel):
    """Geographic coordinates"""
    lng: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")
    lat: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")

    @field_validator('lng', 'lat')
    @classmethod
    def validate_not_nan(cls, v: float) -> float:
        if v != v:  # Check for NaN
            raise ValueError('Coordinate cannot be NaN')
        return v


class RouteRequest(BaseModel):
    """Request model for route planning"""
    from_: Coordinates = Field(..., alias='from', description="Starting coordinates")
    to: Coordinates = Field(..., description="Destination coordinates")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "from": {"lng": 124.393269, "lat": 13.689568},
                "to": {"lng": 124.394875, "lat": 13.690098}
            }
        }


class RouteOption(BaseModel):
    """A route option with estimated time"""
    id: str = Field(..., description="Route option identifier (e.g., 'fastest', 'scenic')")
    eta_mins: int = Field(..., ge=0, description="Estimated time of arrival in minutes")


class RouteOptionsResponse(BaseModel):
    """Response model for route options"""
    options: List[RouteOption] = Field(..., description="List of available route options")

