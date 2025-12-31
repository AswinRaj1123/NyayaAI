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

from .database import get_db
from .models import Document, QueryHistory  # ✅ ADD QueryHistory
from .utils.rag import retrieve_relevant_chunks
from .utils.llm import generate_answer


class QueryRequest(BaseModel):
    document_id: int
    question: str


app = FastAPI(title="NyayaAI Query Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_document_ownership(document_id: int, user_id: int, db: Session):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == user_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    if doc.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document not ready (status: {doc.status})"
        )
    return doc


@app.post("/query")
def ask_question(
    request: QueryRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1️⃣ Verify access & readiness
    verify_document_ownership(request.document_id, current_user.id, db)

    # 2️⃣ Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(request.document_id, request.question)
    if not chunks:
        return {"answer": "No relevant information found in the document."}

    # 3️⃣ Generate answer
    answer = generate_answer(request.question, chunks)

    # 4️⃣ ✅ SAVE QUERY HISTORY (Stage 3)
    history = QueryHistory(
        document_id=request.document_id,
        question=request.question,
        answer=answer,
    )
    db.add(history)
    db.commit()

    # 5️⃣ Respond
    return {
        "question": request.question,
        "answer": answer,
        "sources": len(chunks),
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/")
def root():
    return {"message": "Query Service Running - Stage 3 Complete!"}