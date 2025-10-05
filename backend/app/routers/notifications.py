from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict
import logging
import asyncio

from app import database, models
from ..redis_client import redis_client
from .auth import get_current_user_ws

# Manages persistent WebSocket connections for user-specific notifications.
class NotificationManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.listener_tasks: Dict[int, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        # If the user already has a connection open (e.g., in another tab), close the old one.
        if user_id in self.active_connections:
            await self.active_connections[user_id].close(code=1008, reason="New connection established")

        self.active_connections[user_id] = websocket
        if user_id not in self.listener_tasks:
            self.listener_tasks[user_id] = asyncio.create_task(self._redis_listener(user_id))

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)
        task = self.listener_tasks.pop(user_id, None)
        if task:
            task.cancel()

    async def _redis_listener(self, user_id: int):
        pubsub = redis_client.pubsub()
        channel = f"notifications:{user_id}"
        await pubsub.subscribe(channel)
        logging.info(f"Subscribed to notification channel: {channel}")

        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None)
                if message and message["type"] == "message":
                    message_data = message["data"]
                    if user_id in self.active_connections:
                        await self.active_connections[user_id].send_text(message_data)
        except asyncio.CancelledError:
            logging.info(f"Notification listener for {channel} cancelled")
        finally:
            await pubsub.unsubscribe(channel)
            logging.info(f"Unsubscribed from notification channel: {channel}")
        
    
notification_manager = NotificationManager()

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)

@router.websocket("/ws")
async def websocket_notification_endpoint(
    websocket: WebSocket,
    current_user = Depends(get_current_user_ws)
):
    if not current_user:
        return

    user_id = current_user.id
    await notification_manager.connect(websocket, user_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id)