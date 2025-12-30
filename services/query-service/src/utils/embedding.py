from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

model = SentenceTransformer('all-MiniLM-L6-v2')

CHROMA_PATH = "../../chroma_db"
client = chromadb.PersistentClient(path=CHROMA_PATH)

def get_collection(document_id: int):
    collection_name = f"doc_{document_id}"
    return client.get_collection(name=collection_name)