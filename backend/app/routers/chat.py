from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, aliased, joinedload
from typing import List, Dict
import logging
import json
import asyncio

from app import database, models, schemas
from .auth import get_current_user, get_current_user_ws
from ..redis_client import redis_client

class ChatManager:
    """Manages real-time WebSocket connections and Redis Pub/Sub for group chats."""
    def __init__(self):
        # Maps group_id to a list of active WebSocket connections on this server instance.
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Maps group_id to its background Redis listener task.
        self.listener_tasks: Dict[int, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, group_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)
        # Start a Redis listener for this group if it's the first connection on this server.
        if group_id not in self.listener_tasks:
            self.listener_tasks[group_id] = asyncio.create_task(self._redis_listener(group_id))

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active_connections and websocket in self.active_connections[group_id]:
            self.active_connections[group_id].remove(websocket)
            # If it's the last connection for this group, cancel the background task to save resources.
            if not self.active_connections[group_id]:
                task = self.listener_tasks.pop(group_id, None)
                if task:
                    task.cancel()

    async def _redis_listener(self, group_id: int):
        """A background task that listens for messages on a Redis channel and relays them."""
        channel = f"chat:{group_id}"
        try:
            async with redis_client.pubsub() as pubsub:
                await pubsub.subscribe(channel)
                logging.info(f"Subscribed to Redis channel: {channel}")
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=None)
                    if message:
                        for connection in self.active_connections.get(group_id, []):
                            await connection.send_text(message["data"])
        except asyncio.CancelledError:
            logging.info(f"Listener for {channel} cancelled.")
        # `async with` automatically handles unsubscription.

    async def publish_to_channel(self, message: str, group_id: int):
        """Publishes a message to the appropriate Redis channel."""
        await redis_client.publish(f"chat:{group_id}", message)

chat_manager = ChatManager()

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

# --- WebSocket Endpoint for Group Chat ---
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
                user=current_user 
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)

            response_message_json = schemas.ChatMessageResponse.from_orm(new_message).json()
            await chat_manager.publish_to_channel(response_message_json, group_id)
            
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, group_id)
    except Exception as e:
        logging.error(f"An error occurred in websocket for group {group_id}: {e}")
        chat_manager.disconnect(websocket, group_id)

# --- Background Task Helper for Notifications ---
async def publish_new_conversation_notification(target_user_id: int, current_user_id: int, group_payload: dict):
    """Publishes a NEW_CONVERSATION notification to both users involved in a new DM."""
    notification_payload = {
        "type": "NEW_CONVERSATION",
        "payload": group_payload
    }
    notification_json = json.dumps(notification_payload)
    await redis_client.publish(f"notifications:{target_user_id}", notification_json)
    await redis_client.publish(f"notifications:{current_user_id}", notification_json)

# --- REST Endpoints for Chat Management ---
@router.post("/dm/{target_user_id}", response_model=schemas.GroupResponse)
def get_or_create_dm_channel(
    target_user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    """Finds or creates a DM and notifies BOTH users involved."""
    if target_user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create a DM with yourself.")
        
    Membership1 = aliased(models.Membership)
    Membership2 = aliased(models.Membership)
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
    if existing_dm:
        return existing_dm

    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

    new_dm_group = models.Group(
        name=f"DM between {current_user.name} and {target_user.name}",
        description=f"Direct message channel",
        hobby="Direct Message",
        is_direct_message=True,
        creator_id=current_user.id
    )
    db.add(new_dm_group)
    db.flush()
    membership1 = models.Membership(user_id=current_user.id, group_id=new_dm_group.id)
    membership2 = models.Membership(user_id=target_user.id, group_id=new_dm_group.id)
    db.add_all([membership1, membership2])
    db.commit()

    final_dm_group = db.query(models.Group).options(
        joinedload(models.Group.memberships).joinedload(models.Membership.user)
    ).filter(models.Group.id == new_dm_group.id).first()

    group_payload = json.loads(schemas.GroupResponse.from_orm(final_dm_group).json())
    background_tasks.add_task(
        publish_new_conversation_notification,
        target_user_id=target_user_id,
        current_user_id=current_user.id,
        group_payload=group_payload
    )
    
    return final_dm_group

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

