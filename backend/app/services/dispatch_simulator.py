import asyncio
import random
from app.sockets.websocket import manager
from app.db.database import SessionLocal
from app.models.user_model import User
from app.models.incident_model import Incident

class DispatchSimulator:
    def __init__(self):
        self.running = False
        self.task = None

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
        while self.running:
            db = SessionLocal()
            try:
                # Find all assigned staff members for active incidents
                active_incidents = db.query(Incident).filter(Incident.status == "active", Incident.assigned_staff_id != None).all()
                
                for inc in active_incidents:
                    staff = db.query(User).filter(User.id == inc.assigned_staff_id).first()
                    if staff:
                        # Move staff towards incident
                        d_lat = inc.lat - staff.location_lat
                        d_lng = inc.lng - staff.location_lng
                        
                        dist = (d_lat**2 + d_lng**2)**0.5
                        if dist > 0.00005: # Not yet arrived
                            step = 0.0001 # Speed of movement
                            staff.location_lat += (d_lat / dist) * step
                            staff.location_lng += (d_lng / dist) * step
                            
                            db.commit()
                            
                            # Broadcast update
                            await manager.broadcast({
                                "event": "staff_movement",
                                "data": {
                                    "id": staff.id,
                                    "username": staff.username,
                                    "lat": staff.location_lat,
                                    "lng": staff.location_lng,
                                    "incident_id": inc.id
                                }
                            })
                        elif dist > 0:
                            # Arrived
                            timeline_data = []
                            try:
                                import json
                                timeline_data = json.loads(inc.timeline or "[]")
                            except:
                                pass
                            
                            if not any(e.get("event") == "Staff Arrived" for e in timeline_data):
                                from datetime import datetime
                                now_str = datetime.now().strftime("%H:%M")
                                timeline_data.append({"time": now_str, "event": "Staff Arrived", "status": "success"})
                                inc.timeline = json.dumps(timeline_data)
                                db.commit()
                                
                                await manager.broadcast({
                                    "event": "incident_updated",
                                    "data": {
                                        "id": inc.id,
                                        "timeline": inc.timeline
                                    }
                                })

                await asyncio.sleep(1) # Update every second
            except Exception as e:
                print(f"Dispatch simulation error: {e}")
            finally:
                db.close()

dispatch_simulator = DispatchSimulator()
