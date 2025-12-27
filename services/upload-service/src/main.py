from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import uuid
from datetime import datetime

from .database import get_db, engine
from .models import Base, Document
from .utils.extraction import extract_text
from .utils.kafka_producer import publish_document_uploaded

# -----------------------------
# TEMP AUTH (Mock User)
# -----------------------------
class User:
    def __init__(self, id: int):
        self.id = id

async def get_current_user():
    """
    TEMP MOCK AUTH
    Replace with JWT validation in Stage 4
    """
    return User(id=1)

# -----------------------------
# APP INIT
# -----------------------------
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NyayaAI Upload Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# UPLOAD DIRECTORY
# -----------------------------
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------------
# ROUTES
# -----------------------------
@app.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
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

    # Read file content (FastAPI does NOT give file.size reliably)
    content = await file.read()

    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 20MB)",
        )

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text
    extracted_text = extract_text(file_path, file.filename)

    # Save document record
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

    # Publish Kafka event
    event = {
        "document_id": document.id,
        "user_id": current_user.id,
        "filename": document.filename,
        "timestamp": datetime.utcnow().isoformat(),
    }

    publish_document_uploaded(event)

    return {
        "document_id": document.id,
        "filename": document.filename,
        "status": "uploaded",
        "message": "Document uploaded and queued for processing",
    }

@app.get("/")
def root():
    return {"message": "NyayaAI Upload Service is running"}