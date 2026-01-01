FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for ML libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ .

# Volume for ChromaDB persistence
VOLUME /app/chroma_db

# Run the service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]