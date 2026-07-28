import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("app.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting event to {len(self.active_connections)} client(s)...")
        disconnected_clients = []
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send JSON message to connection: {e}")
                disconnected_clients.append(connection)
                
        for client in disconnected_clients:
            self.disconnect(client)

manager = ConnectionManager()
