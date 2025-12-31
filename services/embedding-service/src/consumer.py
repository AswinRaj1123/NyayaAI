from kafka import KafkaConsumer
import json
import os
from sqlalchemy.orm import Session

# Use absolute imports so this works when main.py is executed as a script
from database import SessionLocal
from models import Document
from utils.embedding import generate_and_store_embeddings

consumer = KafkaConsumer(
    'document_uploaded',
    bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
    auto_offset_reset='earliest',      # For dev — change to 'latest' in prod
    enable_auto_commit=False,          # Manual commit for safety
    group_id='embedding-service-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

def update_document_status(document_id: int, status: str):
    db: Session = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = status
            db.commit()
        else:
            print(f"Document {document_id} not found in DB")
    finally:
        db.close()

def process_event(event: dict):
    document_id = event.get("document_id")
    extracted_text = event.get("extracted_text", "")
    
    if not document_id:
        print("Invalid event: missing document_id")
        return
    
    try:
        print(f"Processing document {document_id}...")
        update_document_status(document_id, "processing")
        
        generate_and_store_embeddings(document_id, extracted_text)
        
        update_document_status(document_id, "ready")
        print(f"Document {document_id} embeddings ready!")
        
        # Commit offset only on success
        consumer.commit()
        
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        update_document_status(document_id, "error")
        # Don't commit — will retry on restart

def run_consumer():
    print("Embedding Service Consumer Started — Waiting for events...")
    for message in consumer:
        event = message.value
        print(f"Received event for document {event.get('document_id')}")
        process_event(event)