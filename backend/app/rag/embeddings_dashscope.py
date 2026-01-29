import os
from typing import List
import httpx

DASHSCOPE_EMBED_URL = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding"

class DashScopeEmbedder:
    """
    DashScope embedding wrapper.

    Env:
      - QWEN_API_KEY or DASHSCOPE_API_KEY
    Model:
      - text-embedding-v2
    """

    def __init__(self, api_key: str | None = None, model: str = "text-embedding-v2", timeout: float = 60.0):
        self.api_key = api_key or os.getenv("QWEN_API_KEY") or os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise RuntimeError("Missing DashScope API key. Set QWEN_API_KEY or DASHSCOPE_API_KEY in env.")
        self.model = model
        self.timeout = timeout

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "input": {"texts": texts},
        }

        with httpx.Client(timeout=self.timeout) as client:
            r = client.post(DASHSCOPE_EMBED_URL, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()

        embs = data["output"]["embeddings"]  # [{"embedding": [...], "text_index": i}, ...]
        embs = sorted(embs, key=lambda x: x.get("text_index", 0))
        return [e["embedding"] for e in embs]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]