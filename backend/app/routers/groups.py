from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
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


@router.get("/{group_id}", response_model=schemas.GroupResponse)
def get_group(group_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/", response_model=List[schemas.GroupResponse])
def list_groups(
    db: Session = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    options = joinedload(models.Group.memberships).joinedload(models.Membership.user)

    public_groups = db.query(models.Group).options(options).filter(
        models.Group.is_direct_message == False
    ).all()
    
    return public_groups


@router.put("/{group_id}", response_model=schemas.GroupResponse)
def update_group(group_id: int,
                 request: schemas.GroupUpdate,
                 db: Session = Depends(database.get_db),
                 current_user: models.User = Depends(get_current_user)):

    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only group creator is allowed to make changes")
    
    if request.name:
        group.name = request.name
    if request.description:
        group.description = request.description
    
    if request.creator_id is not None:
        membership = (
            db.query(models.Membership)
            .filter(
                models.Membership.user_id == request.creator_id,
                models.Membership.group_id == group.id
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=400, detail="New creator must already be a member of the group")

        group.creator_id = request.creator_id

    db.commit()
    db.refresh(group)
    return group
