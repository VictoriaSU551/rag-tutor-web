from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
import uuid
from .db import Base, SessionLocal, engine, get_db


class User(Base):
    __tablename__ = "user"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[int] = mapped_column(Integer, nullable=False, default=lambda: int(__import__('time').time()))
    updated_at: Mapped[int] = mapped_column(Integer, nullable=False, default=lambda: int(__import__('time').time()), onupdate=lambda: int(__import__('time').time()))
    last_active_at: Mapped[int] = mapped_column(Integer, nullable=False, default=lambda: int(__import__('time').time()))
    time_zone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    meta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Session(Base):
    __tablename__ = "session"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[int] = mapped_column(Integer, nullable=False, default=lambda: int(__import__('time').time()))
    updated_at: Mapped[int] = mapped_column(Integer, nullable=False, default=lambda: int(__import__('time').time()), onupdate=lambda: int(__import__('time').time()))
    chat: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    exercises: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 存储 JSON 数组：[{question,options,correct_answer,explanation,difficulty}]
    meta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)