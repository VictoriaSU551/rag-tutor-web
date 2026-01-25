import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models
from ..schemas import RegisterIn, LoginIn
from ..auth import validate_username, validate_password, hash_password, verify_password, create_token

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    try:
        validate_username(data.username)
        validate_password(data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    exists = db.query(models.User).filter(models.User.name == data.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="用户名已存在")

    user = models.User(name=data.username, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "username": user.name, "avatar": user.avatar_url}}

@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.name == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "username": user.name, "avatar": user.avatar_url}}

@router.post("/avatar")
def upload_avatar(token: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 前端用 ?token=xxx 简化（也可以改Authorization Bearer）
    from ..auth import parse_token
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")

    if file.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(status_code=400, detail="仅支持 png/jpg/webp")

    os.makedirs("app/static/img/avatars", exist_ok=True)
    ext = ".png" if file.content_type == "image/png" else (".webp" if file.content_type == "image/webp" else ".jpg")
    save_path = f"app/static/img/avatars/u{uid}{ext}"

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    user.avatar_url = "/" + save_path.replace("app/", "")
    db.add(user)
    db.commit()

    return {"avatar": user.avatar_url}
