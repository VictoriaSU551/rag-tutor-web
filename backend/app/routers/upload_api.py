from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
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
from ..auth import parse_token
from ..rag.ingest import build_corpus

router = APIRouter(prefix="/api", tags=["upload"])

def get_embeddings(texts):
    api_key = settings.QWEN_API_KEY
    if not api_key:
        raise RuntimeError("Missing QWEN_API_KEY")
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    response = client.embeddings.create(
        model="text-embedding-v4",
        input=texts
    )
    embeddings = [item.embedding for item in response.data]
    return embeddings

def build_index_for_user(user_id: int):
    user_dir = os.path.join(settings.DATA_DIR, str(user_id))
    pdf_dir = os.path.join(user_dir, 'pdfs')
    index_dir = os.path.join(user_dir, 'index')

    if not os.path.exists(pdf_dir):
        return

    os.makedirs(index_dir, exist_ok=True)

    meta_path = os.path.join(index_dir, "meta.jsonl")
    metas = build_corpus(pdf_dir, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP, meta_path)
    texts = [m["text"] for m in metas]

    if not texts:
        return

    batch_size = 10
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        batch_embs = get_embeddings(batch_texts)
        all_embeddings.extend(batch_embs)

    embs = np.array(all_embeddings, dtype="float32")
    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embs)

    faiss_path = os.path.join(index_dir, "faiss.index")
    faiss.write_index(index, faiss_path)

    tokens = [list(t) for t in texts]
    bm25 = BM25Okapi(tokens)
    bm25_path = os.path.join(index_dir, "bm25.json")
    with open(bm25_path, "w", encoding="utf-8") as f:
        json.dump({"tokens": tokens}, f, ensure_ascii=False)

@router.post("/upload-pdf")
async def upload_pdf(token: str = Form(...), file: UploadFile = File(...)):
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

    # 重新生成索引
    try:
        build_index_for_user(uid)
        return JSONResponse(content={"message": "PDF上传成功，索引已更新"}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"message": f"索引生成失败: {str(e)}"}, status_code=500)

@router.get("/pdfs")
async def list_pdfs(token: str):
    try:
        uid = parse_token(token)
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
async def delete_pdf(filename: str, token: str):
    try:
        uid = parse_token(token)
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

    # 重新生成索引
    try:
        build_index_for_user(uid)
        return {"message": "PDF删除成功，索引已更新"}
    except Exception as e:
        return JSONResponse(content={"message": f"索引更新失败: {str(e)}"}, status_code=500)