FROM python:3.11-slim

WORKDIR /app

# 配置 Debian 阿里云镜像源（加速系统包下载）
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list 2>/dev/null || true

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制 requirements.txt
COPY requirements.txt .

# 安装 Python 依赖（使用阿里云国内镜像源加速）
RUN pip install -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录结构（对应 Docker volume 挂载点）
# 注：容器启动后会通过 app/main.py 再次确保目录存在
RUN mkdir -p /app/data \
    && chmod -R 755 /app/data

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
