# NyayaAI Code Documentation Guide

## Overview

This document explains the codebase in simple terms for non-developers.

---

## Service Architecture

NyayaAI uses a **microservices architecture**, meaning the application is split into multiple small, independent services that work together:

### 1. **Auth Service** (Port 8001)
**Purpose**: Handles user accounts and login

**What it does**:
- **Register**: Creates new user accounts
  - Takes email, password, and name
  - Hashes password for security (never stores plain passwords!)
  - Saves user to database
  
- **Login**: Verifies credentials and creates session
  - Checks if email exists
  - Verifies password matches
  - Creates a JWT token (like a temporary ID card valid for 24 hours)
  - Frontend stores this token and sends it with every request
  
- **Verify User**: Checks if user is logged in
  - Reads the JWT token from request
  - Returns user information

**Key Files**:
- `main.py`: API endpoints (register, login, /me)
- `models.py`: User database table structure
- `schemas.py`: Data validation (what data can be sent/received)
- `utils/auth.py`: Password hashing and JWT token creation

---

### 2. **Upload Service** (Port 8002)
**Purpose**: Manages document uploads

**What it does**:
- **Upload Document**:
  1. Receives file from frontend (PDF, DOCX, or TXT)
  2. Validates file type and size (max 20MB)
  3. Saves file to disk with unique filename
  4. Extracts text from document
  5. Stores metadata in database
  6. Publishes event to Kafka (tells Embedding Service to process it)
  
- **List Documents**: Returns all documents owned by logged-in user
  
- **Get History**: Returns all questions/answers for a specific document

**How File Upload Works**:
```
User uploads file → Save to disk → Extract text → Save to DB → Publish to Kafka
                                                               ↓
                                            Embedding Service picks up event
```

**Key Files**:
- `main.py`: Upload endpoint, list documents, history
- `models.py`: Document and QueryHistory tables
- `utils/extraction.py`: Extracts text from PDF/DOCX/TXT files
- `utils/kafka_producer.py`: Sends messages to Kafka

---

### 3. **Embedding Service** (Port 8002)
**Purpose**: Processes documents and creates searchable embeddings

**What it does**:
1. **Listens to Kafka** for new document uploads
2. **Chunks the document** into small pieces (overlapping for context)
3. **Creates embeddings** (converts text to numbers that AI understands)
4. **Stores in Vector Database** (ChromaDB) for fast semantic search
5. **Updates status** in database to "ready"

**Why Chunking?**:
- Large documents are too big to process at once
- Breaking into chunks allows finding specific relevant sections
- Overlapping ensures we don't lose context at boundaries

**What are Embeddings?**:
- Mathematical representation of text
- Similar text has similar numbers
- Allows AI to find relevant sections even if wording is different

**Key Files**:
- `consumer.py`: Listens to Kafka messages
- `utils/chunking.py`: Splits text into chunks
- `utils/embedding.py`: Creates embeddings using SentenceTransformers

---

### 4. **Query Service** (Port 8003)
**Purpose**: Answers questions about documents using AI

**What it does (RAG - Retrieval Augmented Generation)**:
1. **Receives question** from user
2. **Converts question to embedding** (same math as document)
3. **Searches Vector DB** for most relevant chunks
4. **Sends to AI (OpenAI)** with context
5. **Returns answer** to user
6. **Saves to history** for later reference

**How RAG Works**:
```
User Question → Convert to embedding → Search Vector DB → Get relevant chunks
                                                                ↓
                                      OpenAI AI ← Prompt with chunks and question
                                                                ↓
                                                           Generate Answer
```

**Why RAG?**:
- AI alone doesn't know about your specific documents
- RAG gives AI relevant context from your document
- More accurate answers grounded in actual document content

**Key Files**:
- `main.py`: /query endpoint
- `utils/rag.py`: Retrieves relevant chunks from Vector DB
- `utils/llm.py`: Calls OpenAI API to generate answer
- `utils/embedding.py`: Creates question embeddings

---

## Frontend (React)

### How the UI Works:

**1. Login/Register Page** (`App.js`)
- Shows login or register form
- Sends credentials to Auth Service
- Stores JWT token in React Context
- Redirects to dashboard on success

**2. Dashboard** (`DocumentDashboard.js`)
- Shows all user's documents
- Displays document status (uploaded, processing, ready, error)
- Auto-refreshes every 8 seconds to check status
- Allows selecting a document to chat with

**3. Upload Component** (`DocumentUpload.js`)
- File picker for PDF, DOCX, TXT
- Upload button sends file to Upload Service
- Shows success message

**4. Query/Chat Component** (`QueryBox.js`)
- Text area for entering questions
- Sends question to Query Service
- Displays AI-generated answer
- Shows chat history below

**React Context** (`AuthContext.js`):
- Stores user information and JWT token globally
- All components can access logged-in user
- Provides login/logout functions

---

## Database Tables

### Auth Service Database:

**users** table:
```
id              : Unique user ID (auto-increment)
email           : User's email (unique)
hashed_password : Bcrypt hash of password
full_name       : User's full name (optional)
created_at      : When account was created
```

### Upload Service Database:

