FROM python:3.11-alpine

WORKDIR /app

# 复制前端文件
COPY templates /app
COPY static /app/static

EXPOSE 80

CMD ["python", "-m", "http.server", "80"]
