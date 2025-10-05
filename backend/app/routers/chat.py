from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session, aliased, joinedload
from typing import List, Dict
import logging
import json
import asyncio

from app import database, models, schemas
from .auth import get_current_user, get_current_user_ws
from ..redis_client import redis_client

# This class manages all active WebSocket connections for the application.
class ChatManager:
    def __init__(self):
        # Maps group_id to a list of active WebSocket connections.
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Dictionary to keep tracks of background tasks
        self.listener_tasks: Dict[int, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

        if group_id not in self.listener_tasks:
            self.listener_tasks[group_id] = asyncio.create_task(self._redis_listener(group_id))

    def disconnect(self, websocket: WebSocket, group_id: int):
        # Safely remove the websocket from the list to prevent errors.
        if group_id in self.active_connections and websocket in self.active_connections[group_id]:
            self.active_connections[group_id].remove(websocket)
            # Stop the listener task if it was the last connection in its group
            if not self.active_connections[group_id]:
                task = self.listener_tasks.pop(group_id, None)
                if task:
                    task.cancel()

    async def _redis_listener(self, group_id: int):
        pubsub = redis_client.pubsub()
        channel = f"chat:{group_id}"
        await pubsub.subscribe(channel)
        logging.info(f"Subscribed to redis channel: {channel}")

        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None)
                if message and message["type"]=="message":
                    message_data = message["data"]
                    if group_id in self.active_connections:
                        for connection in self.active_connections[group_id]:
                            await connection.send_text(message_data)
        except asyncio.CancelledError:
            logging.info(f"Listener for {channel} cancelled")
        finally:
            await pubsub.unsubscribe(channel)
            logging.info(f"Unsubscribed from Redis channel: {channel}")

    async def publish_to_channel(self, message: str, group_id: int):
        channel = f"chat:{group_id}"
        await redis_client.publish(channel=channel, message=message)


chat_manager = ChatManager()

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
    """Handles the real-time WebSocket connection for a specific chat group."""
    if not current_user:
        return

    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
    ).first()
    if not membership:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not a member of this group")
        return

    await chat_manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()

            new_message = models.ChatMessage(
                content=data,
                group_id=group_id,
                user_id=current_user.id,
                user=current_user # Pre-populate the relationship to prevent lazy-loading issues.
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message) # Refresh to get the generated ID and timestamp.

            response_message_json = schemas.ChatMessageResponse.from_orm(new_message).json()

            await chat_manager.publish_to_channel(response_message_json, group_id)
            
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, group_id)
    except Exception as e:
        logging.error(f"An error occurred in websocket for group {group_id}: {e}")
        chat_manager.disconnect(websocket, group_id)


@router.get("/conversations", response_model=List[schemas.GroupResponse])
def get_my_conversations(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    """Returns a list of all groups and DMs the current user is a member of."""
    conversations = db.query(models.Group).join(
        models.Membership, models.Group.id == models.Membership.group_id
    ).options(
        joinedload(models.Group.memberships).joinedload(models.Membership.user)
    ).filter(
        models.Membership.user_id == current_user.id
    ).all()
    
    return conversations


@router.get("/{group_id}", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    group_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    """Gets the recent chat history for a specific group."""
    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")
    
    history = db.query(models.ChatMessage).filter(models.ChatMessage.group_id==group_id).order_by(models.ChatMessage.timestamp.desc()).limit(50).all()
    return history[::-1]


@router.post("/dm/{target_user_id}", response_model=schemas.GroupResponse)
def get_or_create_dm_channel(
    target_user_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    """Finds an existing DM channel between two users or creates a new one."""
    if target_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create a DM with yourself.")

    # Alias the Membership table to perform a self-join
    Membership1 = aliased(models.Membership)
    Membership2 = aliased(models.Membership)

    # Query to find a DM group that contains both the current user and the target user
    existing_dm = db.query(models.Group).join(
        Membership1, models.Group.id == Membership1.group_id
    ).join(
        Membership2, models.Group.id == Membership2.group_id
    ).options(
        joinedload(models.Group.memberships).joinedload(models.Membership.user)
    ).filter(
        models.Group.is_direct_message == True,
        Membership1.user_id == current_user.id,
        Membership2.user_id == target_user_id
    ).first()

    # If a DM channel already exists, return it
    if existing_dm:
        return existing_dm

    # If no DM exists, create a new one
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

    # Create a new group marked as a DM
    new_dm_group = models.Group(
        name=f"DM between {current_user.name} and {target_user.name}",
        description=f"Direct message channel",
        hobby="Direct Message", # A placeholder hobby
        is_direct_message=True,
        creator_id=current_user.id # Track who initiated it
    )
    db.add(new_dm_group)
    db.flush() # Flush to get the new_dm_group.id

    # Add both users as members of this new DM group
    membership1 = models.Membership(user_id=current_user.id, group_id=new_dm_group.id)
    membership2 = models.Membership(user_id=target_user.id, group_id=new_dm_group.id)
    db.add_all([membership1, membership2])
    
    db.commit()

    # Re-fetch the newly created group with its members eagerly loaded to ensure a complete response.
    final_dm_group = db.query(models.Group).options(
        joinedload(models.Group.memberships).joinedload(models.Membership.user)
    ).filter(models.Group.id == new_dm_group.id).first()

    return final_dm_group

