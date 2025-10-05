from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from app import models, schemas, security, database
from app.routers.auth import get_current_user
from ..redis_client import redis_client
from app.es_client import es_client

router = APIRouter(
    prefix="/groups/{group_id}/posts",
    tags=["posts"]
)


async def index_post(post: models.Post):
    try:
        doc = {
            "title": post.title,
            "content": post.content,
            "group_id": post.group_id
        }
        await es_client.index(
            index="posts",
            id=post.id,
            document=doc
        )
        logging.info(f"Successfully indexed post {post.id}")
    except Exception as e:
        logging.error(f"Failed to index post {post.id}: {e}")


@router.post("/", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post_in_group(
    group_id: int,
    post: schemas.PostCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    membership = db.query(models.Membership).filter(
        models.Membership.group_id == group_id,
        models.Membership.user_id == current_user.id
        ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of this group to create a post")
    
    new_post = models.Post(
        title = post.title,
        content = post.content,
        group_id = group_id,
        owner_id = current_user.id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    background_tasks.add_task(index_post, new_post)

    notification_payload = {
        "type": "NEW_POST",
        "payload": {
            "group_id": group_id,
            "post_title": new_post.title,
            "author_name": current_user.name
        }
    }
    notification_json = json.dumps(notification_payload)

    # Get all members of the group to notify them
    group_members = db.query(models.Membership).filter(models.Membership.group_id == group_id).all()
    for member in group_members:
        # Don't send a notification to the person who created the post
        if member.user_id != current_user.id:
            await redis_client.publish(f"notifications:{member.user_id}", notification_json)

    return new_post


@router.get("/", response_model=List[schemas.PostResponse])
def get_posts_for_group(
    group_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    posts = db.query(models.Post).filter(models.Post.group_id == group_id).all()

    return posts