"""  
RAG (Retrieval-Augmented Generation) - Chunk Retrieval

This module implements the "Retrieval" part of RAG:
1. Takes a user's question
2. Converts it to an embedding (mathematical representation)
3. Searches the vector database for similar document chunks
4. Returns the most relevant chunks to use as context for AI

This ensures AI answers are grounded in actual document content.
"""

from typing import List
from .embedding import model, get_collection


def retrieve_relevant_chunks(
    document_id: int, 
    question: str, 
    top_k: int = 5
) -> List[str]:
    """
    Find the most relevant chunks from a document for a given question.
    
    This is the core of the RAG (Retrieval-Augmented Generation) system.
    
    How it works:
    1. Get the vector collection for this document from ChromaDB
    2. Convert the question into an embedding (same model used for document chunks)
    3. Search ChromaDB for chunks with similar embeddings
    4. Return the top 5 most similar chunks
    
    Args:
        document_id: The database ID of the document to search
        question: The user's question (in any language)
        top_k: How many relevant chunks to return (default: 5)
    
    Returns:
        List[str]: The most relevant text chunks from the document
        Empty list if document not found or no collection exists
    
    Example:
        >>> chunks = retrieve_relevant_chunks(123, "What are my rights?")
        >>> # Returns: ["Section 1: Rights...", "Section 3: Additional rights...", ...]
        >>> # These chunks are then sent to AI for answer generation
    """
    # Step 1: Get the ChromaDB collection for this specific document
    # Each document has its own collection of embedded chunks
    try:
        collection = get_collection(document_id)
    except Exception as e:
        print(f"Collection not found for doc {document_id}: {e}")
        return []  # Return empty if document not processed yet
    
    # Step 2: Convert the question to an embedding
    # We use the same model (SentenceTransformer) that was used to embed document chunks
    # normalize_embeddings=True ensures embeddings are unit vectors for cosine similarity
    question_embedding = model.encode(
        [question], 
        normalize_embeddings=True
    ).tolist()[0]
    
    # Step 3: Search ChromaDB for similar chunks
    # ChromaDB uses cosine similarity to find chunks with similar embeddings
    # The more similar the embedding, the more relevant the chunk
    results = collection.query(
        query_embeddings=[question_embedding],  # Our question as a vector
        n_results=top_k,  # Return top 5 most similar chunks
        include=["documents", "metadatas", "distances"]  # What data to return
    )
    
    # Step 4: Extract the actual text chunks from results
    chunks = results["documents"][0]
    
    # Optional: You could filter by distance threshold here
    # For example: only return chunks with distance < 0.5
    # But for now we return all top_k chunks
    
    return chunks