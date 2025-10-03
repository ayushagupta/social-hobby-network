from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict

from app import database, models, schemas
from app.routers.auth import get_current_user, get_current_user_ws

class ConnectionManager:
    def __init__(self):
        # Dictionary to store active connections for each group chat
        # Key is group_id, value is a list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active_connections:
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


# Websocket endpoint for messaging in a group
@router.websocket("/ws/{group_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    group_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user_ws)
):
    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
    ).first()

    # close the connection if not a member
    if not membership:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connect to the chat room
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()

            new_message = models.ChatMessage(
                content=data,
                group_id=group_id,
                user_id=current_user.id
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)

            response_message = schemas.ChatMessageResponse.from_orm(new_message).json()

            await manager.broadcast(response_message, group_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)


# REST endpoint to get chat history
@router.get("/{group_id}", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    group_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")
    
    history = db.query(models.ChatMessage).filter(models.ChatMessage.group_id==group_id).order_by(models.ChatMessage.timestamp.desc()).limit(50).all()
    return history[::-1]