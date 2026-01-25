from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..auth import parse_token
from .. import models

router = APIRouter(prefix="/api", tags=["user"])

@router.get("/me")
def me(token: str, db: Session = Depends(get_db)):
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return {"id": user.id, "username": user.name, "avatar": user.avatar_url}
