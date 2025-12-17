# Semantic Search Fixes

## Issues Fixed

### 1. Embedding Format Handling
- **Problem**: Embeddings might not be in the correct format for pgvector
- **Fix**: Added validation to ensure embeddings are proper arrays (384 dimensions)
- **Location**: `backend/routes/search.js`

### 2. Fallback Search Improvements
- **Problem**: Fallback search was limited to 100 chunks and had high threshold
- **Fix**: 
  - Increased limit to 500 chunks
  - Lowered similarity threshold to 0.2 (from 0.3)
  - Better handling of embedding format (array vs string)
  - Improved error handling
- **Location**: `backend/routes/search.js` - `performDirectSearch` function

### 3. RPC Function Error Handling
- **Problem**: RPC function errors weren't gracefully handled
- **Fix**: Added try-catch with fallback to direct search
- **Location**: `backend/routes/search.js`

### 4. Search Result Grouping
- **Problem**: Results weren't properly grouped by PDF
- **Fix**: Improved grouping logic with better similarity tracking
- **Location**: `backend/routes/search.js`

## Testing Semantic Search

### 1. Verify Embeddings are Stored
```sql
SELECT COUNT(*) FROM pdf_chunks WHERE embedding IS NOT NULL;
```

### 2. Test RPC Function
```sql
-- Get a sample embedding
SELECT embedding FROM pdf_chunks LIMIT 1;

-- Test the function (replace with actual embedding array)
SELECT * FROM match_pdf_chunks(
  '[0.1,0.2,...]'::vector(384),
  0.2,
  10,
  'user-uuid-here'
);
```

### 3. Check Search Endpoint
```bash
curl -X POST http://localhost:5000/api/search/semantic \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"financial information","limit":5}'
```

## Common Issues

### No Results Returned
1. Check if embeddings exist: `SELECT COUNT(*) FROM pdf_chunks WHERE embedding IS NOT NULL;`
2. Lower the threshold in search (currently 0.2)
3. Verify RPC function exists: `\df match_pdf_chunks` in psql
4. Check if fallback search works (check console logs)

### Low Relevance Scores
- This is normal - semantic similarity scores are typically lower than keyword matching
- Scores above 0.3 are considered good matches
- Scores 0.2-0.3 are moderate matches
- Adjust threshold based on your needs

### RPC Function Not Found
- Run `backend/config/supabase_functions.sql` in Supabase SQL Editor
- Verify function exists: `SELECT proname FROM pg_proc WHERE proname = 'match_pdf_chunks';`

## Performance Tips

1. **Index**: Ensure HNSW index exists on embedding column
2. **Chunk Size**: Current chunk size (~500 tokens) is optimal
3. **Batch Size**: Embedding generation uses batches of 10
4. **Threshold**: Lower threshold (0.2) gives more results but may include less relevant matches

## Next Steps

If search still doesn't work well:
1. Check embedding generation is working correctly
2. Verify embeddings are being stored in database
3. Test with a simple query first
4. Check console logs for errors
5. Try the fallback search (it should work even if RPC fails)

