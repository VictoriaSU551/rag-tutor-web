# -*- coding: utf-8 -*-
import json
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..auth import parse_token, get_token_from_request
from .. import models
from ..schemas import ChatIn
from ..rag.retriever import Retriever
from ..rag.prompts import SYSTEM_PROMPT, EXERCISE_SYSTEM_PROMPT, build_user_prompt, build_exercise_prompt
from ..rag.qwen_client import QwenClient
from ..config import settings

router = APIRouter(prefix="/api", tags=["chat"])

class CombinedRetriever:
    def __init__(self, retrievers):
        self.retrievers = retrievers
    
    def search(self, query: str):
        all_results = []
        for retriever in self.retrievers:
            try:
                results = retriever.search(query)
                all_results.extend(results)
            except Exception as e:
                print(f"检索器错误: {e}")
                continue
        
        # 按相似度排序并去重
        all_results.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        # 去重：基于文本内容去重
        seen_texts = set()
        unique_results = []
        for result in all_results:
            text = result.get('text', '').strip()
            if text and text not in seen_texts:
                seen_texts.add(text)
                unique_results.append(result)
        
        return unique_results[:settings.TOP_K]

_retrievers = {}

def get_retriever(user_id: int):
    cache_key = f"user_{user_id}"
    if cache_key not in _retrievers:
        retrievers = []
        
        # 总是包含全局索引
        try:
            global_retriever = Retriever(settings.INDEX_DIR, settings.TOP_K)
            global_retriever.load()
            retrievers.append(global_retriever)
        except Exception as e:
            print(f"全局索引加载失败: {e}")
        
        # 尝试加载用户特定索引
        user_index_dir = os.path.join(settings.DATA_DIR, str(user_id), 'index')
        if os.path.exists(user_index_dir):
            try:
                user_retriever = Retriever(user_index_dir, settings.TOP_K)
                user_retriever.load()
                retrievers.append(user_retriever)
            except Exception as e:
                print(f"用户索引加载失败: {e}")
        
        if retrievers:
            if len(retrievers) == 1:
                _retrievers[cache_key] = retrievers[0]
            else:
                _retrievers[cache_key] = CombinedRetriever(retrievers)
        else:
            raise RuntimeError(
                f"RAG 索引加载失败\n"
                f"请运行: python scripts/build_index.py\n"
                f"确保 {settings.PDF_DIR} 目录中有 PDF 文件"
            )
    return _retrievers[cache_key]

