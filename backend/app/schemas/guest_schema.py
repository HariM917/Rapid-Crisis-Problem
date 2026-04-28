from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
import re

class GuestBase(BaseModel):
    phone_number: str
    room_number: str
    guest_name: Optional[str] = None

    @validator('phone_number')
    def validate_indian_phone(cls, v):
        if not re.match(r'^\+91[6789]\d{9}$', v):
            raise ValueError('Invalid Indian phone number. Must start with +91 followed by 10 digits.')
        return v

class GuestCreate(GuestBase):
    pass

class GuestUpdate(BaseModel):
    room_number: Optional[str] = None
    guest_name: Optional[str] = None

class GuestResponse(GuestBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
