-- RPC function for vector similarity search
-- This function performs efficient vector similarity search using pgvector

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS match_pdf_chunks(vector, float, int, uuid);

CREATE OR REPLACE FUNCTION match_pdf_chunks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  id uuid,
  pdf_id uuid,
  content text,
  chunk_index int,
  page_number int,
  similarity float,
  filename text,
  original_filename text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.pdf_id,
    pc.content,
    pc.chunk_index,
    pc.page_number,
    1 - (pc.embedding <=> query_embedding) as similarity,
    p.filename,
    p.original_filename
  FROM pdf_chunks pc
  INNER JOIN pdfs p ON pc.pdf_id = p.id
  WHERE p.user_id = match_pdf_chunks.user_id
    AND pc.embedding IS NOT NULL
    AND 1 - (pc.embedding <=> query_embedding) > match_threshold
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_pdf_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_pdf_chunks TO anon;

