快速启动说明

1. 进入 backend 目录：

   cd backend

2. 运行启动脚本（Linux/macOS）：

   ./scripts/start_dev.sh

脚本会自动创建 `.venv`（如果不存在）、安装 `requirements.txt` 中的依赖并通过 `python -m uvicorn` 启动服务（监听 0.0.0.0:8002）。

故障排查：
- 如果出现 `ModuleNotFoundError: No module named 'uvicorn'`，说明虚拟环境中没有安装 `uvicorn`，可手动执行：

  source .venv/bin/activate && pip install -r requirements.txt

- 确保使用的是合适的 Python（建议 Python 3.10+）。
- 确认防火墙/云安全组已放行 8002 端口。