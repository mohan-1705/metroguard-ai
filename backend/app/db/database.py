from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger("metroguard.database")

db_url = settings.DATABASE_URL
engine = None

try:
    if "postgresql" in db_url:
        engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        # Test connection
        conn = engine.connect()
        conn.close()
        logger.info("Connected to PostgreSQL successfully.")
    else:
        engine = create_engine(
            db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
        )
        logger.info(f"Connected to database: {db_url}")
except Exception as e:
    logger.warning(f"Failed to connect to database {db_url} due to: {e}. Falling back to SQLite.")
    fallback_url = "sqlite:///metroguard.db"
    engine = create_engine(
        fallback_url, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
