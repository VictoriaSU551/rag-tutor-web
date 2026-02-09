import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..db import get_db
from ..auth import parse_token, get_token_from_request
from .. import models
from ..schemas import QuizAnswerIn, AddWrongIn, AddManualWrongIn, QuizQuestionOut

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
def quiz_current(token: str = None, session_id: str = None, request: Request = None, db: Session = Depends(get_db)):
    """获取当前会话中的待答题"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
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
def quiz_answer(data: QuizAnswerIn, token: str = None, session_id: str = None, request: Request = None, db: Session = Depends(get_db)):
    """提交练习题答案"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
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
def add_wrong(data: AddWrongIn, token: str = None, session_id: str = None, request: Request = None, db: Session = Depends(get_db)):
    """将答错的题目加入错题本（存储在 session.meta 中）"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
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
    
    if not current_quiz or not current_quiz.get("first_wrong", False):
        raise HTTPException(status_code=400, detail="只有第一次答错后才能加入错题本")

    # 初始化错题本（在 meta 中）
    if "wrong_questions" not in meta:
        meta["wrong_questions"] = []
    
    # 添加到错题本
    import time
    wrong_item = {
        "question": current_quiz.get("question"),
        "correct_answer": current_quiz.get("answer"),
        "user_first_answer": data.user_first_answer.strip(),
        "created_at": int(time.time())
    }
    meta["wrong_questions"].append(wrong_item)
    
    save_session_meta(session, meta, db)
    return {"ok": True}

@router.post("/quiz/add_manual_wrong")
def add_manual_wrong(data: AddManualWrongIn, token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """手动将题目加入用户错题本"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    meta = get_session_meta(user)
    
    # 初始化用户错题本
    if "wrong_questions" not in meta:
        meta["wrong_questions"] = []
    
    # 添加到用户错题本
    import time
    wrong_item = {
        "question": data.question,
        "options": data.options,
        "correct_answer": data.correct_answer,
        "explanation": data.explanation,
        "difficulty": data.difficulty,
        "created_at": int(time.time())
    }
    meta["wrong_questions"].append(wrong_item)
    
    save_session_meta(user, meta, db)
    return {"ok": True}

@router.get("/wrongbook")
def wrongbook(token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """获取用户的错题本"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    meta = get_session_meta(user)
    wrong_questions = meta.get("wrong_questions", [])
    
    return [{
        "question": w.get("question"),
        "options": w.get("options"),
        "correct_answer": w.get("correct_answer"),
        "explanation": w.get("explanation"),
        "difficulty": w.get("difficulty"),
        "created_at": w.get("created_at")
    } for w in reversed(wrong_questions)]


@router.delete("/wrongbook/{index}")
def delete_wrong_item(token: str = None, index: int = None, request: Request = None, db: Session = Depends(get_db)):
    """删除用户错题本中指定索引的题目（前端使用的是 reversed 列表索引）"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    meta = get_session_meta(user)
    wrong_questions = meta.get("wrong_questions", [])

    if not isinstance(wrong_questions, list) or len(wrong_questions) == 0:
        raise HTTPException(status_code=404, detail="错题不存在")

    # 前端返回的是 reversed(wrong_questions)，所以需要转换回原始索引
    real_index = len(wrong_questions) - 1 - index
    if real_index < 0 or real_index >= len(wrong_questions):
        raise HTTPException(status_code=404, detail="错题不存在")

    wrong_questions.pop(real_index)
    meta["wrong_questions"] = wrong_questions
    save_session_meta(user, meta, db)

    return {"ok": True}


# ==================== 题目表 API ====================

@router.get("/quiz_questions")
def list_quiz_questions(
    token: str = None,
    session_id: str = None,
    difficulty: str = None,
    page: int = 1,
    page_size: int = 20,
    request: Request = None,
    db: Session = Depends(get_db),
):
    """获取当前用户的所有生成过的题目，支持按 session 和难度筛选，分页"""
    try:
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    query = db.query(models.QuizQuestion).filter(models.QuizQuestion.user_id == uid)

    if session_id:
        query = query.filter(models.QuizQuestion.session_id == session_id)
    if difficulty:
        query = query.filter(models.QuizQuestion.difficulty == difficulty)

    total = query.count()
    items = query.order_by(models.QuizQuestion.created_at.desc()) \
                 .offset((page - 1) * page_size) \
                 .limit(page_size) \
                 .all()

    result = []
    for q in items:
        options = None
        if q.options:
            try:
                options = json.loads(q.options)
            except:
                options = None
        result.append({
            "id": q.id,
            "user_id": q.user_id,
            "session_id": q.session_id,
            "question": q.question,
            "options": options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "source_question": q.source_question,
            "message_index": q.message_index,
            "created_at": q.created_at,
        })

    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/quiz_questions/{question_id}")
def get_quiz_question(question_id: str, token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """获取单个题目详情"""
    try:
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    q = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.id == question_id,
        models.QuizQuestion.user_id == uid,
    ).first()

    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")

    options = None
    if q.options:
        try:
            options = json.loads(q.options)
        except:
            options = None

    return {
        "id": q.id,
        "user_id": q.user_id,
        "session_id": q.session_id,
        "question": q.question,
        "options": options,
        "correct_answer": q.correct_answer,
        "explanation": q.explanation,
        "difficulty": q.difficulty,
        "source_question": q.source_question,
        "message_index": q.message_index,
        "created_at": q.created_at,
    }


@router.delete("/quiz_questions/{question_id}")
def delete_quiz_question(question_id: str, token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """删除指定题目"""
    try:
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    q = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.id == question_id,
        models.QuizQuestion.user_id == uid,
    ).first()

    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")

    db.delete(q)
    db.commit()
    return {"ok": True}
