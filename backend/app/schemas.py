from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class HobbyBase(BaseModel):
    name: str

class HobbyResponse(HobbyBase):
    id: int

    class Config:
        orm_mode = True  # allows reading SQLAlchemy objects directly


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    hobbies: List[str] = []

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    hobbies: Optional[List[str]] = None

    class Config:
        orm_mode = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    hobbies: List[HobbyResponse]
    created_at: datetime
    group_memberships: List[int]

    class Config:
        orm_mode = True

class UserPublic(BaseModel):
    id: int
    name: str
    hobbies: List[HobbyResponse]

    class config:
        orm_mode = True


class GroupBase(BaseModel):
    name: str
    description: Optional[str] = ""
    hobby: str

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    creator_id: Optional[int] = None

class GroupResponse(GroupBase):
    id: int
    creator_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class MembershipResponse(BaseModel):
    user_id: int
    group_id: int
    joined_at: datetime

    class Config:
        orm_mode = True
