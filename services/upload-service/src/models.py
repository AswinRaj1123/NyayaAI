from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    # Reference to auth-service user (NO DB-level FK)
    user_id = Column(Integer, nullable=False, index=True)

    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Local path / S3 / R2 later
    extracted_text = Column(Text, nullable=True)

    status = Column(
        String,
        default="uploaded"
    )  # uploaded → processing → ready → error

    created_at = Column(DateTime, default=datetime.utcnow)