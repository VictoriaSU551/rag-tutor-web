#!/bin/bash

set -e

echo "🛑 RAG Tutor Web - 停止中..."
echo ""

# 检查 Docker
if ! which docker > /dev/null 2>&1; then
    echo "❌ Docker 未安装"
    exit 1
fi

# 停止服务
echo "🐳 停止容器..."
docker compose down

# 显示停止信息
echo ""
echo "✅ 停止完成"
echo ""
echo "📋 常用命令:"
echo "   查看日志: docker compose logs -f backend"
echo "   启动服务: ./start.sh"
echo "   清理数据（谨慎）: docker volume rm backend_data"
echo ""
