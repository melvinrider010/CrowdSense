from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class CrowdEvent(BaseModel):
    device_id: str = Field(..., min_length=2, max_length=50, description="Unique identifier for the physical device")
    distance: float = Field(..., ge=0.0, description="Sensor distance metric in centimeters")
    status: str = Field(..., description="Crowd status tag")
    location: Optional[str] = Field("Unknown", max_length=100)
    timestamp: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["SAFE", "CROWD", "STAMPEDE_RISK", "STAMPEDE_WARNING"]
        upper_v = v.strip().upper()
        if upper_v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return upper_v