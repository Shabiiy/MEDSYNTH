from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="healthy", description="Current service health status")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Service semantic version")
    environment: str = Field(..., description="Running environment")
    timestamp: datetime = Field(..., description="Current server UTC timestamp")
