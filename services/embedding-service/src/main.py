from fastapi import FastAPI
import threading
from .consumer import run_consumer

app = FastAPI(title="NyayaAI Embedding Service")

@app.on_event("startup")
async def startup_event():
    # Run consumer in background thread
    consumer_thread = threading.Thread(target=run_consumer, daemon=True)
    consumer_thread.start()
    print("Kafka consumer thread started")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "embedding-service"}

@app.get("/")
def root():
    return {"message": "Embedding Service Running - Day 4 Complete"}