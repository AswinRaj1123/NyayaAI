import sys
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parents[3]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from shared.auth import get_current_user  # type: ignore

from .database import get_db  # Reuse same DB setup
from .models import Document  # Minimal import
from .utils.rag import retrieve_relevant_chunks
from .utils.llm import generate_answer

class QueryRequest(BaseModel):
    document_id: int
    question: str

app = FastAPI(title="NyayaAI Query Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_document_ownership(document_id: int, user_id: int, db: Session):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document not ready (status: {doc.status})")
    return doc

@app.post("/query")
async def ask_question(
    request: QueryRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_document_ownership(request.document_id, current_user.id, db)
    
    chunks = retrieve_relevant_chunks(request.document_id, request.question)
    if not chunks:
        return {"answer": "No relevant information found in the document."}
    
    answer = generate_answer(request.question, chunks)
    
    return {
        "question": request.question,
        "answer": answer,
        "sources": len(chunks)
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/")
def root():
    return {"message": "Query Service Running - Day 5 Complete!"}