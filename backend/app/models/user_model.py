from sqlalchemy import Column, Integer, String, Enum, Float
from app.db.database import Base
import enum

class UserRole(enum.Enum):
    GUEST = "guest"
    STAFF = "staff"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="guest") # guest, staff, admin
    skills = Column(String, nullable=True) # comma-separated: cpr, fire_safety, security
    is_available = Column(Integer, default=1) # 1=available, 0=busy
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    location_floor = Column(Integer, default=1)
