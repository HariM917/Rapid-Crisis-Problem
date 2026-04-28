from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.incident_schema import IncidentCreate, IncidentResponse, IncidentUpdate
from app.services import incident_service, ai_service, dispatch_service, map_service
from app.sockets.websocket import manager
from app.models.guest_model import GuestRegistration
from app.models.user_model import User
import json


router = APIRouter(prefix="/incident", tags=["incidents"])

@router.get("/all", response_model=List[IncidentResponse])
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    incidents = incident_service.get_incidents(db, skip=skip, limit=limit)
    for inc in incidents:
        if inc.assigned_staff_id:
            staff = db.query(User).filter(User.id == inc.assigned_staff_id).first()
            if staff:
                inc.assigned_staff_name = staff.username
                inc.assigned_staff_role = staff.skills or "General Staff"
    return incidents


@router.post("/create", response_model=IncidentResponse)
async def create_new_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    # Auto-classify and get intelligent suggestions
    ai_result = {"type": incident.type or "security", "priority": "high", "steps": ""}
    if incident.description:
        ai_result = await ai_service.classify_incident(incident.description)
    
    incident.type = ai_result.get("type", incident.type)
    
    # Create the incident with AI data
    db_incident = incident_service.create_incident(db, incident)
    db_incident.priority = ai_result.get("priority", "high")
    db_incident.response_steps = ai_result.get("steps", "")
    db_incident.guest_steps = ai_result.get("guest_steps", "")
    db_incident.staff_steps = ai_result.get("staff_steps", "")
    
    from datetime import datetime
    now_str = datetime.now().strftime("%H:%M")
    db_incident.timeline = json.dumps([
        {"time": now_str, "event": "Incident Detected", "status": "critical"},
        {"time": now_str, "event": "AI Classification Complete", "status": "info"}
    ])
    
    # Resolve Room Name from Phone Number or Map Data
    if db_incident.phone_number and db_incident.phone_number.strip():
        guest = db.query(GuestRegistration).filter(GuestRegistration.phone_number == db_incident.phone_number).first()
        if guest:
            db_incident.room_name = guest.room_number
            if guest.guest_name:
                db_incident.description = f"[Guest: {guest.guest_name}] " + db_incident.description
    
    if (db_incident.lat == 0.0 and db_incident.lng == 0.0) and db_incident.room_name:
        coords = map_service.get_coords_from_room(db_incident.room_name)
        db_incident.lat = coords["lat"]
        db_incident.lng = coords["lng"]
    elif not db_incident.room_name:
        db_incident.room_name = map_service.get_room_from_coords(db_incident.lat, db_incident.lng)
    
    # Smart Dispatch: Find and assign nearest skilled staff
    best_staff = dispatch_service.find_best_staff(db, db_incident)
    if best_staff:
        db_incident.assigned_staff_id = best_staff.id
        best_staff.is_available = 0 # Staff is now busy
        
        # Add to timeline
        timeline_data = json.loads(db_incident.timeline)
        timeline_data.append({"time": now_str, "event": f"Staff Dispatched: {best_staff.username}", "status": "success"})
        db_incident.timeline = json.dumps(timeline_data)

        
    db.commit()
    db.refresh(db_incident)
    
    # Broadcast via WebSocket
    await manager.broadcast({
        "event": "incident_created",
        "data": {
            "id": db_incident.id,
            "type": db_incident.type,
            "description": db_incident.description,
            "lat": db_incident.lat,
            "lng": db_incident.lng,
            "status": db_incident.status,
            "priority": db_incident.priority,
            "response_steps": db_incident.response_steps,
            "guest_steps": db_incident.guest_steps,
            "staff_steps": db_incident.staff_steps,
            "timeline": db_incident.timeline,
            "room_name": db_incident.room_name,
            "assigned_staff_id": db_incident.assigned_staff_id,
            "assigned_staff_name": best_staff.username if best_staff else None,
            "assigned_staff_role": (best_staff.skills if best_staff else None) or "General Staff"
        }
    })

    return db_incident

@router.patch("/{id}", response_model=IncidentResponse)
async def update_existing_incident(id: int, incident_update: IncidentUpdate, db: Session = Depends(get_db)):
    db_incident = incident_service.update_incident(db, id, incident_update)
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # If resolved, free up the staff
    if incident_update.status == 'resolved' and db_incident.assigned_staff_id:
        staff = db.query(User).filter(User.id == db_incident.assigned_staff_id).first()
        if staff:
            staff.is_available = 1
        
        # Update timeline
        from datetime import datetime
        now_str = datetime.now().strftime("%H:%M")
        timeline_data = json.loads(db_incident.timeline or "[]")
        timeline_data.append({"time": now_str, "event": "Incident Resolved", "status": "success"})
        db_incident.timeline = json.dumps(timeline_data)

    
    db.commit()
    db.refresh(db_incident)
    
    # Broadcast via WebSocket
    await manager.broadcast({
        "event": "incident_updated",
        "data": {
            "id": db_incident.id,
            "status": db_incident.status,
            "timeline": db_incident.timeline,
            "assigned_staff_id": db_incident.assigned_staff_id
        }
    })
    
    # Also broadcast staff update
    await manager.broadcast({
        "event": "staff_update",
        "data": {"id": db_incident.assigned_staff_id, "is_available": 1 if incident_update.status == 'resolved' else 0}
    })

    
    return db_incident

@router.delete("/purge")
async def purge_incidents(db: Session = Depends(get_db)):
    from app.models.incident_model import Incident
    db.query(Incident).delete()
    db.commit()
    return {"status": "success", "message": "All incidents purged."}
