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
        from_attributes = True  # allows reading SQLAlchemy objects directly


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
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    hobbies: List[HobbyResponse]
    created_at: datetime
    group_memberships: List[int]

    class Config:
        from_attributes = True

class UserPublic(BaseModel):
    id: int
    name: str
    hobbies: List[HobbyResponse]

    class config:
        from_attributes = True


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
    is_direct_message: bool
    members: List[UserPublic]

    class Config:
        from_attributes = True


class MembershipResponse(BaseModel):
    user_id: int
    group_id: int
    joined_at: datetime

    class Config:
        from_attributes = True


class PostBase(BaseModel):
    title: str
    content: str

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    created_at: datetime
    owner_id: int
    group_id: int

    owner: UserPublic

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    timestamp: datetime
    user_id: int
    group_id: int
    user: UserPublic

    class Config:
        from_attributes = True