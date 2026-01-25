import os, sys, json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.config import settings
from app.rag.ingest import build_corpus

def main():
    os.makedirs(settings.INDEX_DIR, exist_ok=True)
    meta_path = os.path.join(settings.INDEX_DIR, "meta.jsonl")

    print("1) 构建语料与元数据...")
    metas = build_corpus(settings.PDF_DIR, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP, meta_path)
    texts = [m["text"] for m in metas]

    print("2) 计算向量并写入FAISS...")
    model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    embs = model.encode(texts, batch_size=64, normalize_embeddings=True, show_progress_bar=True)
    embs = np.array(embs, dtype="float32")

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

    print("完成：", faiss_path, meta_path, bm25_path)

if __name__ == "__main__":
    main()
