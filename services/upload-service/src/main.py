import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# ------------------------------------------------------------------
# Ensure this service's src path is first
# ------------------------------------------------------------------
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# Prevent cross-service model conflicts
import sys as _sys
_existing_models = _sys.modules.get("models")
if _existing_models and getattr(_existing_models, "__file__", "").replace("\\", "/") != str(SRC_DIR / "models.py").replace("\\", "/"):
    del _sys.modules["models"]

# ------------------------------------------------------------------
# Local imports (upload-service specific)
# ------------------------------------------------------------------
from database import engine, get_db
from models import Base, Document, QueryHistory

# Auth handling (Docker vs local)
if os.getenv("DOCKER_ENV"):
    from auth_dependency import User, get_current_user  # type: ignore
else:
    try:
        BASE_DIR = Path(__file__).resolve().parents[3]
    except IndexError:
        BASE_DIR = Path(__file__).resolve().parent.parent.parent

    if str(BASE_DIR) not in sys.path:
        sys.path.insert(0, str(BASE_DIR))

    from shared.auth import User, get_current_user  # type: ignore

from utils.extraction import extract_text
from utils.kafka_producer import publish_document_uploaded

# ------------------------------------------------------------------
# APP INIT
# ------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NyayaAI Upload Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# UPLOAD DIRECTORY
# ------------------------------------------------------------------
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def verify_document_ownership(doc_id: int, user_id: int, db: Session):
    document = (
        db.query(Document)
        .filter(Document.id == doc_id, Document.user_id == user_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied",
        )

    return document

# ------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------
@app.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, DOCX, and TXT allowed.",
        )

    content = await file.read()

    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 20MB)",
        )

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    extracted_text = extract_text(file_path, file.filename)

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        status="uploaded",
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    event = {
        "document_id": document.id,
        "user_id": current_user.id,
        "filename": document.filename,
        "extracted_text": extracted_text,
        "timestamp": datetime.utcnow().isoformat(),
    }

    publish_document_uploaded(event)

    return {
        "document_id": document.id,
        "filename": document.filename,
        "status": "uploaded",
        "message": "Document uploaded and queued for processing",
    }

# ------------------------------------------------------------------
# LIST DOCUMENTS
# ------------------------------------------------------------------
@app.get("/documents")
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .all()
    )

    return [
        {
            "document_id": d.id,
            "id": d.id,
            "filename": d.filename,
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "uploaded_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]

# ------------------------------------------------------------------
# DOCUMENT CHAT HISTORY (STAGE 5)
# ------------------------------------------------------------------
@app.get("/documents/{doc_id}/history")
def get_document_history(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_document_ownership(doc_id, current_user.id, db)

    history = (
        db.query(QueryHistory)
        .filter(QueryHistory.document_id == doc_id)
        .order_by(QueryHistory.asked_at)
        .all()
    )

    return [
        {
            "question": h.question,
            "answer": h.answer,
            "asked_at": h.asked_at.isoformat() if h.asked_at else None,
        }
        for h in history
    ]