**documents** table:
```
id              : Unique document ID
user_id         : Who uploaded it (from users table)
filename        : Original filename
file_path       : Where file is stored on disk
extracted_text  : Full text extracted from file
status          : uploaded → processing → ready → error
created_at      : When uploaded
```

**query_history** table:
```
id              : Unique query ID
document_id     : Which document was queried
question        : User's question
answer          : AI's answer
asked_at        : When question was asked
```

---

## Key Technologies Explained

### 1. **FastAPI**
- Modern Python web framework
- Automatically generates API documentation at `/docs`
- Fast and easy to use

### 2. **SQLAlchemy**
- Python library for working with databases
- Lets us write Python code instead of SQL
- Manages database connections

### 3. **JWT (JSON Web Token)**
- Secure way to transmit user identity
- Contains user info + expiration time
- Signed with secret key so it can't be faked
- Frontend sends in `Authorization: Bearer <token>` header

### 4. **Kafka**
- Message queue for async communication
- Upload Service publishes events
- Embedding Service consumes events
- Decouples services (they don't need to know about each other)

### 5. **ChromaDB**
- Vector database for storing embeddings
- Fast similarity search
- Finds most relevant document chunks for a question

### 6. **OpenAI API**
- Large Language Model (LLM) for generating answers
- We send question + relevant context
- Returns human-like answer

### 7. **Docker**
- Packages each service with its dependencies
- Ensures everything runs the same everywhere
- Easy to deploy

---

## Common Workflows

### User Registration Flow:
```
1. User fills form → Frontend sends to Auth Service
2. Auth Service checks email doesn't exist
3. Hashes password
4. Saves to database
5. Returns success
6. User can now login
```

### Document Upload & Processing Flow:
```
1. User uploads file → Upload Service
2. Upload Service:
   - Saves file to disk
   - Extracts text
   - Saves metadata to DB (status: "uploaded")
   - Publishes to Kafka
3. Embedding Service:
   - Receives Kafka message
   - Chunks text
   - Creates embeddings
   - Stores in ChromaDB
   - Updates DB (status: "ready")
4. User can now ask questions
```

### Question & Answer Flow:
```
1. User asks question → Query Service
2. Query Service:
   - Verifies document ownership
   - Converts question to embedding
   - Searches ChromaDB for relevant chunks
   - Sends chunks + question to OpenAI
   - Receives generated answer
   - Saves to query_history
   - Returns answer to user
3. User sees answer in chat
```

---

## Security Features

1. **Password Hashing**: Passwords never stored in plain text (bcrypt)
2. **JWT Tokens**: Secure, time-limited sessions
3. **Ownership Verification**: Users can only access their own documents
4. **File Validation**: Only specific file types allowed, size limits
5. **CORS**: Only specific origins can call APIs (prevent unauthorized access)

---

## Status Codes

- **uploaded**: Document received, waiting for processing
- **processing**: Embedding Service is working on it
- **ready**: Document is ready for queries
- **error**: Something went wrong during processing

---

## Environment Variables

Each service needs configuration through environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `KAFKA_BOOTSTRAP_SERVERS`: Kafka address
- `CHROMA_HOST` / `CHROMA_PORT`: Vector database location
- `OPENAI_API_KEY`: For AI answer generation
- `SECRET_KEY`: For JWT token signing

---

## File Structure Explanation

```
services/
├── auth-service/          # User authentication
│   ├── src/
│   │   ├── main.py       # API endpoints
│   │   ├── models.py     # Database tables
│   │   ├── schemas.py    # Data validation
│   │   └── utils/
│   │       └── auth.py   # Password & JWT functions
│   ├── migrations/       # Database schema changes
│   └── requirements.txt  # Python dependencies
│
├── upload-service/        # Document uploads
│   ├── src/
│   │   ├── main.py       # Upload endpoints
│   │   ├── models.py     # Document tables
│   │   └── utils/
│   │       ├── extraction.py    # Text extraction
│   │       └── kafka_producer.py # Event publishing
│
├── embedding-service/     # Document processing
│   ├── src/
│   │   ├── consumer.py   # Kafka listener
│   │   └── utils/
│   │       ├── chunking.py   # Text chunking
│   │       └── embedding.py  # Create embeddings
│
└── query-service/         # Question answering
    ├── src/
    │   ├── main.py       # Query endpoints
    │   └── utils/
    │       ├── rag.py    # Retrieve chunks
    │       └── llm.py    # OpenAI integration

frontend/
├── src/
│   ├── App.js            # Main app component
│   ├── components/       # UI components
│   │   ├── DocumentDashboard.js
│   │   ├── DocumentUpload.js
│   │   └── QueryBox.js
│   └── context/
│       └── AuthContext.js # Global auth state
```

---

## Troubleshooting Guide

**Document stuck in "uploaded" status**:
- Check if Embedding Service is running
- Check Kafka connection
- Look at Embedding Service logs

**"Document not ready" error**:
- Document still processing
- Wait a few seconds and try again
- Check document status on dashboard

**Login fails**:
- Check email and password are correct
- Ensure Auth Service is running
- Check database connection

**"Access denied" errors**:
- JWT token expired (login again)
- Trying to access another user's document

---

This guide should help anyone understand what each part of the system does, even without programming experience!