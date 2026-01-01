# NyayaAI

## Legal Document Analysis and Query System

NyayaAI is an intelligent legal document analysis platform that enables users to upload legal documents and interact with them through natural language queries. The system leverages advanced RAG (Retrieval-Augmented Generation) architecture to provide accurate, context-aware responses to legal questions in both English and Hindi.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

---

## Overview

NyayaAI addresses the challenge of understanding complex legal documents by providing an AI-powered assistant that can answer specific questions about uploaded documents. The system uses state-of-the-art natural language processing and vector embeddings to retrieve relevant context and generate accurate answers.

### Key Capabilities

- **Document Processing**: Support for PDF, DOCX, and TXT formats
- **Multilingual Support**: Query documents in English or Hindi
- **Real-time Processing**: Asynchronous document processing pipeline
- **Context-Aware Responses**: RAG-based architecture for accurate answers
- **User Management**: Secure authentication and document ownership
- **Chat History**: Persistent query and response tracking

---

## Features

### Core Functionality

- **User Authentication**: JWT-based secure authentication system
- **Document Upload**: Multi-format document upload with validation
- **Automated Processing**: Background document chunking and embedding
- **Vector Search**: Semantic search across document content
- **AI-Powered Responses**: LLM-based answer generation
- **Query History**: Complete conversation tracking per document
- **Status Monitoring**: Real-time document processing status updates

### User Interface

- **Modern Design**: Claude-inspired minimal interface
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Document Dashboard**: Centralized document management
- **Interactive Chat**: Intuitive question-answer interface
- **Status Indicators**: Visual feedback for document processing states

---

## Architecture

NyayaAI follows a microservices architecture with event-driven communication:

```
┌─────────────┐
│   Frontend  │ (React)
└──────┬──────┘
       │
       ├─────────────┬──────────────┬──────────────┬──────────────┐
       │             │              │              │              │
┌──────▼──────┐ ┌───▼────────┐ ┌───▼────────┐ ┌──▼─────────┐ ┌──▼─────────┐
│Auth Service │ │Upload Svc  │ │Query Svc   │ │Embedding   │ │Response    │
│             │ │            │ │            │ │Service     │ │Service     │
└──────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────────────┘
       │              │              │              │
       │        ┌─────▼──────┐       │              │
       │        │   Kafka    │◄──────┴──────────────┘
       │        └────────────┘
       │
┌──────▼───────────────────────────────────┐
│         PostgreSQL Database              │
│  (Users, Documents, Query History)       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         ChromaDB Vector Store            │
│      (Document Embeddings)               │
└──────────────────────────────────────────┘
```

### Service Responsibilities

- **Auth Service**: User registration, authentication, and JWT token management
- **Upload Service**: Document upload, metadata storage, and event publishing
- **Embedding Service**: Document chunking, embedding generation, and vector storage
- **Query Service**: Query processing, vector search, and LLM orchestration
- **Response Service**: Future extensibility for response processing

---

## Technology Stack

### Frontend
- **React**: UI framework
- **Axios**: HTTP client
- **React Context**: State management

### Backend Services
- **FastAPI**: Modern Python web framework
- **Python 3.11+**: Core programming language
- **Pydantic**: Data validation and settings management

### Data Layer
- **PostgreSQL**: Relational database for structured data
- **ChromaDB**: Vector database for embeddings
- **Alembic**: Database migration management

### Message Queue
- **Apache Kafka**: Event streaming platform

### AI/ML
- **Sentence Transformers**: Document embedding generation
- **OpenAI API**: Large language model for answer generation

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

---

## Prerequisites

