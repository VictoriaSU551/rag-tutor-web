#!/bin/bash

set -e

echo "🚀 RAG Tutor Web - 启动中..."
echo ""

# 检查 Docker
if ! which docker > /dev/null 2>&1; then
    echo "❌ Docker 未安装"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 配置文件"
    echo "请先创建 .env 文件，至少需要:"
    echo ""
    echo "QWEN_API_KEY=sk-your_actual_key"
    echo "JWT_SECRET=your_random_string"
    echo ""
    exit 1
fi

# 加载 .env 文件
source .env

# 默认总是重新构建，可通过参数禁用
BUILD_FLAG="--build"
if [ "$1" = "--no-build" ]; then
    BUILD_FLAG=""
    echo "⏭️  跳过镜像构建，使用已有镜像"
fi

echo "🐳 启动容器..."
docker compose up $BUILD_FLAG -d

# 等待服务启动
sleep 3

# 获取访问地址
# 优先使用 .env 中配置的 URL，其次使用 SERVER_IP，最后自动检测
if [ -z "$FRONTEND_URL" ] && [ -z "$BACKEND_URL" ]; then
    if [ -n "$SERVER_IP" ]; then
        FRONTEND_URL="http://$SERVER_IP:8002"
        BACKEND_URL="http://$SERVER_IP:8000"
    else
        # 自动获取公网 IP（优先外网，fallback 内网）
        PUBLIC_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
        # 检查是否为本地地址
        if [ "$PUBLIC_IP" = "localhost" ] || [ "$PUBLIC_IP" = "127.0.0.1" ]; then
            FRONTEND_URL="http://localhost:8002"
            BACKEND_URL="http://localhost:8000"
        else
            FRONTEND_URL="http://$PUBLIC_IP:8002"
            BACKEND_URL="http://$PUBLIC_IP:8000"
        fi
    fi
fi

# 显示访问信息
echo "✅ 启动完成"
echo ""
echo "🌐 访问地址:"
echo "   前端: $FRONTEND_URL"
echo "   后端: $BACKEND_URL"
echo "   健康检查: $BACKEND_URL/api/health"
echo ""
echo "📋 常用命令:"
echo "   查看日志: docker compose logs -f backend"
echo "   停止服务: docker compose down"
echo "   重启服务: docker compose restart"
echo ""
