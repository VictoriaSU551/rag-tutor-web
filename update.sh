#!/bin/bash

set -e

echo "🔄 RAG Tutor Web - 更新中..."
echo ""

# 检查 git 是否安装
if ! which git > /dev/null 2>&1; then
    echo "❌ Git 未安装"
    exit 1
fi

# 停止服务
echo "🛑 第一步: 停止服务..."
./stop.sh
echo ""

# Git 拉取最新代码
echo "📦 第二步: 拉取最新代码..."
git pull
echo ""

# 启动服务
echo "🚀 第三步: 启动服务..."
./start.sh
echo ""

echo "✅ 更新完成！"
echo ""

