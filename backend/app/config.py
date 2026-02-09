from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_ENV: str = "dev"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8002
    BASE_URL: str = "http://127.0.0.1:8002"

    JWT_SECRET: str = "PLEASE_CHANGE_ME"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    QWEN_API_KEY: str | None = None
    QWEN_MODEL: str = "qwen-plus"

    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str | None = None  # 对接兼容服务时可设置
    OPENAI_EMBED_MODEL: str = "text-embedding-3-small"

    # 数据目录 - Docker 中会被 env 变量覆盖为绝对路径 /app/data，本地开发为相对路径
    DATA_DIR: str = "/app/data"  # Docker 环境中默认值
    PDF_DIR: str = "/app/data/pdfs"
    INDEX_DIR: str = "/app/data/index"
    PDF_DIR: str = "/app/data/pdfs"
    INDEX_DIR: str = "/app/data/index"

    TOP_K: int = 6
    CHUNK_SIZE: int = 700
    CHUNK_OVERLAP: int = 120

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # 环境变量优先于 .env 文件

settings = Settings()
