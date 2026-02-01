from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..db import get_db
from ..auth import parse_token, get_token_from_request
from .. import models

router = APIRouter(prefix="/api", tags=["user"])

@router.get("/me")
def me(token: str = None, request: Request = None, db: Session = Depends(get_db)):
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return {"id": user.id, "username": user.name, "avatar": user.avatar_url}
