import ollama

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
    if not context_chunks:
        return "No relevant information found in the document."

    context = "\n\n".join(context_chunks)
    
    user_prompt = f"""
Question: {question}

Relevant sections from the document:
{context}

Explain in simple language. Be step-by-step if needed.
"""

    try:
        response = ollama.chat(
            model='llama3.2:3b',  # or just 'llama3.2' for larger
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_prompt}
            ],
            options={
                'temperature': 0.3,
                'num_ctx': 8192,  # Larger context if needed
            }
        )
        answer = response['message']['content'].strip()
        
        # Force disclaimer if missing (safety net)
        disclaimer = "यह कानूनी सलाह नहीं है। कृपया किसी योग्य वकील से परामर्श लें।\nThis is not legal advice. Please consult a qualified lawyer."
        if disclaimer not in answer:
            answer += f"\n\n{disclaimer}"
        
        return answer
    
    except Exception as e:
        return f"Error generating answer: {str(e)} (Is Ollama running? Try 'ollama serve' in another terminal)"