const { generateEmbedding } = require('./embeddings');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Common document categories/tags based on content analysis
 * This is a simplified approach - in production, you might use an LLM to generate tags
 */
const TAG_CATEGORIES = [
  'research paper',
  'invoice',
  'contract',
  'report',
  'manual',
  'presentation',
  'form',
  'letter',
  'receipt',
  'certificate',
  'financial statement',
  'legal document',
  'medical record',
  'educational material',
  'technical documentation',
];

/**
 * Generate semantic tags for a PDF based on its content
 * Uses embedding similarity to match content against predefined categories
 */
async function generateTagsForPDF(pdfId, content) {
  try {
    // Generate embedding for the PDF content (first 1000 chars as summary)
    const summary = content.substring(0, 1000);
    const contentEmbedding = await generateEmbedding(summary);

    // Generate embeddings for all tag categories
    const categoryEmbeddings = await Promise.all(
      TAG_CATEGORIES.map(cat => generateEmbedding(cat))
    );

    // Calculate cosine similarity between content and each category
    const similarities = categoryEmbeddings.map((catEmbedding, index) => {
      const similarity = cosineSimilarity(contentEmbedding, catEmbedding);
      return {
        tag: TAG_CATEGORIES[index],
        similarity,
      };
    });

    // Select top 3 tags with similarity > 0.3
    const topTags = similarities
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => ({
        pdf_id: pdfId,
        tag_name: item.tag,
        confidence: Math.round(item.similarity * 100) / 100,
      }));

    // Store tags in database
    if (topTags.length > 0) {
      const { error } = await supabaseAdmin
        .from('tags')
        .upsert(topTags, { onConflict: 'pdf_id,tag_name' });

      if (error) {
        console.error('Error storing tags:', error);
      }
    }

    return topTags;
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  generateTagsForPDF,
};

