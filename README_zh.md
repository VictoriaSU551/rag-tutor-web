# RAG Tutor Web

[English](README.md) ｜ **简体中文**

智能辅导系统，用于互动学习与练习。

## 架构说明

### 项目结构

```
rag-tutor-web/
├── backend/
│   ├── app/
│   │   ├── main.py              # 应用入口
│   │   ├── config.py            # 配置管理
│   │   ├── db.py                # 数据库连接
│   │   ├── models.py            # ORM 模型
│   │   ├── schemas.py           # Pydantic 模式
│   │   ├── auth.py              # JWT 认证
│   │   ├── rag/
│   │   │   ├── prompts.py       # LLM 提示模板
│   │   │   └── qwen_client.py   # 千文 API 客户端
│   │   └── routers/
│   │       ├── chat_api.py      # 对话接口
│   │       ├── quiz_api.py      # 测验生成
│   │       ├── user_api.py      # 用户管理
│   │       └── auth_api.py      # 认证接口
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

## 快速开始

### 前置条件

- Docker 和 Docker Compose
- 千问 API Key（从 [DashScope 控制台](https://dashscope.console.aliyun.com)获取）

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/VictoriaSU551/rag-tutor-web.git
cd rag-tutor-web
```

2. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必需的值：

```bash
# 必填项
QWEN_API_KEY=你的_dashscope_api_密钥
JWT_SECRET=你的_安全_随机_字符串

# 可选项（已提供默认值）
APP_ENV=production
QWEN_MODEL=qwen-plus
TOP_K=6
CHUNK_SIZE=700
CHUNK_OVERLAP=120
```

3. **启动服务**

```bash
chmod +x start.sh stop.sh
./start.sh
```

首次启动将构建 Docker 镜像（需 3-5 分钟）。

### 访问地址

- 前端：`http://<ip-address>:8002`
- 后端 API：`http://<ip-address>:8000/api`
- 健康检查：`http://<ip-address>:8000/api/health`

## 使用说明

### 启动/停止

```bash
# 启动（需要时构建镜像）
./start.sh

# 停止
./stop.sh
```

### 更新

```bash
git pull
./start.sh
```

## 数据存储

所有应用数据持久化在 Docker 卷 `backend_data` 中：

```
backend_data (/app/data/)
└── app.db              # SQLite 数据库
```

## 环境变量配置

完整的环境变量说明请参考 [.env.example](.env.example) 文件。

### 必填项

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| `QWEN_API_KEY` | 千文 API 密钥 | 从 [DashScope 控制台](https://dashscope.console.aliyun.com) 获取 |
| `JWT_SECRET` | JWT 签名密钥 | 使用 `openssl rand -hex 32` 生成随机字符串 |

### 可选项

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_ENV` | `production` | 应用环境（dev/production）|
| `APP_HOST` | `0.0.0.0` | 后端监听地址 |
| `APP_PORT` | `8000` | 后端监听端口 |
| `BASE_URL` | `http://localhost` | 应用基础 URL |
| `JWT_EXPIRE_MINUTES` | `10080` | JWT 过期时间（分钟），默认 7 天 |
| `QWEN_MODEL` | `qwen-plus` | 千文模型名称（qwen-plus/qwen-turbo/qwen-max）|
| `OPENAI_API_KEY` | - | OpenAI API 密钥（使用 OpenAI 兼容接口时需要）|
| `OPENAI_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI API 基础 URL |
| `DATABASE_URL` | `sqlite:////app/data/app.db` | 数据库连接字符串 |
| `DATA_DIR` | `/app/data` | 数据目录路径 |
| `DATA_DIR` | `/app/data` | 数据目录路径 |
