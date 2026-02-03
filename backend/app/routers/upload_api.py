from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import os
import shutil
import json
import numpy as np
import faiss
from openai import OpenAI
from rank_bm25 import BM25Okapi
from datetime import datetime
from ..config import settings
from ..auth import parse_token, get_token_from_request
from ..rag.ingest import build_corpus

router = APIRouter(prefix="/api", tags=["upload"])

def get_embeddings(texts):
    api_key = settings.QWEN_API_KEY
    if not api_key:
        raise RuntimeError("Missing QWEN_API_KEY")
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        timeout=120.0  # 增加超时时间
    )
    response = client.embeddings.create(
        model="text-embedding-v3",
        input=texts
    )
    embeddings = [item.embedding for item in response.data]
    return embeddings

def build_index_for_user(user_id: int):
    user_dir = os.path.join(settings.DATA_DIR, str(user_id))
    pdf_dir = os.path.join(user_dir, 'pdfs')
    index_dir = os.path.join(user_dir, 'index')
    progress_file = os.path.join(user_dir, 'index_progress.json')

    def update_progress(step: str, percent: int):
        with open(progress_file, 'w', encoding='utf-8') as f:
            json.dump({'step': step, 'percent': percent}, f, ensure_ascii=False)

    update_progress('开始处理', 0)

    if not os.path.exists(pdf_dir):
        update_progress('完成', 100)
        return

    os.makedirs(index_dir, exist_ok=True)

    update_progress('构建语料', 10)
    meta_path = os.path.join(index_dir, "meta.jsonl")
    metas = build_corpus(pdf_dir, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP, meta_path)
    texts = [m["text"] for m in metas]

    if not texts:
        update_progress('完成', 100)
        return

    update_progress('生成嵌入', 20)
    batch_size = 5  # 减少批次大小以避免超时
    all_embeddings = []
    total_batches = (len(texts) + batch_size - 1) // batch_size
    for batch_idx, i in enumerate(range(0, len(texts), batch_size)):
        batch_texts = texts[i:i+batch_size]
        batch_embs = get_embeddings(batch_texts)
        all_embeddings.extend(batch_embs)
        percent = 20 + int((batch_idx + 1) / total_batches * 60)
        update_progress('生成嵌入', percent)

    update_progress('构建索引', 80)
    embs = np.array(all_embeddings, dtype="float32")
    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embs)

    faiss_path = os.path.join(index_dir, "faiss.index")
    faiss.write_index(index, faiss_path)

    update_progress('构建BM25', 90)
    tokens = [list(t) for t in texts]
    bm25 = BM25Okapi(tokens)
    bm25_path = os.path.join(index_dir, "bm25.json")
    with open(bm25_path, "w", encoding="utf-8") as f:
        json.dump({"tokens": tokens}, f, ensure_ascii=False)

    update_progress('完成', 100)

@router.post("/upload-pdf")
async def upload_pdf(background_tasks: BackgroundTasks, token: str = Form(...), file: UploadFile = File(...)):
    try:
        uid = parse_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="只支持PDF文件")

    # 创建用户目录
    user_dir = os.path.join(settings.DATA_DIR, str(uid))
    pdf_dir = os.path.join(user_dir, 'pdfs')
    os.makedirs(pdf_dir, exist_ok=True)

    # 保存PDF
    pdf_path = os.path.join(pdf_dir, file.filename)
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 后台重新生成索引
    background_tasks.add_task(build_index_for_user, uid)
    
    return JSONResponse(content={"message": "PDF上传成功，正在生成索引"}, status_code=200)

@router.get("/index-progress")
async def get_index_progress(token: str = None, request: Request = None):
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_dir = os.path.join(settings.DATA_DIR, str(uid))
    progress_file = os.path.join(user_dir, 'index_progress.json')

    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
        return progress
    else:
        return {"step": "未开始", "percent": 0}
    
    user_dir = os.path.join(settings.DATA_DIR, str(uid))
    progress_file = os.path.join(user_dir, 'index_progress.json')
    
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
        return progress
    else:
        return {"step": "未开始", "percent": 0}
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    pdfs = []
    
    # 添加全局PDF
    if os.path.exists(settings.PDF_DIR):
        for filename in os.listdir(settings.PDF_DIR):
            if filename.lower().endswith('.pdf'):
                filepath = os.path.join(settings.PDF_DIR, filename)
                stat = os.stat(filepath)
                pdfs.append({
                    "name": filename,
                    "upload_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "source": "global"
                })
    
    # 添加用户特定PDF
    user_dir = os.path.join(settings.DATA_DIR, str(uid))
    pdf_dir = os.path.join(user_dir, 'pdfs')
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            if filename.lower().endswith('.pdf'):
                filepath = os.path.join(pdf_dir, filename)
                stat = os.stat(filepath)
                pdfs.append({
                    "name": filename,
                    "upload_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "source": "user"
                })

    return pdfs

@router.delete("/pdfs/{filename}")
async def delete_pdf(filename: str, background_tasks: BackgroundTasks, token: str = None, request: Request = None):
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    
    user_dir = os.path.join(settings.DATA_DIR, str(uid))
    pdf_dir = os.path.join(user_dir, 'pdfs')
    pdf_path = os.path.join(pdf_dir, filename)

    # 只允许删除用户特定的PDF，不允许删除全局PDF
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="文件不存在或无权限删除")

    # 删除PDF文件
    os.remove(pdf_path)

    # 后台重新生成索引
    background_tasks.add_task(build_index_for_user, uid)
    
    return {"message": "PDF删除成功，正在更新索引"}

@router.get("/pdfs")
async def list_pdfs(token: str = None, request: Request = None):
    try:
        # 支持从查询参数或 Authorization header 提取 token
        auth_header = request.headers.get("Authorization") if request else None
        token_str = get_token_from_request(token, auth_header)
        uid = parse_token(token_str)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    pdfs = []

    # 添加全局PDF
    if os.path.exists(settings.PDF_DIR):
        for filename in os.listdir(settings.PDF_DIR):
            if filename.lower().endswith('.pdf'):
                filepath = os.path.join(settings.PDF_DIR, filename)
                stat = os.stat(filepath)
                pdfs.append({
                    "name": filename,
                    "upload_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "source": "global"
                })

    # 添加用户特定PDF
    user_dir = os.path.join(settings.DATA_DIR, str(uid))
    pdf_dir = os.path.join(user_dir, 'pdfs')
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            if filename.lower().endswith('.pdf'):
                filepath = os.path.join(pdf_dir, filename)
                stat = os.stat(filepath)
                pdfs.append({
                    "name": filename,
                    "upload_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "source": "user"
                })

    return pdfs