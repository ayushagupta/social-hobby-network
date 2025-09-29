from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


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

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    hobbies: List[HobbyResponse]
    created_at: datetime

    class Config:
        orm_mode = True


class GroupBase(BaseModel):
    name: str
    description: Optional[str] = ""
    hobby: str

class GroupCreate(GroupBase):
    pass

class GroupResponse(GroupBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class MembershipResponse(BaseModel):
    user_id: int
    group_id: int
    joined_at: datetime

    class Config:
        orm_mode = True
