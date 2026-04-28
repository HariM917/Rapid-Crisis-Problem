from fastapi import APIRouter
from app.sockets.websocket import manager

router = APIRouter(prefix="/alert", tags=["alerts"])

@router.post("/send")
async def send_alert(message: str):
    await manager.broadcast({"event": "alert", "data": {"message": message}})
    return {"status": "Alert broadcasted"}
