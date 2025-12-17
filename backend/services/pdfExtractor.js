const pdf = require('pdf-parse');

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await pdf(pdfBuffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info || {},
    };
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Split text into chunks for embedding
 * Uses a simple approach: split by sentences, then group into chunks of ~500 tokens
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
  // Split by sentences (simple approach)
  const sentences = text
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.split(/\s+/).length; // Approximate token count

    if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.join('. ') + '.',
        tokenCount: currentLength,
      });

      // Start new chunk with overlap (keep last few sentences)
      const overlapSentences = currentChunk.slice(-Math.ceil(overlap / 20));
      currentChunk = overlapSentences;
      currentLength = overlapSentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    }

    currentChunk.push(sentence);
    currentLength += sentenceLength;
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('. ') + '.',
      tokenCount: currentLength,
    });
  }

  return chunks;
}

module.exports = {
  extractTextFromPDF,
  chunkText,
};

