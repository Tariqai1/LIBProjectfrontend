# file: library_backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "❌ DATABASE_URL is not set. "
        "Add it in Render Environment Variables or .env file."
    )

# --------------------------------------------------
# Create SQLAlchemy engine (Supabase / Render safe)
# --------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,     # auto-reconnect if connection drops
    pool_size=5,
    max_overflow=10,
    echo=False,             # set True only for debugging
)

# --------------------------------------------------
# Session factory
# --------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# --------------------------------------------------
# Base class for models
# --------------------------------------------------
Base = declarative_base()

# --------------------------------------------------
# Dependency for FastAPI
# --------------------------------------------------
def get_db():
    """
    FastAPI dependency:
    Usage -> db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
