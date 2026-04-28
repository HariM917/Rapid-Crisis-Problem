from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.guest_model import GuestRegistration
from app.schemas.guest_schema import GuestCreate, GuestResponse, GuestUpdate

router = APIRouter(prefix="/guest", tags=["guests"])

@router.get("/all", response_model=List[GuestResponse])
def get_all_guests(db: Session = Depends(get_db)):
    return db.query(GuestRegistration).all()

@router.post("/register", response_model=GuestResponse)
def register_guest(guest: GuestCreate, db: Session = Depends(get_db)):
    db_guest = GuestRegistration(**guest.dict())
    db.add(db_guest)
    db.commit()
    db.refresh(db_guest)
    return db_guest

@router.delete("/{guest_id}")
def delete_guest(guest_id: int, db: Session = Depends(get_db)):
    db_guest = db.query(GuestRegistration).filter(GuestRegistration.id == guest_id).first()
    if not db_guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    db.delete(db_guest)
    db.commit()
    return {"message": "Guest deleted"}
