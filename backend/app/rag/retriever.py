import os, json
import numpy as np
import faiss
from rank_bm25 import BM25Okapi
from openai import OpenAI
from ..config import settings

class Retriever:
    def __init__(self, index_dir: str, top_k: int):
        self.index_dir = index_dir
        self.top_k = top_k
        self.client = OpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            timeout=120.0
        )
        self.embed_model = "text-embedding-v3"

        self.faiss_index = None
        self.metas = []
        self.bm25 = None
        self.bm25_corpus_tokens = []

    def load(self):
        faiss_path = os.path.join(self.index_dir, "faiss.index")
        meta_path = os.path.join(self.index_dir, "meta.jsonl")
        bm25_path = os.path.join(self.index_dir, "bm25.json")

        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            raise RuntimeError("索引不存在：请先运行 scripts/build_index.py")

        self.faiss_index = faiss.read_index(faiss_path)

        self.metas = []
        with open(meta_path, "r", encoding="utf-8") as f:
            for line in f:
                self.metas.append(json.loads(line))

        # BM25（可选增强：与向量结果做一个简单合并）
        if os.path.exists(bm25_path):
            with open(bm25_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.bm25_corpus_tokens = data["tokens"]
            self.bm25 = BM25Okapi(self.bm25_corpus_tokens)

    def _embed(self, text: str) -> np.ndarray:
        response = self.client.embeddings.create(
            model=self.embed_model,
            input=text
        )
        v = response.data[0].embedding
        return np.array([v], dtype="float32")

    def search(self, query: str):
        qv = self._embed(query)
        D, I = self.faiss_index.search(qv, self.top_k)
        hits = []
        for score, idx in zip(D[0].tolist(), I[0].tolist()):
            if idx < 0 or idx >= len(self.metas):
                continue
            m = self.metas[idx]
            hits.append({
                "score": float(score),
                "book": m["book"],
                "page": m["page"],
                "text": m["text"]
            })

        # 简单BM25融合：把BM25 top_k加进来（去重）
        if self.bm25 is not None:
            q_tokens = list(query)
            bm25_scores = self.bm25.get_scores(q_tokens)
            top_idx = np.argsort(bm25_scores)[-self.top_k:][::-1].tolist()
            seen = {(h["book"], h["page"], h["text"][:50]) for h in hits}
            for idx in top_idx:
                m = self.metas[int(idx)]
                key = (m["book"], m["page"], m["text"][:50])
                if key in seen:
                    continue
                hits.append({
                    "score": float(bm25_scores[int(idx)]),
                    "book": m["book"],
                    "page": m["page"],
                    "text": m["text"]
                })

        return hits
