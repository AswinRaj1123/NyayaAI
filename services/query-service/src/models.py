from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

__all__ = ["Base", "Document", "QueryHistory"]

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    status = Column(String, default="uploaded")
    user_id = Column(Integer, nullable=False)


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)