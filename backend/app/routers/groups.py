from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, database, security
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)

@router.post("/", response_model=schemas.GroupResponse)
def create_group(group: schemas.GroupCreate, 
                 db: Session = Depends(database.get_db), 
                 current_user: models.User = Depends(get_current_user)):
    existing_group = db.query(models.Group).filter(models.Group.name == group.name).first()
    if existing_group:
        raise HTTPException(status_code=400, detail="Group with this name already exists")
    
    user_hobby_names = [h.name for h in current_user.hobbies]
    if group.hobby not in user_hobby_names:
        raise HTTPException(
            status_code=403, 
            detail=f"You cannot create a group for a hobby you don't have"
        )
    
    new_group = models.Group(
        name=group.name,
        description=group.description,
        hobby=group.hobby,
        creator_id=current_user.id
    )
    db.add(new_group)
    db.flush()

    membership = models.Membership(
        user_id=current_user.id,
        group_id=new_group.id
    )
    db.add(membership)

    db.commit()
    db.refresh(new_group)
    return new_group


@router.get("/", response_model=List[schemas.GroupResponse])
def list_groups(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user), hobby: str = None):
    query = db.query(models.Group)
    if hobby:
        query = query.filter(models.Group.hobby == hobby)
    return query.all()
