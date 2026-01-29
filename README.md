# 🎓 RAG Tutor Web

一个基于 RAG (Retrieval-Augmented Generation) 技术的智能学习助手系统，采用全新统一架构，本地和云服务器开箱即用。

## 🚀 快速开始

### 前置条件

- Docker 和 Docker Compose
- 千文 (Qwen) API Key (从 https://dashscope.console.aliyun.com 获取)

### 配置（3步）

**第1步：创建环境配置文件**

```bash
cd rag-tutor-web
cat > .env << EOF
# 必填项
QWEN_API_KEY=sk-your_actual_key_here
JWT_SECRET=your_strong_random_string_here

# 可选项（已有合理默认值）
APP_ENV=production
QWEN_MODEL=qwen-plus
TOP_K=6
CHUNK_SIZE=700
CHUNK_OVERLAP=120
EOF
```

**第2步：启动服务**

```bash
chmod +x start.sh stop.sh
./start.sh
```

首次启动会自动构建 Docker 镜像，通常需要 3-5 分钟。

**第3步：构建 RAG 索引**

```bash
# 将 PDF 文件上传到容器
docker-compose cp /path/to/your/file.pdf backend:/app/data/pdfs/

# 构建向量索引
docker-compose exec backend python scripts/build_index.py

# 检查索引是否完整
docker-compose exec backend ls -lh /app/data/index/
```

### 访问应用

脚本启动完成后会自动显示访问地址：

```
✅ 启动完成

🌐 访问地址:
   前端: http://localhost:8002
   后端: http://localhost:8000/api
   健康检查: http://localhost:8000/api/health
```

**在云服务器上**会自动显示真实 IP（例如 `http://8.153.94.220:8002`）

## 🛠️ 日常操作

### 启动/停止

```bash
# 启动（首次自动构建镜像）
./start.sh

# 启动（跳过镜像构建，仅重启容器）
./start.sh --no-build

# 停止
./stop.sh
```

### 常用命令

```bash
# 查看容器运行状态
docker-compose ps

# 查看实时日志
docker-compose logs -f backend      # 后端日志
docker-compose logs -f frontend     # 前端日志

# 进入容器
docker-compose exec backend bash

# 创建新用户
docker-compose exec backend python -c "from app.auth import hash_password; import os; print(hash_password('your_password'))"
```

### 更新代码

```bash
# 拉取最新代码
git pull

# 重启（大多数改动只需重启，不需重新构建）
./start.sh --no-build

# 如果修改了 requirements.txt 或 Dockerfile
./start.sh  # 会自动重新构建
```

## 🌍 云服务器部署

### 部署流程（推荐）

**第1步：上传代码到服务器**

```bash
scp -r rag-tutor-web user@your_server_ip:/home/user/
```

**第2步：SSH 连接并启动**

```bash
ssh user@your_server_ip
cd /home/user/rag-tutor-web

# 创建 .env 文件（参考上面的快速开始）
nano .env

# 启动（在服务器上自动构建）
./start.sh
```

**第3步：获取访问地址**

启动脚本会自动检测服务器 IP，输出类似：

```
🌐 访问地址:
   前端: http://your_server_ip:8002
   后端: http://your_server_ip:8000/api
```

### 架构优势

✅ **通用配置** - 本地和服务器使用完全相同的代码和 Dockerfile  
✅ **在目标服务器构建** - 避免交叉编译，性能最优  
✅ **自动 IP 检测** - 无需手动修改配置文件即可获得正确的访问地址  
✅ **容器化存储** - 所有数据在 Docker volume 中独立管理  

## 📦 项目结构

```
rag-tutor-web/
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 应用入口和路由
│   │   ├── config.py           # 配置管理（Pydantic）
│   │   ├── db.py               # SQLAlchemy 数据库配置
│   │   ├── models.py           # 数据库 ORM 模型
│   │   ├── schemas.py          # 请求/响应 schema
│   │   ├── auth.py             # JWT 认证
│   │   ├── rag/
│   │   │   ├── retriever.py    # 向量检索核心
│   │   │   ├── embeddings_dashscope.py
│   │   │   ├── ingest.py       # PDF 解析和分块
│   │   │   ├── prompts.py      # LLM prompt 模板
│   │   │   └── qwen_client.py  # Qwen API 客户端
│   │   └── routers/            # API 路由
│   │       ├── chat_api.py
│   │       ├── quiz_api.py
│   │       ├── user_api.py
│   │       └── auth_api.py
│   ├── scripts/
│   │   ├── build_index.py      # 构建 RAG 索引
│   │   └── check_dashscope.py  # 检查 API 连接
│   ├── Dockerfile              # 后端容器配置
│   └── requirements.txt         # Python 依赖
│
├── frontend/                    # Nginx 前端
│   ├── Dockerfile              # 前端容器配置
│   ├── nginx.conf              # Nginx 反向代理配置
│   ├── templates/
│   │   └── index.html          # 前端页面
│   └── static/
│       └── css/app.css         # 样式表
│
├── .env                         # 环境变量（用户创建，不要提交）
├── docker-compose.yml           # Docker 编排配置
├── start.sh                     # 启动脚本（本地/服务器通用）
├── stop.sh                      # 停止脚本
└── README.md                    # 本文件
```

## 🔧 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **后端框架** | FastAPI 0.104+ | 高性能 Python Web 框架 |
| **数据库** | SQLite + SQLAlchemy 2.0+ | 轻量级 ORM 数据库 |
| **向量检索** | FAISS + BM25 | 混合检索（向量+关键词） |
| **LLM 嵌入** | DashScope text-embedding-v4 | 云端嵌入模型，无需本地部署 |
| **LLM 推理** | Qwen (阿里大模型) | 云端 API，按量付费 |
| **前端服务** | Nginx | 静态资源服务和反向代理 |
| **容器编排** | Docker Compose | 单机多容器管理 |
| **认证** | JWT + python-jose | 无状态身份验证 |
| **PDF 处理** | PyMuPDF | 高效 PDF 文本提取 |

## 📁 数据存储

所有应用数据通过 Docker named volume `backend_data` 持久化存储，完全独立于主机文件系统：

```
backend_data (Docker volume /app/data/)
├── app.db                  # SQLite 数据库（用户、对话记录）
├── pdfs/                   # PDF 文档目录
├── index/                  # 构建的 RAG 索引
│   ├── faiss.index        # FAISS 向量索引
│   ├── meta.jsonl         # 文本元数据（映射向量到原文）
│   └── bm25.json          # BM25 倒排索引
```

**关键点**：
- Cloud 服务器上可以安全地删除本地的 `data/` 目录，所有数据都在 volume 中
- 使用 `docker-compose down -v` 会删除所有数据（谨慎操作）
- 使用 `docker-compose down`（不带 -v）仅停止容器，数据保留

## ⚙️ 环境变量详解

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `QWEN_API_KEY` | ✅ | 无 | 千文 API Key，从 dashscope.aliyuncs.com 获取 |
| `JWT_SECRET` | ✅ | 无 | JWT 签名密钥，任意复杂字符串 |
| `APP_ENV` | ❌ | `production` | 应用环境（dev/production） |
| `APP_HOST` | ❌ | `0.0.0.0` | 后端绑定地址 |
| `APP_PORT` | ❌ | `8000` | 后端端口 |
| `QWEN_MODEL` | ❌ | `qwen-plus` | 使用的大模型（推荐 qwen-plus/qwen-turbo） |
| `TOP_K` | ❌ | `6` | 向量召回数量 |
| `CHUNK_SIZE` | ❌ | `700` | 文本分块大小（字符） |
| `CHUNK_OVERLAP` | ❌ | `120` | 分块重叠大小（字符） |

## 🛠️ 故障排除

### 1. 容器无法启动

```bash
# 查看详细错误日志
docker-compose logs backend

# 检查 .env 是否存在和正确
cat .env

# 完整重建（删除缓存）
docker-compose down
docker system prune -a
./start.sh
```

### 2. 无法连接 QWEN API（文生成报错）

```bash
# 验证 API Key 是否正确
docker-compose exec backend python -c \
  "from app.config import settings; print(settings.QWEN_API_KEY[:10])"

# 查看完整错误
docker-compose logs backend | grep -i "qwen\|error\|api"

# 手动测试连接
docker-compose exec backend python app/rag/check_dashscope.py
```

### 3. 聊天返回 404 或没有结果

说明 RAG 索引未构建或文件未加载：

```bash
# 检查 PDF 是否上传
docker-compose exec backend ls -lh /app/data/pdfs/

# 检查索引是否存在
docker-compose exec backend ls -lh /app/data/index/

# 重新构建索引
docker-compose exec backend python scripts/build_index.py

# 查看索引统计
docker-compose exec backend ls -lh /app/data/index/
```

### 4. 云服务器显示 403 Forbidden

前端 Nginx 权限问题：

```bash
# 查看 Nginx 错误日志
docker-compose logs frontend

# 重建前端容器
docker-compose up --build -d frontend

# 或仅重启
docker-compose restart frontend
```

### 5. 访问地址显示 localhost 而不是公网 IP

脚本会自动检测，但如果失败可手动指定：

```bash
# 一次性指定
SERVER_IP=8.153.94.220 ./start.sh

# 或修改 .env 后重启
echo "SERVER_IP=8.153.94.220" >> .env
./start.sh --no-build
```

## 📚 更新和维护

### 更新代码

```bash
# 拉取最新
git pull

# 智能重启（仅代码改动则不重建）
./start.sh --no-build
```

### 数据备份

```bash
# 导出数据库
docker-compose exec backend sqlite3 /app/data/app.db ".dump" > backup.sql

# 备份向量索引
docker cp rag-tutor-backend:/app/data/index ./backup_index
```

### 清理空间

```bash
# 仅停止容器，保留数据
./stop.sh

# 清理所有旧镜像和临时文件
docker system prune -a

# 删除所有数据（谨慎！）
docker-compose down -v
```

## 🔐 安全建议

- ✅ `.env` 文件包含敏感信息，**不要提交到 Git**（已配置 .gitignore）
- ✅ 在生产环境修改默认的 `JWT_SECRET`
- ✅ 定期备份 SQLite 数据库和向量索引
- ✅ 使用 HTTPS 反向代理（配置 Nginx SSL）
- ✅ 监控 Qwen API 额度，防止意外支出

## 📄 许可证

MIT
