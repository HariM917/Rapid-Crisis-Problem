from app.sockets.websocket import manager

async def broadcast_alert(message: str):
    await manager.broadcast({
        "event": "system_alert",
        "data": {"message": message}
    })
