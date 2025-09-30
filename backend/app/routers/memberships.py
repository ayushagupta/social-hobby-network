from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app import models, schemas, database
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/memberships",
    tags=["memberships"]
)


@router.post("/join", response_model=schemas.MembershipResponse)
def join_group(group_id: int, 
               db: Session = Depends(database.get_db), 
               current_user: models.User = Depends(get_current_user)):
    
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    existing = db.query(models.Membership).filter_by(user_id=current_user.id, group_id=group_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this group")

    user_hobby_names = [h.name for h in current_user.hobbies]
    if group.hobby not in user_hobby_names:
        raise HTTPException(
            status_code=403,
            detail=f"You cannot join this group as it requires hobby '{group.hobby}'"
        )

    membership = models.Membership(user_id=current_user.id, group_id=group_id)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.post("/leave")
def leave_group(group_id: int, 
                db: Session = Depends(database.get_db), 
                current_user: models.User = Depends(get_current_user)):
    
    membership = db.query(models.Membership).filter_by(user_id=current_user.id, group_id=group_id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="Not a member of this group")
    
    db.delete(membership)
    db.commit()
    return {"detail": "Left the group successfully"}


@router.get("/group/{group_id}/members", response_model=list[schemas.UserResponse])
def get_group_members(group_id: int, db: Session = Depends(database.get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    members = [membership.user for membership in group.memberships]
    return members


@router.get("/my-groups", response_model=list[schemas.GroupResponse])
def get_my_groups(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    memberships = db.query(models.Membership).filter_by(user_id=current_user.id).all()
    groups = [membership.group for membership in memberships]
    return groups
