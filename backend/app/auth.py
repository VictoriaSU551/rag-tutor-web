import re
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Request

from .config import settings

pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

USERNAME_FORBIDDEN = re.compile(r"[\x00-\x1f]")  # 禁止控制字符（允许中英数与特殊符号）
PWD_6DIGITS = re.compile(r"^\d{6}$")

def validate_username(username: str):
    if USERNAME_FORBIDDEN.search(username):
        raise ValueError("用户名包含非法控制字符")
    if len(username.strip()) == 0:
        raise ValueError("用户名不能为空")

def validate_password(password: str):
    if not PWD_6DIGITS.match(password):
        raise ValueError("密码必须是6位数字")

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_ctx.verify(password, hashed)

def create_token(user_id: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": exp}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def parse_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except (JWTError, KeyError, ValueError):
        raise ValueError("无效或过期的登录状态")

def get_token_from_request(token: str = None, authorization: str = None) -> str:
    """从查询参数或 Authorization header 中提取 token"""
    if token:
        return token
    
    if authorization:
        # 支持 "Bearer <token>" 格式
        if authorization.startswith("Bearer "):
            return authorization[7:]
        return authorization
    
    raise ValueError("未提供有效的认证信息")
