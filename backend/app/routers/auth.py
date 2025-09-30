from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app import models, schemas, database, security

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/login", response_model=schemas.TokenResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not security.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = security.create_access_token(data={"sub": user.email})
    token_response = schemas.TokenResponse(access_token=access_token, token_type="bearer")
    return token_response

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    print("----------- DEBUGGING SIGNUP -----------")
    print(f"Value of user.password: {user.password}")
    print(f"Type of user.password: {type(user.password)}")
    print(f"Byte length: {len(user.password.encode('utf-8'))}")
    print("--------------------------------------")
    
    hobby_objects = []
    for hobby_name in user.hobbies:
        hobby = db.query(models.Hobby).filter(models.Hobby.name == hobby_name).first()
        if not hobby:
            hobby = models.Hobby(name=hobby_name)
            db.add(hobby)
            db.flush()
        hobby_objects.append(hobby)

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=security.hash_password(user.password),
        hobbies=hobby_objects
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user