from pydantic_settings import BaseSettings

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

    DATA_DIR: str = "./data"
    PDF_DIR: str = "./data/pdfs"
    INDEX_DIR: str = "./data/index"

    TOP_K: int = 6
    CHUNK_SIZE: int = 700
    CHUNK_OVERLAP: int = 120

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
