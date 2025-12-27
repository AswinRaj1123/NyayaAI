import os
from PyPDF2 import PdfReader
from docx import Document as DocxDocument

def extract_text(file_path: str, filename: str) -> str:
    _, ext = os.path.splitext(filename.lower())
    
    try:
        if ext == ".pdf":
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text.strip()
        
        elif ext in [".docx", ".doc"]:
            doc = DocxDocument(file_path)
            return "\n".join([para.text for para in doc.paragraphs]).strip()
        
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        
        else:
            return ""
    except Exception as e:
        print(f"Extraction error: {e}")
        return ""