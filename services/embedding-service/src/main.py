from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
from .consumer import run_consumer

app = FastAPI(title="NyayaAI Embedding Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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