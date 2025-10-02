from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Table, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


user_hobbies = Table(
    "user_hobbies",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("hobby_id", Integer, ForeignKey("hobbies.id", ondelete="CASCADE"), primary_key=True)
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now(timezone.utc))

    # Relationship to hobbies (many-to-many)
    hobbies = relationship("Hobby", secondary=user_hobbies, back_populates="users")

    posts = relationship("Post", back_populates="owner", cascade="all, delete-orphan")

    # Relationship to groups (via memberships)
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")

    @property
    def group_memberships(self) -> list[int]:
        """Returns a list of group IDs the user is a member of."""
        return [membership.group_id for membership in self.memberships]


class Hobby(Base):
    __tablename__ = "hobbies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Relationship to users
    users = relationship("User", secondary=user_hobbies, back_populates="hobbies")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    hobby = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now(timezone.utc))

    # Track the creator of the group
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationship to memberships
    memberships = relationship("Membership", back_populates="group", cascade="all, delete-orphan")

    posts = relationship("Post", back_populates="group", cascade="all, delete-orphan")


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint('user_id', 'group_id', name='unique_membership'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(TIMESTAMP, default=datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="memberships")
    group = relationship("Group", back_populates="memberships")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now(timezone.utc))

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)

    owner = relationship("User", back_populates="posts")
    group = relationship("Group", back_populates="posts")
