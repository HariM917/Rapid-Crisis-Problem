import json
from app.db.database import SessionLocal
from app.models.user_model import User
from app.models.incident_model import Incident
from app.schemas.incident_schema import IncidentCreate
from app.services import incident_service

def seed_smart_demo():
    print("--- Seeding Smart Demo Scenario ---")
    db = SessionLocal()
    
    try:
        # 1. Create Staff Members with Skills
        staff_data = [
            {
                "username": "paramedic_sarah",
                "email": "sarah@aegis.com",
                "role": "staff",
                "skills": "cpr,medical",
                "location_lat": 22.2085,
                "location_lng": 114.0312
            },
            {
                "username": "fireman_mike",
                "email": "mike@aegis.com",
                "role": "staff",
                "skills": "fire_safety",
                "location_lat": 22.2082,
                "location_lng": 114.0318
            },
            {
                "username": "security_dave",
                "email": "dave@aegis.com",
                "role": "staff",
                "skills": "security",
                "location_lat": 22.2087,
                "location_lng": 114.0322
            }
        ]

        for data in staff_data:
            existing = db.query(User).filter(User.username == data["username"]).first()
            if not existing:
                staff = User(**data)
                db.add(staff)
                print(f"Created staff: {data['username']}")
        
        db.commit()

        # 2. Trigger a Smart Incident
        print("--- Triggering Smart Fire Incident ---")
        # We don't trigger the incident here because we want to do it via the API for full flow
        
        print("DONE: Demo seeded. Staff are now in the database.")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_smart_demo()

