-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDFs table (metadata)
CREATE TABLE IF NOT EXISTS pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF chunks table (for RAG)
CREATE TABLE IF NOT EXISTS pdf_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER,
  embedding vector(384), -- Xenova all-MiniLM-L6-v2 produces 384-dim embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_pdf_chunk UNIQUE (pdf_id, chunk_index)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pdf_id, tag_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_upload_date ON pdfs(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_pdf_id ON pdf_chunks(pdf_id);
CREATE INDEX IF NOT EXISTS idx_tags_pdf_id ON tags(pdf_id);

-- Vector similarity search index (HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_embedding ON pdf_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- PDFs policies
CREATE POLICY "Users can view own PDFs" ON pdfs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDFs" ON pdfs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDFs" ON pdfs
  FOR DELETE USING (auth.uid() = user_id);

-- PDF chunks policies
CREATE POLICY "Users can view own PDF chunks" ON pdf_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pdfs WHERE pdfs.id = pdf_chunks.pdf_id AND pdfs.user_id = auth.uid()
    )
  );

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pdfs WHERE pdfs.id = tags.pdf_id AND pdfs.user_id = auth.uid()
    )
  );

