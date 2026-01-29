from dotenv import load_dotenv
load_dotenv()

from app.rag.embeddings_dashscope import DashScopeEmbedder

embedder = DashScopeEmbedder()
embs = embedder.embed_documents(["测试文本"])
print(f"DashScope 嵌入维度: {len(embs[0])}")
print(f"前5个值: {embs[0][:5]}")
