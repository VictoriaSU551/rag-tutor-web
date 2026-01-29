import os, sys, json
import numpy as np
import faiss
from openai import OpenAI
from rank_bm25 import BM25Okapi

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.config import settings
from app.rag.ingest import build_corpus

def get_embeddings(texts):
    """
    使用 DashScope API 获取云端嵌入向量
    """
    api_key = settings.QWEN_API_KEY
    if not api_key:
        raise RuntimeError("Missing QWEN_API_KEY. Set it in .env file.")
    
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    
    # 云端模型使用 text-embedding-v4
    response = client.embeddings.create(
        model="text-embedding-v4",
        input=texts
    )
    
    # OpenAI 兼容接口返回的嵌入向量
    embeddings = [item.embedding for item in response.data]
    return embeddings

def main():
    os.makedirs(settings.INDEX_DIR, exist_ok=True)
    meta_path = os.path.join(settings.INDEX_DIR, "meta.jsonl")

    print("1) 构建语料与元数据...")
    metas = build_corpus(settings.PDF_DIR, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP, meta_path)
    texts = [m["text"] for m in metas]

    print("2) 调用 DashScope API 计算向量并写入FAISS...")
    print(f"   - 总文本数: {len(texts)}")
    print("   - 向量模型: text-embedding-v4")
    print("   - API 端点: https://dashscope.aliyuncs.com/compatible-mode/v1")
    
    # 分批调用 API（避免单次请求过大）
    batch_size = 10
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        print(f"   处理批次 {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}...")
        batch_embs = get_embeddings(batch_texts)
        all_embeddings.extend(batch_embs)
    
    embs = np.array(all_embeddings, dtype="float32")

    dim = embs.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embs)

    faiss_path = os.path.join(settings.INDEX_DIR, "faiss.index")
    faiss.write_index(index, faiss_path)

    print("3) 构建BM25（可选增强）...")
    tokens = [list(t) for t in texts]  # 简化：按字符；生产可用更好的分词
    bm25 = BM25Okapi(tokens)
    bm25_path = os.path.join(settings.INDEX_DIR, "bm25.json")
    with open(bm25_path, "w", encoding="utf-8") as f:
        json.dump({"tokens": tokens}, f, ensure_ascii=False)

    print("✅ 完成：", faiss_path, meta_path, bm25_path)

if __name__ == "__main__":
    main()
