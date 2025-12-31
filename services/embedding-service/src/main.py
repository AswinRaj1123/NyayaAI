import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading

# Ensure local imports work when running as a script (python main.py)
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

# Also add parent so absolute imports work
PARENT_DIR = CURRENT_DIR.parent
if str(PARENT_DIR) not in sys.path:
    sys.path.insert(0, str(PARENT_DIR))

# Work whether executed as a module or script
try:
    from consumer import run_consumer
except ImportError:
    from .consumer import run_consumer  # type: ignore

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


@app.on_event("shutdown")
async def shutdown_event():
    print("Embedding service shutting down")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "embedding-service"}

@app.get("/")
def root():
    return {"message": "Embedding Service Running - Day 4 Complete"}