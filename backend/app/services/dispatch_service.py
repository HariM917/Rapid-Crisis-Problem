import math
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.incident_model import Incident

def calculate_distance(lat1, lon1, lat2, lon2):
    # Basic Euclidean distance for building-scale demo
    return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2)

def find_best_staff(db: Session, incident: Incident):
    # Get all available staff
    staff_members = db.query(User).filter(
        User.role == "staff",
        User.is_available == 1,
        User.location_lat != None
    ).all()

    if not staff_members:
        return None

    # Mapping incident types to required skills
    skill_map = {
        "fire": "fire_safety",
        "medical": "cpr",
        "security": "security"
    }
    required_skill = skill_map.get(incident.type)

    best_staff = None
    min_score = float('inf')

    for staff in staff_members:
        distance = calculate_distance(incident.lat, incident.lng, staff.location_lat, staff.location_lng)
        
        # Skill bonus: Reduce effective distance score if staff has the required skill
        skill_score = distance
        if required_skill and staff.skills and required_skill in staff.skills.split(','):
            skill_score *= 0.1 # Heavily prioritize skilled staff even if slightly further
        
        if skill_score < min_score:
            min_score = skill_score
            best_staff = staff

    return best_staff
