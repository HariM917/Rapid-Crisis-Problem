from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # fire, medical, security
    description = Column(String)
    status = Column(String, default="active") # active, resolved
    priority = Column(String, default="high")
    response_steps = Column(String, nullable=True) # JSON string of suggested actions
    guest_steps = Column(String, nullable=True)
    staff_steps = Column(String, nullable=True)
    timeline = Column(String, nullable=True) # JSON string of events
    room_name = Column(String, nullable=True) # e.g. "Room 302"
    phone_number = Column(String, nullable=True)
    lat = Column(Float)
    lng = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    assigned_staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
