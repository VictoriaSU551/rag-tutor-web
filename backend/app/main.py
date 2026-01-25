from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request

from .models import Base, engine
from .routers.auth_api import router as auth_router
from .routers.user_api import router as user_router
from .routers.chat_api import router as chat_router
from .routers.quiz_api import router as quiz_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAG Tutor Web", version="1.0.0")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

@app.get("/", response_class=HTMLResponse)
def home(req: Request):
    return templates.TemplateResponse("index.html", {"request": req})

@app.get("/api/health")
def health():
    return {"status":"ok","service":"rag-tutor-web"}

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(quiz_router)
