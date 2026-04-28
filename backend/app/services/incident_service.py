from sqlalchemy.orm import Session
from app.models.incident_model import Incident
from app.schemas.incident_schema import IncidentCreate, IncidentUpdate

def get_incidents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Incident).offset(skip).limit(limit).all()

def create_incident(db: Session, incident: IncidentCreate):
    db_incident = Incident(
        type=incident.type,
        description=incident.description,
        lat=incident.lat,
        lng=incident.lng,
        phone_number=incident.phone_number,
        room_name=incident.room_name,
        reporter_id=incident.reporter_id
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def update_incident(db: Session, incident_id: int, incident_update: IncidentUpdate):
    db_incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if db_incident:
        for var, value in vars(incident_update).items():
            if value is not None:
                setattr(db_incident, var, value)
        db.commit()
        db.refresh(db_incident)
    return db_incident
