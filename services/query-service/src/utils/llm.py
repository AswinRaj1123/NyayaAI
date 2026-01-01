"""  
LLM (Large Language Model) - Answer Generation

This module implements the "Generation" part of RAG:
1. Takes relevant document chunks (from retrieval)
2. Combines them with the user's question
3. Sends to AI (Ollama) with proper prompting
4. Returns a natural language answer

The AI is instructed to:
- Explain legal concepts in simple terms
- Support both Hindi and English
- Always include legal disclaimer
- Be factual and avoid giving legal advice
"""

import ollama
import os

# ==============================================================================
# OLLAMA CONFIGURATION
# ==============================================================================
# Ollama is a local LLM server (alternative to OpenAI)
# It runs models like Llama 3.2 on your own machine
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
ollama_client = ollama.Client(host=OLLAMA_HOST)

# ==============================================================================
# SYSTEM PROMPT - Defines AI's behavior and personality
# ==============================================================================
# This prompt is sent with every request to set the AI's role
SYSTEM_PROMPT = """
You are NyayaAI, a legal awareness assistant for common citizens in India.
Explain legal documents in simple, easy-to-understand language — use Hindi if the question is in Hindi, otherwise English.
Use plain words. Avoid complex legal terms unless you explain them right away.
Be neutral, factual, and helpful.
Do not give legal advice — you are only for awareness.
Always end your answer with this disclaimer (in both languages):

"यह कानूनी सलाह नहीं है। कृपया किसी योग्य वकील से परामर्श लें।
This is not legal advice. Please consult a qualified lawyer."
"""


def generate_answer(question: str, context_chunks: list[str]) -> str:
    """
    Generate a natural language answer using AI.
    
    This function implements RAG (Retrieval-Augmented Generation) by:
    1. Taking relevant chunks retrieved from the document
    2. Combining them into a context
    3. Sending to AI with the user's question
    4. Returning the AI-generated answer
    
    The AI is given:
    - System prompt (defines its role and behavior)
    - User's question
    - Relevant document chunks as context
    
    Args:
        question: The user's question (in Hindi or English)
        context_chunks: Relevant text chunks from the document (from RAG retrieval)
    
    Returns:
        str: AI-generated answer with legal disclaimer
    
    Example:
        >>> chunks = ["Section 1: Tenant must pay rent...", "Section 2: Landlord must..."]
        >>> answer = generate_answer("What are my responsibilities?", chunks)
        >>> # Returns: "As a tenant, you must: 1. Pay rent on time...\n\nDisclaimer..."
    """
    # Handle edge case: no relevant chunks found
    if not context_chunks:
        return "No relevant information found in the document."

    # Step 1: Combine all chunks into a single context string
    # Separate chunks with double newlines for readability
    context = "\n\n".join(context_chunks)
    
    # Step 2: Create the user prompt with question and context
    # This gives AI both the question and relevant document sections
    user_prompt = f"""
Question: {question}

Relevant sections from the document:
{context}

Explain in simple language. Be step-by-step if needed.
"""

    # Step 3: Call Ollama AI to generate answer
    try:
        response = ollama_client.chat(
            model='llama3.2:3b',  # 3 billion parameter model (faster, smaller)
                                   # Can use 'llama3.2' for larger 7B model if needed
            messages=[
                # System message defines the AI's role and behavior
                {'role': 'system', 'content': SYSTEM_PROMPT},
                # User message contains the actual question and context
                {'role': 'user', 'content': user_prompt}
            ],
            options={
                'temperature': 0.3,  # Low temperature = more focused, less creative
                                      # Good for factual legal answers
                'num_ctx': 8192,  # Context window size (how much text AI can see)
                                  # 8192 tokens ≈ 6000 words
            }
        )
        
        # Extract the answer text from response
        answer = response['message']['content'].strip()
        
        # Step 4: Safety check - ensure disclaimer is present
        # If AI forgot to include it, we add it
        disclaimer = "यह कानूनी सलाह नहीं है। कृपया किसी योग्य वकील से परामर्श लें।\nThis is not legal advice. Please consult a qualified lawyer."
        if disclaimer not in answer:
            answer += f"\n\n{disclaimer}"
        
        return answer
    
    except Exception as e:
        return f"Error generating answer: {str(e)} (Is Ollama running? Try 'ollama serve' in another terminal)"