from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.db.database import engine, Base, get_db, SessionLocal
from app.api.routes import incident, user, alert, guest
from app.sockets.websocket import manager
from app.models.user_model import User
from app.models.incident_model import Incident
from app.models.guest_model import GuestRegistration
from app.services.iot_service import iot_simulator
import uvicorn
import random

app = FastAPI(title="AI Crisis Coordination System")

@app.on_event("startup")
def configure_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed original staff if they don't exist
        staff_data = [
            {"username": "paramedic_sarah", "role": "paramedic", "skills": "CPR, Medical", "lat": 13.1115, "lng": 80.1352},
            {"username": "fireman_mike", "role": "firefighter", "skills": "Fire Safety", "lat": 13.1112, "lng": 80.1358},
            {"username": "security_dave", "role": "security", "skills": "Security", "lat": 13.1117, "lng": 80.1362}
        ]
        
        for s in staff_data:
            existing = db.query(User).filter(User.username == s["username"]).first()
            if existing:
                # Update existing roles if they are generic 'staff'
                if existing.role == "staff":
                    existing.role = s["role"]
                    existing.skills = s["skills"]
            else:
                new_staff = User(
                    username=s["username"],
                    hashed_password="password", # In production, use hashing
                    role=s["role"],
                    skills=s["skills"],
                    location_lat=s["lat"],
                    location_lng=s["lng"],
                    is_available=1, # Integer field
                    location_floor=1
                )
                db.add(new_staff)
        
        db.commit()
    finally:
        db.close()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(incident.router)
app.include_router(user.router)
app.include_router(alert.router)
app.include_router(guest.router)

@app.get("/")
async def root():
    return {"message": "AI-Powered Crisis Coordination API is running"}