@router.get("/sessions")
def get_sessions(token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """获取用户的所有会话列表"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    sessions = db.query(models.Session).filter(models.Session.user_id == uid).order_by(models.Session.updated_at.desc()).all()
    return [{"id": s.id, "title": s.title, "created_at": s.created_at, "updated_at": s.updated_at} for s in sessions]

@router.post("/sessions")
def create_session(token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """创建新会话"""
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    session = models.Session(user_id=uid, title="新对话", chat=json.dumps([]))
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title}

@router.get("/sessions/{session_id}")
def get_session_detail(session_id: str, token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """获取会话详情及聊天记录"""
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
    
    chat_messages = json.loads(session.chat or "[]")
    exercises = json.loads(session.exercises or "[]")
    return {
        "id": session.id,
        "title": session.title,
        "messages": chat_messages,
        "exercises": exercises,
        "meta": session.meta or "{}",
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }

@router.get("/sessions/{session_id}/chat")
async def chat_stream(session_id: str, token: str = None, q: str = "", difficulty: str = "medium", request: Request = None, db: Session = Depends(get_db)):
    """
    流式对话，支持SSE
    前端用 GET /api/sessions/{session_id}/chat?token=...&q=...
    或通过 Authorization header
    """
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not q.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")

    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == uid
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 加载现有聊天记录
    chat_messages = json.loads(session.chat or "[]")
    
    # 添加用户问题，保存完整信息
    import time
    user_message = {
        "role": "user",
        "content": q.strip(),
        "timestamp": int(time.time())
    }
    chat_messages.append(user_message)

    retriever = get_retriever(uid)
    contexts = retriever.search(q.strip())

    user_prompt = build_user_prompt(q.strip(), contexts)
    client = QwenClient()

    async def event_gen():
        # 先发一个"检索结果概览"给前端
        meta = [{"book": c["book"], "page": c["page"]} for c in contexts[:settings.TOP_K]]
        yield f"data: {json.dumps({'type':'meta','sources': meta}, ensure_ascii=False)}\n\n"

        full_text = ""
        try:
            async for delta in client.stream_generate(SYSTEM_PROMPT, user_prompt):
                full_text += delta
                yield f"data: {json.dumps({'type':'delta','text': delta}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type':'error','message': str(e)}, ensure_ascii=False)}\n\n"
            return

        # 保存助手回复，包含完整的来源信息
        assistant_message = {
            "role": "assistant",
            "content": full_text,
            "timestamp": int(time.time()),
            "sources": [{"book": c["book"], "page": c["page"]} for c in contexts[:settings.TOP_K]]
        }
        chat_messages.append(assistant_message)
        
        # 更新会话标题（如果是第一条消息）
        if len(chat_messages) == 2:  # 只有用户问题和助手回复
            # 简单处理：截取问题前30个字符作为标题
            session.title = q.strip()[:30]
        
        # 保存更新后的聊天记录（保存完整的原始消息）
        session.chat = json.dumps(chat_messages, ensure_ascii=False)
        
        db.add(session)
        db.commit()

        yield f"data: {json.dumps({'type':'done'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """删除会话"""
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
    
    db.delete(session)
    db.commit()
    return {"ok": True}

@router.post("/sessions/{session_id}/generate_exercise")
def generate_exercise(session_id: str, token: str = None, message_index: int = None, request: Request = None, db: Session = Depends(get_db)):
    """
    针对指定消息生成一道练习题。
    每条用户提问只能生成一道题，重复请求返回提示。
    """
    import time as _time
    try:
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

    chat_messages = json.loads(session.chat or "[]")

    # 解析 meta，跟踪已生成题目的消息索引
    try:
        meta = json.loads(session.meta or "{}")
    except:
        meta = {}
    exercised_indices = meta.get("exercised_message_indices", [])

    # 确定要生成题目的用户消息索引
    if message_index is not None:
        if message_index < 0 or message_index >= len(chat_messages):
            raise HTTPException(status_code=400, detail="消息索引无效")
        if chat_messages[message_index].get("role") != "user":
            raise HTTPException(status_code=400, detail="只能针对用户提问生成题目")
        target_index = message_index
    else:
        # 默认取最后一条用户消息
        target_index = None
        for i in range(len(chat_messages) - 1, -1, -1):
            if chat_messages[i].get("role") == "user":
                target_index = i
                break
        if target_index is None:
            raise HTTPException(status_code=400, detail="没有可用的用户提问")

    # 检查是否已经为该消息生成过题目
    if target_index in exercised_indices:
        return {"ok": False, "already_generated": True, "message": "您已经生成过题目了"}

    # 获取用户提问内容
    question = chat_messages[target_index].get("content", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="提问内容为空")

    # 获取难度参数
    difficulty = "medium"
    if request:
        from urllib.parse import parse_qs, urlparse
        query_params = parse_qs(str(request.query_params))
        difficulty = query_params.get("difficulty", ["medium"])[0]

    # 检索相关文档
    retriever = get_retriever(uid)
    contexts = retriever.search(question)

    # 生成练习题
    client = QwenClient()
    try:
        exercise_prompt = build_exercise_prompt(question, contexts, difficulty)
        exercise_json = client.json_generate(EXERCISE_SYSTEM_PROMPT, exercise_prompt)
        exercise_data = json.loads(exercise_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"题目生成失败: {str(e)}")

    # 保存题目到 exercises
    existing_exercises = json.loads(session.exercises or "[]")
    exercise_data["message_index"] = target_index
    existing_exercises.append(exercise_data)
    session.exercises = json.dumps(existing_exercises, ensure_ascii=False)

    # 记录已生成题目的消息索引
    exercised_indices.append(target_index)
    meta["exercised_message_indices"] = exercised_indices
    session.meta = json.dumps(meta, ensure_ascii=False)

    # 同时保存到独立的 quiz_question 表
    quiz_q = models.QuizQuestion(
        user_id=uid,
        session_id=session_id,
        question=exercise_data.get("question", ""),
        options=json.dumps(exercise_data.get("options"), ensure_ascii=False) if exercise_data.get("options") else None,
        correct_answer=exercise_data.get("answer", exercise_data.get("correct_answer", "")),
        explanation=exercise_data.get("explanation"),
        difficulty=exercise_data.get("difficulty", difficulty),
        source_question=question,
        message_index=target_index,
        created_at=int(_time.time()),
    )
    db.add(quiz_q)

    db.add(session)
    db.commit()

    return {"ok": True, "data": exercise_data, "exercise_index": len(existing_exercises) - 1, "quiz_question_id": quiz_q.id}

@router.post("/sessions/{session_id}/generate_title")
def generate_title(session_id: str, token: str = None, request: Request = None, db: Session = Depends(get_db)):
    """自动生成会话标题（基于第一条消息）
    格式：emoji + 空格 + 名词短语
    例如：📖 操作系统基础概念
    """
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
    
    chat_messages = json.loads(session.chat or "[]")
    if not chat_messages:
        raise HTTPException(status_code=400, detail="没有消息内容")
    
    # 获取第一条用户消息
    first_question = chat_messages[0].get("content", "") if chat_messages else ""
    
    if not first_question:
        raise HTTPException(status_code=400, detail="无法生成标题")
    
    # 使用LLM生成标题
    client = QwenClient()
    title_prompt = f"""根据以下用户问题，生成一个简洁的会话标题。
格式要求：一个合适的emoji + 一个空格 + 一个名词短语（3-8个汉字）
示例输出：
📖 操作系统基础
🔧 Python编程技巧
💡 数据库设计

用户问题：{first_question}

请直接输出标题，不要有其他文字："""
    
    title_system = "你是一个会话标题生成助手。根据用户问题生成简洁的标题。"
    
    try:
        # 尝试用json_generate方式
        title = client.json_generate(
            title_system,
            title_prompt
        ).strip()
        
        # 如果返回JSON格式，尝试解析
        if title.startswith('{'):
            try:
                title_obj = json.loads(title)
                title = title_obj.get('title', title)
            except:
                pass
        
        # 限制标题长度
        title = title[:50]
    except:
        # 如果LLM生成失败，使用默认策略
        title = first_question[:30]
    
    # 更新会话标题
    session.title = title
    db.add(session)
    db.commit()
    
    return {"title": title, "ok": True}

