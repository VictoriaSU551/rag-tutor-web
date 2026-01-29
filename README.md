# RAG Tutor Web

**English** ｜ [简体中文](README_zh.md)

A Retrieval-Augmented Generation (RAG) based intelligent tutoring system with hybrid retrieval capabilities.

## Architecture

### Project Structure

```
rag-tutor-web/
├── backend/
│   ├── app/
│   │   ├── main.py              # Application entry point
│   │   ├── config.py            # Configuration management
│   │   ├── db.py                # Database connection
│   │   ├── models.py            # ORM models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT authentication
│   │   ├── rag/
│   │   │   ├── retriever.py     # Hybrid retrieval engine
│   │   │   ├── embeddings_dashscope.py
│   │   │   ├── ingest.py        # Document processing
│   │   │   ├── prompts.py       # LLM prompt templates
│   │   │   └── qwen_client.py   # Qwen API client
│   │   └── routers/
│   │       ├── chat_api.py      # Chat endpoints
│   │       ├── quiz_api.py      # Quiz generation
│   │       ├── user_api.py      # User management
│   │       └── auth_api.py      # Authentication
│   ├── scripts/
│   │   └── build_index.py       # Index builder
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── templates/
│   │   └── index.html
│   └── static/
│       └── css/
├── docker-compose.yml
├── start.sh
├── stop.sh
└── .env.example
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Qwen API Key from [DashScope Console](https://dashscope.console.aliyun.com)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/VictoriaSU551/rag-tutor-web.git
cd rag-tutor-web
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and set the required values:

```bash
# Required
QWEN_API_KEY=your_dashscope_api_key
JWT_SECRET=your_secure_random_string

# Optional (defaults provided)
APP_ENV=production
QWEN_MODEL=qwen-plus
TOP_K=6
CHUNK_SIZE=700
CHUNK_OVERLAP=120
```

3. **Start the services**

```bash
chmod +x start.sh stop.sh
./start.sh
```

First-time startup will build Docker images (3-5 minutes).

4. **Build RAG index**

```bash
# Upload PDF files
docker-compose cp /path/to/document.pdf backend:/app/data/pdfs/

# Build vector index
docker-compose exec backend python scripts/build_index.py

# Verify index
docker-compose exec backend ls -lh /app/data/index/
```

### Access

- Frontend: `http://<ip-address>:8002`
- Backend API: `http://<ip-address>:8000/api`
- Health Check: `http://<ip-address>:8000/api/health`

## Usage

### Start/Stop

```bash
# Start (build images if needed)
./start.sh

# Stop
./stop.sh
```

### Update

```bash
git pull
./start.sh
```

## Data Storage

All application data is persisted in Docker volume `backend_data`:

```
backend_data (/app/data/)
├── app.db              # SQLite database
├── pdfs/               # PDF documents
└── index/              # RAG index files
    ├── faiss.index     # FAISS vector index
    ├── meta.jsonl      # Text metadata
    └── bm25.json       # BM25 inverted index
```

## Environment Variables

For complete environment variable documentation, see [.env.example](.env.example).

### Required

| Variable | Description | How to Get |
|----------|-------------|------------|
| `QWEN_API_KEY` | Qwen API key | Get from [DashScope Console](https://dashscope.console.aliyun.com) |
| `JWT_SECRET` | JWT signing secret | Generate with `openssl rand -hex 32` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `production` | Application environment (dev/production) |
| `APP_HOST` | `0.0.0.0` | Backend listening address |
| `APP_PORT` | `8000` | Backend listening port |
| `BASE_URL` | `http://localhost` | Application base URL |
| `JWT_EXPIRE_MINUTES` | `10080` | JWT expiration time (minutes), default 7 days |
| `QWEN_MODEL` | `qwen-plus` | Qwen model name (qwen-plus/qwen-turbo/qwen-max) |
| `OPENAI_API_KEY` | - | OpenAI API key (required for OpenAI compatible interface) |
| `OPENAI_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI API base URL |
| `DATABASE_URL` | `sqlite:////app/data/app.db` | Database connection string |
| `DATA_DIR` | `/app/data` | Data directory path |
| `PDF_DIR` | `/app/data/pdfs` | PDF file storage path |
| `INDEX_DIR` | `/app/data/index` | Index file storage path |
| `TOP_K` | `6` | Number of documents to retrieve |
| `CHUNK_SIZE` | `700` | Document chunk size (characters) |
| `CHUNK_OVERLAP` | `120` | Chunk overlap size (characters) |

