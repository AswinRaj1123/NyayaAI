from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .database import get_db  # Reuse same DB setup
from .models import Document  # Minimal import
from .utils.rag import retrieve_relevant_chunks
from .utils.llm import generate_answer
from ..auth-service.src.dependencies import get_current_user  # We'll fix path later or duplicate minimal

class QueryRequest(BaseModel):
    document_id: int
    question: str

app = FastAPI(title="NyayaAI Query Service")

# Mock auth — replace with real JWT dependency soon
async def get_current_user_mock():
    return type('User', (), {'id': 1})()

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
    current_user = Depends(get_current_user_mock),
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