from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
import re

class IncidentBase(BaseModel):
    type: Optional[str] = None
    description: str
    lat: Optional[float] = 0.0
    lng: Optional[float] = 0.0
    phone_number: Optional[str] = None
    room_name: Optional[str] = None
    reporter_id: Optional[int] = None

    @validator('phone_number')
    def validate_phone(cls, v):
        if v and v.strip():
            # Support international formats (+, -, spaces)
            if not re.match(r'^\+?[0-9\s\-]{10,15}$', v):
                raise ValueError('Invalid phone number format.')
        return v

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_staff_id: Optional[int] = None

class IncidentResponse(IncidentBase):
    id: int
    status: str
    priority: str
    response_steps: Optional[Any] = None
    guest_steps: Optional[str] = None
    staff_steps: Optional[str] = None
    timeline: Optional[List[Any]] = None
    room_name: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime
    assigned_staff_id: Optional[int] = None
    assigned_staff_name: Optional[str] = None
    assigned_staff_role: Optional[str] = None

    class Config:
        from_attributes = True

