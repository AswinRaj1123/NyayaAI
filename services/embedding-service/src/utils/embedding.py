from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import os

# Load model once
model = SentenceTransformer('all-MiniLM-L6-v2')

# Use Docker path when in Docker, relative path for local dev
CHROMA_PATH = "/app/chroma_db" if os.getenv("DOCKER_ENV") else "../../chroma_db"
client = chromadb.PersistentClient(path=CHROMA_PATH)


def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50):
    if not text or not text.strip():
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - chunk_overlap

    return chunks


def get_collection(document_id: int):
    return client.get_or_create_collection(name=f"doc_{document_id}")


def generate_and_store_embeddings(document_id: int, text: str):
    collection = get_collection(document_id)

    chunks = chunk_text(text)
    if not chunks:
        print("No chunks generated.")
        return

    print(f"Generating embeddings for {len(chunks)} chunks...")
    embeddings = model.encode(
        chunks,
        show_progress_bar=True,
        normalize_embeddings=True
    )

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {"source": "document", "document_id": document_id, "chunk_index": i}
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas
    )

    print(f"Stored {len(chunks)} embeddings for document {document_id}")