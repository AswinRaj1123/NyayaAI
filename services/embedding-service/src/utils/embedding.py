from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import os
from tqdm import tqdm

# Load model once (thread-safe)
model = SentenceTransformer('all-MiniLM-L6-v2')  # 384-dim, fast, great quality

# Chroma setup with persistence
CHROMA_PATH = "../../chroma_db"
client = chromadb.PersistentClient(path=CHROMA_PATH)

def get_collection(document_id: int):
    collection_name = f"doc_{document_id}"
    return client.get_or_create_collection(name=collection_name)

def generate_and_store_embeddings(document_id: int, text: str):
    collection = get_collection(document_id)
    
    chunks = chunk_text(text)
    if not chunks:
        return
    
    # Generate embeddings
    print(f"Generating embeddings for {len(chunks)} chunks...")
    embeddings = model.encode(chunks, show_progress_bar=True, normalize_embeddings=True)
    
    # Prepare data for Chroma
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    documents = chunks
    metadatas = [{"source": "document", "document_id": document_id, "chunk_index": i} for i in range(len(chunks))]
    
    # Add to collection
    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings.tolist(),
        metadatas=metadatas
    )
    
    print(f"Stored {len(chunks)} embeddings for document {document_id}")