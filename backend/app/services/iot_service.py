import asyncio
import random
from app.sockets.websocket import manager
from app.services import incident_service
from app.schemas.incident_schema import IncidentCreate
from app.db.database import SessionLocal

class IoTSimulator:
    def __init__(self):
        self.running = False
        self.task = None
        self.sensors = {
            "smoke": 15.0,      # percentage
            "temp": 24.5,       # celsius
            "motion": 0,        # 0 or 1
            "panic": 0          # 0 or 1
        }
        self.thresholds = {
            "smoke": 70.0,
            "temp": 45.0
        }
        self.room_temperatures = {} # room_id -> temp

    async def start(self):
        if not self.running:
            self.running = True
            self.task = asyncio.create_task(self.simulation_loop())
            return True
        return False

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
        return True

    async def simulation_loop(self):
        db = SessionLocal()
        try:
            while self.running:
                # Simulate small fluctuations
                self.sensors["smoke"] = max(0, min(100, self.sensors["smoke"] + random.uniform(-1, 2)))
                self.sensors["temp"] = max(10, min(60, self.sensors["temp"] + random.uniform(-0.5, 1)))
                self.sensors["motion"] = random.choice([0, 1])
                
                # Fluctuate room temperatures
                if not self.room_temperatures:
                    # Initialize with some random rooms from the dataset
                    self.room_temperatures = {
                        "id78912881-492b-46b6-b535-c456940916a8": 24.0,
                        "room-101": 22.5,
                        "room-102": 23.0,
                        "kitchen-main": 28.5,
                        "server-room": 21.0
                    }
                
                from app.models.incident_model import Incident
                active_fires = db.query(Incident).filter(Incident.type == "fire", Incident.status == "active").all()
                fire_rooms = [str(f.room_name) for f in active_fires if f.room_name]

                for rid in self.room_temperatures:
                    # Natural fluctuation
                    change = random.uniform(-0.5, 0.8)
                    
                    # Fire Spread Logic
                    if fire_rooms:
                        for fr in fire_rooms:
                            # If room is the fire room or adjacent (simple numeric proximity for demo)
                            try:
                                rid_int = int(''.join(filter(str.isdigit, rid)))
                                fr_int = int(''.join(filter(str.isdigit, fr)))
                                if rid_int == fr_int:
                                    change += random.uniform(5, 10) # Heavy heat in fire room
                                elif abs(rid_int - fr_int) <= 2:
                                    change += random.uniform(2, 5) # Heat spreading to neighbors
                            except:
                                pass
                    
                    self.room_temperatures[rid] = max(18, min(150, self.room_temperatures[rid] + change))
                
                # Broadcast sensor data
                await manager.broadcast({
                    "event": "iot_update",
                    "data": {
                        **self.sensors,
                        "room_temps": self.room_temperatures
                    }
                })

                # Automatic thresholds disabled per user request
                # if self.sensors["smoke"] > self.thresholds["smoke"]:
                #     await self.trigger_auto_incident(db, "fire", f"CRITICAL: High smoke levels detected ({self.sensors['smoke']:.1f}%)")
                #     self.sensors["smoke"] = 15.0 # Reset after trigger for demo flow
                
                # if self.sensors["temp"] > self.thresholds["temp"]:
                #     await self.trigger_auto_incident(db, "fire", f"WARNING: Extreme temperature detected ({self.sensors['temp']:.1f}°C)")
                #     self.sensors["temp"] = 24.5 # Reset after trigger
                
                await asyncio.sleep(2) # Update every 2 seconds
        except asyncio.CancelledError:
            pass
        finally:
            db.close()

    async def trigger_auto_incident(self, db, type, description):
        # Prevent spamming multiple incidents for the same spike
        # In a real app, we'd check if an active incident already exists in that zone
        incident_data = IncidentCreate(
            type=type,
            description=description,
            lat=13.111, # India Center
            lng=80.135
        )
        db_incident = incident_service.create_incident(db, incident_data)
        
        await manager.broadcast({
            "event": "incident_created",
            "data": {
                "id": db_incident.id,
                "type": db_incident.type,
                "description": db_incident.description,
                "lat": db_incident.lat,
                "lng": db_incident.lng,
                "status": db_incident.status
            }
        })

iot_simulator = IoTSimulator()
