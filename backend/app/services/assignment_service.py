from sqlalchemy.orm import Session
from app.models.user_model import User

def assign_nearest_staff(db: Session, incident_lat: float, incident_lng: float):
    # Mock logic to find nearest staff
    # In a real app, this would use a geospatial query
    staff = db.query(User).filter(User.role == "staff").first()
    return staff.id if staff else None
