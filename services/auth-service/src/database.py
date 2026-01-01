import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Use env var when running in Docker; fall back to local dev URL
if os.getenv("DOCKER_ENV"):
    default_url = "postgresql://user:pass@postgres:5432/nyayaai"
else:
    default_url = "postgresql://user:pass@localhost:5433/nyayaai"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", default_url)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ✅ THIS WAS MISSING
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()