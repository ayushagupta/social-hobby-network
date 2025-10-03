from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
import logging
import json # Import the json library

from .. import database, models, schemas
from .auth import get_current_user, get_current_user_ws

# This class will manage all active WebSocket connections
class ConnectionManager:
    def __init__(self):
        # This dictionary will store active connections for each group chat
        # The key is the group_id, the value is a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active_connections and websocket in self.active_connections[group_id]:
            self.active_connections[group_id].remove(websocket)

    async def broadcast(self, message: str, group_id: int):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                await connection.send_text(message)

manager = ConnectionManager()

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

@router.websocket("/ws/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user_ws)
):
    if not current_user:
        return

    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
    ).first()
    if not membership:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()

            # Create the new message object
            new_message = models.ChatMessage(
                content=data,
                group_id=group_id,
                user_id=current_user.id,
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message) # Refresh to get ID and timestamp

            # Manually construct the response dictionary to avoid silent Pydantic errors.
            response_data = {
                "id": new_message.id,
                "content": new_message.content,
                "timestamp": new_message.timestamp.isoformat(),
                "user_id": new_message.user_id,
                "group_id": new_message.group_id,
                "user": {
                    "id": current_user.id,
                    "name": current_user.name
                }
            }
            # Convert the dictionary to a JSON string for broadcasting
            response_message_json = json.dumps(response_data)

            await manager.broadcast(response_message_json, group_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
        
    except Exception as e:
        logging.error(f"An error occurred in websocket for group {group_id}: {e}")
        manager.disconnect(websocket, group_id)


@router.get("/{group_id}", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    group_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")
    
    history = db.query(models.ChatMessage).filter(models.ChatMessage.group_id==group_id).order_by(models.ChatMessage.timestamp.desc()).limit(50).all()
    return history[::-1]

