from typing import List
from .embedding import model, get_collection

def retrieve_relevant_chunks(document_id: int, question: str, top_k: int = 5) -> List[str]:
    try:
        collection = get_collection(document_id)
    except Exception as e:
        print(f"Collection not found for doc {document_id}: {e}")
        return []
    
    question_embedding = model.encode([question], normalize_embeddings=True).tolist()[0]
    
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )
    
    chunks = results["documents"][0]
    # Optional: filter by distance threshold if needed
    return chunks