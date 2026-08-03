from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///metroguard.db"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    FAISS_INDEX_PATH: str = "rag_index"
    TOP_K: int = 3
    CHUNK_SIZE: int = 500
    VITE_API_BASE_URL: str = "http://localhost:8000"
    WEBSOCKET_URL: str = "ws://localhost:8000/ws/sensors"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    PORT: int = 8000

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        extra = "ignore"

settings = Settings()
