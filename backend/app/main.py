from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .models import Base, engine
from .config import settings
from .routers.auth_api import router as auth_router
from .routers.user_api import router as user_router
from .routers.chat_api import router as chat_router
from .routers.quiz_api import router as quiz_router
from .routers.upload_api import router as upload_router

# 确保数据目录存在
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.PDF_DIR, exist_ok=True)
os.makedirs(settings.INDEX_DIR, exist_ok=True)

# 初始化数据库
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAG Tutor Web", version="1.0.0")

# CORS 配置，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该配置具体的前端URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status":"ok","service":"rag-tutor-web"}

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(quiz_router)
app.include_router(upload_router)
