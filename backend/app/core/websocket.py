from fastapi import WebSocket
from typing import List
import json
import logging

logger = logging.getLogger("uvicorn")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"🚀 WebSocket: Cliente conectado. Conexiones activas: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"🚀 WebSocket: Cliente desconectado. Conexiones activas: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        logger.info(f"🚀 WebSocket: Emitiendo mensaje a {len(self.active_connections)} clientes. Evento: {message.get('type')}")
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"🚀 WebSocket: Error al enviar mensaje: {e}")
                # Intentamos desconectar la conexión rota de forma segura
                self.disconnect(connection)

manager = ConnectionManager()