Before installation, ensure you have the following installed:

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Node.js**: Version 16.x or higher (for frontend development)
- **Python**: Version 3.11 or higher (for local development)
- **OpenAI API Key**: Required for LLM functionality

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AswinRaj1123/NyayaAI.git
cd NyayaAI
```

### 2. Environment Configuration

Create environment files for each service:

**Auth Service** (`services/auth-service/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nyayaai_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Upload Service** (`services/upload-service/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nyayaai_db
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

**Embedding Service** (`services/embedding-service/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nyayaai_db
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
CHROMA_HOST=vector-db
CHROMA_PORT=8000
```

**Query Service** (`services/query-service/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nyayaai_db
CHROMA_HOST=vector-db
CHROMA_PORT=8000
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This command will start:
- PostgreSQL database
- Kafka message broker
- Zookeeper (Kafka dependency)
- ChromaDB vector store
- All microservices
- Frontend application

### 4. Database Migration

Run migrations for services:

```bash
# Auth Service migrations
docker exec -it auth-service alembic upgrade head

# Upload Service migrations
docker exec -it upload-service alembic upgrade head
```

### 5. Verify Installation

Access the application at: `http://localhost:3000`

Check service health:
- Auth Service: `http://localhost:8001/docs`
- Upload Service: `http://localhost:8002/docs`
- Query Service: `http://localhost:8003/docs`

---

## Configuration

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Auth Service | 8001 | Authentication API |
| Upload Service | 8002 | Document upload API |
| Query Service | 8003 | Query processing API |
| PostgreSQL | 5432 | Database |
| ChromaDB | 8000 | Vector database |
| Kafka | 9092 | Message broker |

### Environment Variables

Refer to individual service directories for complete environment variable documentation.

---

## Usage

### 1. User Registration

Navigate to `http://localhost:3000` and create an account using the registration form.

### 2. Document Upload

After login:
1. Click on the document upload section
2. Select a PDF, DOCX, or TXT file
3. Click "Upload Document"
4. Wait for processing to complete (status will update automatically)

### 3. Querying Documents

Once a document shows "Ready" status:
1. Click on the document card
2. Enter your question in the chat interface
3. Submit the query
4. View the AI-generated response with source citations

### 4. Chat History

All previous queries and responses are preserved and displayed below the current chat interface.

---

## API Documentation

### Authentication Endpoints

**POST** `/auth/register`
- Register a new user
- Body: `{ "email": "user@example.com", "password": "password", "full_name": "Name" }`

**POST** `/auth/login`
- Authenticate user and receive JWT token
- Body: `{ "email": "user@example.com", "password": "password" }`

### Document Endpoints

**POST** `/upload`
- Upload a legal document
- Headers: `Authorization: Bearer <token>`
- Body: Multipart form data with file

**GET** `/documents`
- List all user documents
- Headers: `Authorization: Bearer <token>`

**GET** `/documents/{document_id}/history`
- Get query history for a document
- Headers: `Authorization: Bearer <token>`

### Query Endpoints

**POST** `/query`
- Submit a query about a document
- Headers: `Authorization: Bearer <token>`
- Body: `{ "document_id": 1, "question": "What are the key terms?" }`

For complete API documentation, visit the FastAPI Swagger UI at each service's `/docs` endpoint.

---

## Project Structure

```
NyayaAI/
├── frontend/                  # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # Context providers
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── services/
│   ├── auth-service/         # Authentication microservice
│   ├── upload-service/       # Document upload microservice
│   ├── embedding-service/    # Document processing microservice
│   ├── query-service/        # Query processing microservice
│   └── response-service/     # Response handling microservice
├── infrastructure/           # Infrastructure configurations
│   ├── kafka/
│   ├── postgres/
│   └── vector-db/
├── kubernetes/               # Kubernetes manifests
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Docker composition
└── README.md
```

---

## Development

### Local Development Setup

**Frontend Development**:
```bash
cd frontend
npm install
npm start
```

**Backend Service Development**:
```bash
cd services/<service-name>
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port <port>
```

### Running Tests

```bash
# Backend tests
cd services/<service-name>
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

The project follows Python PEP 8 style guidelines and uses:
- **Black**: Code formatting
- **Flake8**: Linting
- **mypy**: Type checking

---

## Deployment

### Docker Deployment

Production deployment using Docker:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

Kubernetes manifests are available in the `kubernetes/` directory:

```bash
kubectl apply -f kubernetes/
```

### Environment-Specific Configuration

Ensure all environment variables are properly configured for the target environment, especially:
- Database connection strings
- API keys
- Service endpoints
- CORS origins

---

## Contributing

We welcome contributions to NyayaAI. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

**IMPORTANT**: NyayaAI is designed for legal awareness and educational purposes only. It is **NOT** a substitute for professional legal advice. 

- The system's responses are generated by AI and may contain errors or inaccuracies
- Users should always consult with qualified legal professionals for legal matters
- The developers assume no liability for decisions made based on system output
- This tool does not create an attorney-client relationship

**Use at your own discretion and always verify critical information with legal experts.**

---

## Support

For issues, questions, or contributions:
- **Issues**: [GitHub Issues](https://github.com/AswinRaj1123/NyayaAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AswinRaj1123/NyayaAI/discussions)

---

**Developed with care for legal awareness and accessibility.**