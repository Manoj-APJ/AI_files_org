const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { generateEmbedding } = require('../services/embeddings');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

/**
 * POST /api/search/semantic
 * Perform semantic search across user's PDFs
 */
router.post('/semantic', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    const userId = req.user.id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Generate embedding for the search query
    console.log('Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    
    // Ensure embedding is a proper array
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 384) {
      throw new Error('Invalid embedding format');
    }

    // Try RPC function first
    let results = null;
    let searchError = null;
    
    try {
      // Supabase RPC expects embedding as array - it will convert to vector type
      const { data, error } = await supabaseAdmin.rpc('match_pdf_chunks', {
        query_embedding: queryEmbedding, // Pass as array
        match_threshold: 0.2, // Lower threshold for better recall
        match_count: Math.min(limit * 5, 50), // Get more chunks to group by PDF
        user_id: userId,
      });

      if (error) {
        console.warn('RPC error:', error);
        searchError = error;
      } else {
        results = data;
      }
    } catch (rpcError) {
      console.warn('RPC call failed:', rpcError);
      searchError = rpcError;
    }

    // Fallback to direct search if RPC fails
    if (searchError || !results) {
      console.log('Using fallback direct search...');
      return await performDirectSearch(queryEmbedding, userId, limit, res);
    }

    // Group results by PDF and get unique PDFs
    const pdfMap = new Map();
    
    (results || []).forEach(chunk => {
      const pdfId = chunk.pdf_id;
      if (!pdfMap.has(pdfId)) {
        pdfMap.set(pdfId, {
          pdf: {
            id: chunk.pdf_id,
            filename: chunk.pdfs?.filename || chunk.filename || 'Unknown',
            originalFilename: chunk.pdfs?.original_filename || 'Unknown',
          },
          chunks: [],
          maxSimilarity: chunk.similarity || 0,
        });
      }
      
      const pdfData = pdfMap.get(pdfId);
      pdfData.chunks.push({
        content: chunk.content,
        pageNumber: chunk.page_number,
        similarity: chunk.similarity || 0,
      });
      
      if (chunk.similarity > pdfData.maxSimilarity) {
        pdfData.maxSimilarity = chunk.similarity;
      }
    });

    // Convert to array and sort by similarity
    const searchResults = Array.from(pdfMap.values())
      .map(item => ({
        pdf: item.pdf,
        relevanceScore: item.maxSimilarity,
        matchingChunks: item.chunks.length,
        preview: item.chunks[0]?.content.substring(0, 200) || '',
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      query,
      results: searchResults,
      totalResults: searchResults.length,
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: error.message || 'Failed to perform search' });
  }
});

/**
 * Fallback: Direct search using SQL with manual similarity calculation
 */
async function performDirectSearch(queryEmbedding, userId, limit, res) {
  try {
    // Get all user's PDF chunks with embeddings
    // Fetch more chunks to ensure we have enough for similarity calculation
    const { data: chunks, error } = await supabaseAdmin
      .from('pdf_chunks')
      .select(`
        id,
        content,
        chunk_index,
        page_number,
        embedding,
        pdf_id,
        pdfs!inner (
          id,
          original_filename,
          filename,
          user_id
        )
      `)
      .eq('pdfs.user_id', userId)
      .not('embedding', 'is', null)
      .limit(500); // Increased limit for better results

    if (error) {
      throw error;
    }

    if (!chunks || chunks.length === 0) {
      return res.json({
        query: res.req.body.query,
        results: [],
        totalResults: 0,
      });
    }

    // Calculate cosine similarity manually for all chunks
    const resultsWithSimilarity = chunks
      .map(chunk => {
        if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
          return null;
        }
        
        // Handle both array and string formats
        let embedding = chunk.embedding;
        if (typeof embedding === 'string') {
          try {
            embedding = JSON.parse(embedding);
          } catch (e) {
            return null;
          }
        }
        
        if (!Array.isArray(embedding) || embedding.length !== queryEmbedding.length) {
          return null;
        }
        
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return {
          ...chunk,
          similarity,
        };
      })
      .filter(item => item !== null && item.similarity > 0.2) // Lower threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit * 3); // Get more for grouping

    // Group by PDF
    const pdfMap = new Map();
    resultsWithSimilarity.forEach(chunk => {
      const pdfId = chunk.pdf_id;
      if (!pdfMap.has(pdfId)) {
        pdfMap.set(pdfId, {
          pdf: {
            id: chunk.pdf_id,
            filename: chunk.pdfs?.original_filename || 'Unknown',
          },
          chunks: [],
          maxSimilarity: chunk.similarity,
        });
      }
      
      const pdfData = pdfMap.get(pdfId);
      pdfData.chunks.push({
        content: chunk.content,
        pageNumber: chunk.page_number,
        similarity: chunk.similarity,
      });
    });

    const searchResults = Array.from(pdfMap.values())
      .map(item => ({
        pdf: item.pdf,
        relevanceScore: item.maxSimilarity,
        matchingChunks: item.chunks.length,
        preview: item.chunks[0]?.content.substring(0, 200) || '',
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      query: res.req.body.query,
      results: searchResults,
      totalResults: searchResults.length,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

module.exports = router;

