from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, security, database
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/groups/{group_id}/posts",
    tags=["posts"]
)

@router.post("/", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED)
def create_post_in_group(
    group_id: int,
    post: schemas.PostCreate,
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