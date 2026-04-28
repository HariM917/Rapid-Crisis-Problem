from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user_model import User
from pydantic import BaseModel

router = APIRouter(prefix="/user", tags=["users"])

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    skills: str = None
    is_available: int
    location_lat: float = None
    location_lng: float = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    role: str
    skills: str
    password: str = "password"

@router.post("/register", response_model=UserResponse)
def register_staff(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        username=user.username,
        role=user.role,
        skills=user.skills,
        password=user.password,
        email=f"{user.username}@system.local",
        is_available=1,
        location_lat=13.111,
        location_lng=80.135
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/all", response_model=List[UserResponse])
def get_all_staff(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role != "admin").all()

@router.patch("/staff/{id}/location")
def update_staff_location(id: int, lat: float, lng: float, db: Session = Depends(get_db)):
    staff = db.query(User).filter(User.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    staff.location_lat = lat
    staff.location_lng = lng
    db.commit()
    return {"status": "updated"}

