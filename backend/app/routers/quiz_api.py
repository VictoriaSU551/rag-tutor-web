import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..auth import parse_token
from .. import models
from ..schemas import QuizAnswerIn, AddWrongIn

router = APIRouter(prefix="/api", tags=["quiz"])

def get_session_meta(session: models.Session) -> dict:
    """从 session.meta 中解析出元数据，如果不存在则返回默认值"""
    try:
        meta = json.loads(session.meta or "{}")
    except:
        meta = {}
    return meta

def save_session_meta(session: models.Session, meta: dict, db: Session):
    """保存元数据到 session.meta"""
    session.meta = json.dumps(meta, ensure_ascii=False)
    db.add(session)
    db.commit()

@router.get("/quiz/current")
def quiz_current(token: str, session_id: str, db: Session = Depends(get_db)):
    """获取当前会话中的待答题"""
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == uid
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    meta = get_session_meta(session)
    current_quiz = meta.get("current_quiz")
    
    if not current_quiz:
        return {"has_quiz": False}
    
    return {
        "has_quiz": True, 
        "question": current_quiz.get("question"),
        "first_wrong": current_quiz.get("first_wrong", False)
    }

@router.post("/quiz/answer")
def quiz_answer(token: str, session_id: str, data: QuizAnswerIn, db: Session = Depends(get_db)):
    """提交练习题答案"""
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == uid
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    meta = get_session_meta(session)
    current_quiz = meta.get("current_quiz")
    
    if not current_quiz:
        raise HTTPException(status_code=400, detail="当前没有待回答的练习题（请先提问生成练习题）")

    user_ans = data.answer.strip()
    correct = current_quiz.get("answer", "").strip()

    # 简单判等（生产可改为：让模型/规则判题）
    if user_ans == correct:
        # 答对：清空当前题
        meta.pop("current_quiz", None)
        save_session_meta(session, meta, db)
        return {
            "ok": True, 
            "correct": True, 
            "message": "回答正确", 
            "explanation": current_quiz.get("explanation")
        }

    # 答错：标记first_wrong，并允许加入错题本
    if not current_quiz.get("first_wrong", False):
        current_quiz["first_wrong"] = True
        meta["current_quiz"] = current_quiz
        save_session_meta(session, meta, db)
    
    return {
        "ok": True, 
        "correct": False, 
        "message": "回答不正确，请再试一次", 
        "can_add_wrong": current_quiz.get("first_wrong", False)
    }

@router.post("/quiz/add_wrong")
def add_wrong(token: str, session_id: str, data: AddWrongIn, db: Session = Depends(get_db)):
    """将答错的题目加入用户错题本（存储在 user.meta 中）"""
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    # 获取session信息来获取错题详情
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == uid
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    session_meta = get_session_meta(session)
    current_quiz = session_meta.get("current_quiz")
    
    if not current_quiz or not current_quiz.get("first_wrong", False):
        raise HTTPException(status_code=400, detail="只有第一次答错后才能加入错题本")

    # 获取用户信息
    user = db.query(models.User).filter(models.User.id == uid).first()
    user_meta = get_session_meta(user)
    
    # 初始化用户错题本
    if "wrong_questions" not in user_meta:
        user_meta["wrong_questions"] = []
    
    # 添加到用户错题本
    import time
    wrong_item = {
        "question": current_quiz.get("question"),
        "correct_answer": current_quiz.get("answer"),
        "user_first_answer": data.user_first_answer.strip(),
        "session_id": session_id,  # 记录来源session
        "created_at": int(time.time())
    }
    user_meta["wrong_questions"].append(wrong_item)
    
    save_session_meta(user, user_meta, db)
    return {"ok": True}

@router.get("/wrongbook")
def wrongbook(token: str, db: Session = Depends(get_db)):
    """获取用户的错题本"""
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    meta = get_session_meta(user)  # 复用函数，但现在是user的meta
    wrong_questions = meta.get("wrong_questions", [])
    
    return [{
        "question": w.get("question"),
        "correct_answer": w.get("correct_answer"),
        "user_first_answer": w.get("user_first_answer"),
        "created_at": w.get("created_at")
    } for w in reversed(wrong_questions)]

@router.delete("/wrongbook/{index}")
def delete_wrongbook_item(index: int, token: str, db: Session = Depends(get_db)):
    """删除用户错题本中的指定题目"""
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    meta = get_session_meta(user)
    wrong_questions = meta.get("wrong_questions", [])
    
    if index < 0 or index >= len(wrong_questions):
        raise HTTPException(status_code=404, detail="错题不存在")
    
    # 删除指定索引的错题（注意：前端传的是倒序索引，需要转换）
    actual_index = len(wrong_questions) - 1 - index
    wrong_questions.pop(actual_index)
    
    save_session_meta(user, meta, db)  # 复用函数，但现在是user的meta
    return {"ok": True}
