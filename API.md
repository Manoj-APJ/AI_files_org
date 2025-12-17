# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Authentication

#### Sign Up

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt-token"
}
```

---

### PDF Management

#### Upload PDF

```http
POST /api/pdfs/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

pdf: <file>
```

**Response:**
```json
{
  "message": "PDF uploaded and processed successfully",
  "pdf": {
    "id": "uuid",
    "filename": "document.pdf",
    "pageCount": 10,
    "chunkCount": 25,
    "fileUrl": "https://..."
  }
}
```

**Notes:**
- Maximum file size: 50MB
- Only PDF files accepted
- Processing includes: text extraction, chunking, embedding generation, tagging

#### List PDFs

```http
GET /api/pdfs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pdfs": [
    {
      "id": "uuid",
      "original_filename": "document.pdf",
      "file_size": 1024000,
      "upload_date": "2024-01-01T00:00:00Z",
      "page_count": 10,
      "tags": [
        {
          "tag_name": "research paper",
          "confidence": 0.85
        }
      ]
    }
  ]
}
```

#### Delete PDF

```http
DELETE /api/pdfs/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "PDF deleted successfully"
}
```

---

### Semantic Search

#### Search PDFs

```http
POST /api/search/semantic
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "financial information",
  "limit": 10
}
```

**Response:**
```json
{
  "query": "financial information",
  "results": [
    {
      "pdf": {
        "id": "uuid",
        "filename": "document.pdf",
        "originalFilename": "document.pdf"
      },
      "relevanceScore": 0.87,
      "matchingChunks": 3,
      "preview": "The financial statements show..."
    }
  ],
  "totalResults": 5
}
```

**Notes:**
- Uses vector similarity search (not keyword matching)
- Results ranked by semantic similarity
- Relevance score: 0.0 to 1.0

---

### Q&A

#### Ask Question

```http
POST /api/qa/ask
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What is the main conclusion?"
}
```

**Response:**
```json
{
  "question": "What is the main conclusion?",
  "answer": "Based on the provided documents, the main conclusion is...",
  "sources": [
    {
      "pdfId": "uuid",
      "filename": "document.pdf",
      "pageNumber": 5,
      "chunkIndex": 12
    }
  ]
}
```

**Notes:**
- Requires OpenAI API key
- Uses RAG (Retrieval Augmented Generation)
- Answers based only on user's PDFs
- Includes source citations

---

### Health Check

#### Health Status

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "AI PDF Organizer API is running"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**400 Bad Request:**
```json
{
  "error": "Email and password are required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to upload PDF"
}
```

---

## Example Usage

### cURL Examples

**Sign Up:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Upload PDF:**
```bash
curl -X POST http://localhost:5000/api/pdfs/upload \
  -H "Authorization: Bearer <token>" \
  -F "pdf=@document.pdf"
```

**Search:**
```bash
curl -X POST http://localhost:5000/api/search/semantic \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"research methodology","limit":5}'
```

**Ask Question:**
```bash
curl -X POST http://localhost:5000/api/qa/ask \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the key findings?"}'
```

### JavaScript/React Example

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

// Upload PDF
const formData = new FormData();
formData.append('pdf', file);

const response = await axios.post(`${API_BASE}/pdfs/upload`, formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  },
});

// Search
const searchResponse = await axios.post(
  `${API_BASE}/search/semantic`,
  { query: 'financial data', limit: 10 },
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// Ask Question
const qaResponse = await axios.post(
  `${API_BASE}/qa/ask`,
  { question: 'What is the summary?' },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

## Rate Limiting

Currently not implemented. Consider adding:
- Per-user rate limits
- Per-endpoint limits
- IP-based throttling

## Pagination

Currently not implemented. Consider adding:
- Limit/offset parameters
- Cursor-based pagination for large result sets

