# AI-Powered PDF Files Organizer

A production-ready system that allows users to upload PDFs and organize, search, and query them using AI-powered semantic search and Q&A capabilities.

## 🎯 Features

- **Authentication**: Secure user signup/login with JWT
- **PDF Upload & Storage**: Upload PDFs to Supabase Storage with metadata tracking
- **Text Extraction**: Automatic text extraction and intelligent chunking
- **AI Auto-Tagging**: Semantic tag generation from PDF content
- **Semantic Search**: Vector similarity search using pgvector (not keyword matching)
- **AI Q&A (RAG)**: Ask questions and get context-aware answers from your PDFs

## 🏗️ Architecture

### Tech Stack

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL + Storage)
- **Auth**: JWT
- **AI Orchestration**: LangChain
- **Embeddings**: Xenova Transformers (local, all-MiniLM-L6-v2)
- **Vector Search**: pgvector in Supabase
- **Frontend**: React

### Project Structure

```
.
├── backend/
│   ├── config/
│   │   ├── supabase.js          # Supabase client configuration
│   │   ├── database.sql          # Database schema
│   │   └── supabase_functions.sql # pgvector RPC functions
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── pdfs.js               # PDF upload/management routes
│   │   ├── search.js             # Semantic search routes
│   │   └── qa.js                 # Q&A routes
│   ├── services/
│   │   ├── pdfExtractor.js       # PDF text extraction & chunking
│   │   ├── embeddings.js         # Embedding generation (Xenova)
│   │   ├── aiTagging.js          # AI tag generation
│   │   └── ragService.js         # RAG Q&A service (LangChain)
│   └── server.js                 # Express server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js                # Main React component
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── .env.example                  # Environment variables template
└── README.md

```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (for Q&A functionality)

### 1. Clone and Install

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### 2. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run `backend/config/database.sql` to create tables
3. Run `backend/config/supabase_functions.sql` to create the vector search function
4. Enable pgvector extension in your Supabase project:
   - Go to Database → Extensions
   - Enable `vector` extension

5. Create a storage bucket named `pdfs`:
   - Go to Storage → Create bucket
   - Name: `pdfs`
   - Public: No (private bucket)
   - Enable RLS policies

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration (for LangChain Q&A)
OPENAI_API_KEY=sk-your-openai-api-key
```

Get your Supabase keys from:
- Project Settings → API → Project URL (SUPABASE_URL)
- Project Settings → API → anon/public key (SUPABASE_ANON_KEY)
- Project Settings → API → service_role key (SUPABASE_SERVICE_ROLE_KEY)

### 4. Run the Application

```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately:
npm run server    # Backend on http://localhost:5000
npm run client    # Frontend on http://localhost:3000
```

## 📡 API Flow

### Authentication Flow

1. **Signup**: `POST /api/auth/signup`
   - Creates user with hashed password
   - Returns JWT token

2. **Login**: `POST /api/auth/login`
   - Validates credentials
   - Returns JWT token

3. **Protected Routes**: Include `Authorization: Bearer <token>` header

### PDF Upload Flow

1. **Upload**: `POST /api/pdfs/upload` (multipart/form-data)
   - Extracts text from PDF
   - Chunks content intelligently
   - Generates embeddings for each chunk
   - Stores chunks + embeddings in database
   - Generates AI tags
   - Uploads file to Supabase Storage

2. **List PDFs**: `GET /api/pdfs`
   - Returns all PDFs for authenticated user with tags

### Semantic Search Flow

1. **Search**: `POST /api/search/semantic`
   - Converts query to embedding
   - Performs vector similarity search using pgvector
   - Returns relevant PDFs ranked by similarity

### Q&A Flow (RAG)

1. **Ask Question**: `POST /api/qa/ask`
   - Converts question to embedding
   - Retrieves relevant chunks using vector search
   - Passes context to LLM via LangChain
   - Returns answer with source citations

## 🗄️ Database Schema

### Tables

- **users**: User accounts (id, email, password_hash)
- **pdfs**: PDF metadata (id, user_id, filename, file_path, page_count)
- **pdf_chunks**: Text chunks with embeddings (id, pdf_id, content, embedding vector(384))
- **tags**: AI-generated tags (id, pdf_id, tag_name, confidence)

### Vector Search

- Uses pgvector extension for efficient similarity search
- Embeddings are 384-dimensional (all-MiniLM-L6-v2 model)
- HNSW index for fast approximate nearest neighbor search

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Row Level Security (RLS) policies in Supabase
- User isolation (users can only access their own PDFs)
- File type validation (PDF only)
- File size limits (50MB)

## 🧠 AI Components

### Embeddings

- **Model**: Xenova/all-MiniLM-L6-v2 (384 dimensions)
- **Usage**: Local inference, no API calls
- **Purpose**: Convert text to vectors for semantic search

### Tagging

- Uses embedding similarity to match content against predefined categories
- Generates top 3 tags with confidence scores

### Q&A (RAG)

- **Retrieval**: Vector similarity search to find relevant chunks
- **Generation**: LangChain + OpenAI GPT-3.5-turbo
- **Context**: Only uses information from user's PDFs

## 🎨 Frontend

Simple, functional React UI with:
- Authentication (signup/login)
- PDF upload with drag-and-drop
- Semantic search interface
- Q&A chat interface
- PDF list with tags

## 🧪 Testing the System

1. **Sign up** with a new account
2. **Upload a PDF** (e.g., a research paper, invoice, or document)
3. **Wait for processing** (embeddings generation takes a few seconds)
4. **Search semantically**: Try queries like "financial information" or "research methodology"
5. **Ask questions**: "What is the main conclusion?" or "Summarize the key points"

## 📝 Notes

- First PDF upload may take longer due to model loading
- Embeddings are generated locally (no external API needed)
- Q&A requires OpenAI API key
- Vector search uses pgvector's cosine similarity
- Chunks are ~500 tokens with 50-token overlap

## 🚧 Production Considerations

- Use environment-specific `.env` files
- Set up proper error logging (e.g., Winston)
- Add rate limiting
- Implement file virus scanning
- Add monitoring and analytics
- Consider caching for frequently accessed PDFs
- Optimize embedding generation with batching
- Add pagination for large result sets

## 📄 License

MIT

