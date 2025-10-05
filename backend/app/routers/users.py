from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging

from app import models, schemas, database, security
from app.routers.auth import get_current_user
from app.es_client import es_client

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


async def index_user(user_id: int):
    # Create a new, independent database session for this background task.
    db = next(database.get_db())
    try:
        # Fetch a fresh copy of the user with their relationships.
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            logging.error(f"User with ID {user_id} not found for indexing.")
            return
        
        doc = {
            "name": user.name,
            "email": user.email,
            "hobbies": [hobby.name for hobby in user.hobbies]
        }
        await es_client.index(
            index="users",
            id=user.id,
            document=doc
        )
        logging.info(f"Successfully indexed user {user.id}")
    except Exception as e:
        logging.error(f"Failed to index user {user_id}: {e}")
    finally:
        # Always close the session.
        db.close()


@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/search", response_model=List[schemas.UserPublic])
def search_users(
    query: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not query:
        return []

    found_users = db.query(models.User).filter(
        models.User.name.ilike(f"%{query}%"),
        models.User.id != current_user.id
    ).limit(10).all()

    return found_users


@router.get("/{user_id}", response_model=schemas.UserPublic)
def get_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.put("/me", response_model=schemas.UserResponse)
def update_user(
    user_update: schemas.UserUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.name:
        user.name = user_update.name
    if user_update.email:
        user.email = user_update.email
    if user_update.password:
        user.hashed_password = security.hash_password(user_update.password)

    if user_update.hobbies is not None:
        current_hobby_names = {h.name for h in user.hobbies}
        new_hobby_names = set(user_update.hobbies)
        removed_hobbies = current_hobby_names - new_hobby_names

        # Identify hobbies that can't be removed because the user is a creator
        protected_hobbies = set(
            db.query(models.Group.hobby)
            .filter(
                models.Group.creator_id == user.id,
                models.Group.is_direct_message == False
            )
            .all()
        )
        # The query returns list of tuples, so convert
        protected_hobbies = {h[0] for h in protected_hobbies}

        # Filter out protected hobbies
        hobbies_to_remove = removed_hobbies - protected_hobbies

        if hobbies_to_remove:
            memberships_to_remove = (
                db.query(models.Membership)
                .join(models.Group)
                .filter(
                    models.Membership.user_id == user.id,
                    models.Group.hobby.in_(hobbies_to_remove)
                )
                .all()
            )
            for membership in memberships_to_remove:
                db.delete(membership)

        # Determine final hobby list (keep protected + new ones)
        final_hobbies = new_hobby_names | protected_hobbies

        # Clear and re-add hobbies
        user.hobbies.clear()
        for hobby_name in final_hobbies:
            hobby = db.query(models.Hobby).filter(models.Hobby.name == hobby_name).first()
            if not hobby:
                hobby = models.Hobby(name=hobby_name)
                db.add(hobby)
                db.flush()
            user.hobbies.append(hobby)

    db.commit()
    db.refresh(user)

    background_tasks.add_task(index_user, user.id)

    return user
