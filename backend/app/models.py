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


class QuizQuestion(Base):
    """独立的题目表，存储所有生成过的题目"""
    __tablename__ = "quiz_question"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("session.id"), nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)          # 题目文本
    options: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON 数组，选项列表
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)     # 正确答案
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 解析
    difficulty: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # 难度：easy/medium/hard
    source_question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 生成该题的原始用户提问
    message_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 对应 session chat 中的消息索引
    created_at: Mapped[int] = mapped_column(Integer, nullable=False, default=lambda: int(__import__('time').time()))