@app.get("/map/data")
async def get_map_data(db: Session = Depends(get_db)):
    # Generate 100 rooms across 5 floors (High Clarity Layout)
    CENTER_LAT = 13.111
    CENTER_LNG = 80.135
    ROOM_SIZE = 0.0006 # Doubled size
    CORRIDOR_WIDTH = 0.0004 # Wider corridor
    SPACING = 0.00015 # Extra gap between rooms
    
    rooms = []
    # Fetch all registered guests
    guests = db.query(GuestRegistration).all()
    guest_map = {str(g.room_number): g.guest_name for g in guests}

    for floor in range(1, 6): # Floors 1-5
        # 1. Stairs (Left side)
        rooms.append({
            "id": f"stairs-{floor}",
            "name": f"Stairs Floor {floor}",
            "type": "stairs",
            "floor": floor,
            "latlngs": [[
                [CENTER_LAT + CORRIDOR_WIDTH/2 + ROOM_SIZE * 0.2, CENTER_LNG - ROOM_SIZE * 1.5],
                [CENTER_LAT + CORRIDOR_WIDTH/2 + ROOM_SIZE * 1.2, CENTER_LNG - ROOM_SIZE * 1.5],
                [CENTER_LAT + CORRIDOR_WIDTH/2 + ROOM_SIZE * 1.2, CENTER_LNG - ROOM_SIZE * 0.5],
                [CENTER_LAT + CORRIDOR_WIDTH/2 + ROOM_SIZE * 0.2, CENTER_LNG - ROOM_SIZE * 0.5]
            ]],
            "temp": 20.0,
            "guest_name": None
        })

        # 2. Lift (Near Stairs)
        rooms.append({
            "id": f"lift-{floor}",
            "name": f"Lift Floor {floor}",
            "type": "lift",
            "floor": floor,
            "latlngs": [[
                [CENTER_LAT - CORRIDOR_WIDTH/2 - ROOM_SIZE * 0.2, CENTER_LNG - ROOM_SIZE * 1.5],
                [CENTER_LAT - CORRIDOR_WIDTH/2 - ROOM_SIZE * 1.2, CENTER_LNG - ROOM_SIZE * 1.5],
                [CENTER_LAT - CORRIDOR_WIDTH/2 - ROOM_SIZE * 1.2, CENTER_LNG - ROOM_SIZE * 0.5],
                [CENTER_LAT - CORRIDOR_WIDTH/2 - ROOM_SIZE * 0.2, CENTER_LNG - ROOM_SIZE * 0.5]
            ]],
            "temp": 22.0,
            "guest_name": None
        })

        # 3. Fire Exit (Right side)
        rooms.append({
            "id": f"fire-exit-{floor}",
            "name": f"Fire Exit Floor {floor}",
            "type": "fire_exit",
            "floor": floor,
            "latlngs": [[
                [CENTER_LAT - CORRIDOR_WIDTH/2, CENTER_LNG + 10 * (ROOM_SIZE + SPACING)],
                [CENTER_LAT + CORRIDOR_WIDTH/2, CENTER_LNG + 10 * (ROOM_SIZE + SPACING)],
                [CENTER_LAT + CORRIDOR_WIDTH/2, CENTER_LNG + 10 * (ROOM_SIZE + SPACING) + ROOM_SIZE * 0.5],
                [CENTER_LAT - CORRIDOR_WIDTH/2, CENTER_LNG + 10 * (ROOM_SIZE + SPACING) + ROOM_SIZE * 0.5]
            ]],
            "temp": 18.0,
            "guest_name": None
        })

        for i in range(10): # 10 pairs per floor = 20 rooms
            # Offset along the X-axis (longitude)
            lng_offset = i * (ROOM_SIZE + SPACING)
            
            # Top Room (Odd)
            room_top_id = (floor * 100) + (i * 2) + 1
            s_top_id = str(room_top_id)
            rooms.append({
                "id": s_top_id,
                "name": f"Room {room_top_id}",
                "type": "room",
                "floor": floor,
                "latlngs": [[
                    [CENTER_LAT + CORRIDOR_WIDTH/2, CENTER_LNG + lng_offset],
                    [CENTER_LAT + CORRIDOR_WIDTH/2 + ROOM_SIZE, CENTER_LNG + lng_offset],
                    [CENTER_LAT + CORRIDOR_WIDTH/2 + ROOM_SIZE, CENTER_LNG + lng_offset + ROOM_SIZE],
                    [CENTER_LAT + CORRIDOR_WIDTH/2, CENTER_LNG + lng_offset + ROOM_SIZE]
                ]],
                "temp": iot_simulator.room_temperatures.get(s_top_id, 22.0 + random.uniform(-2, 2)),
                "guest_name": guest_map.get(s_top_id)
            })

            # Bottom Room (Even)
            room_bot_id = (floor * 100) + (i * 2) + 2
            s_bot_id = str(room_bot_id)
            rooms.append({
                "id": s_bot_id,
                "name": f"Room {room_bot_id}",
                "type": "room",
                "floor": floor,
                "latlngs": [[
                    [CENTER_LAT - CORRIDOR_WIDTH/2, CENTER_LNG + lng_offset],
                    [CENTER_LAT - CORRIDOR_WIDTH/2 - ROOM_SIZE, CENTER_LNG + lng_offset],
                    [CENTER_LAT - CORRIDOR_WIDTH/2 - ROOM_SIZE, CENTER_LNG + lng_offset + ROOM_SIZE],
                    [CENTER_LAT - CORRIDOR_WIDTH/2, CENTER_LNG + lng_offset + ROOM_SIZE]
                ]],
                "temp": iot_simulator.room_temperatures.get(s_bot_id, 22.0 + random.uniform(-2, 2)),
                "guest_name": guest_map.get(s_bot_id)
            })

    # Add the Corridor
    corridor_latlngs = [[
        [CENTER_LAT - CORRIDOR_WIDTH/2, CENTER_LNG - ROOM_SIZE * 0.5],
        [CENTER_LAT - CORRIDOR_WIDTH/2, CENTER_LNG + 10 * (ROOM_SIZE + SPACING)],
        [CENTER_LAT + CORRIDOR_WIDTH/2, CENTER_LNG + 10 * (ROOM_SIZE + SPACING)],
        [CENTER_LAT + CORRIDOR_WIDTH/2, CENTER_LNG - ROOM_SIZE * 0.5]
    ]]
    rooms.append({
        "id": "corridor-main",
        "name": "Main Corridor",
        "type": "corridor",
        "floor": "all",
        "latlngs": corridor_latlngs,
        "temp": 21.0,
        "guest_name": None
    })
            
    data = {
        "rooms": rooms,
        "blocked_zones": [],
        "safe_paths": []
    }
    return data

@app.get("/simulation/start")
async def start_sim():
    started_iot = await iot_simulator.start()
    from app.services.dispatch_simulator import dispatch_simulator
    started_dispatch = await dispatch_simulator.start()
    return {"status": "started" if (started_iot or started_dispatch) else "already running"}

@app.get("/simulation/stop")
async def stop_sim():
    await iot_simulator.stop()
    from app.services.dispatch_simulator import dispatch_simulator
    await dispatch_simulator.stop()
    return {"status": "stopped"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.shadow_connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
