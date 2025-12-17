const { pipeline } = require('@xenova/transformers');

// Use a lightweight, fast embedding model
// all-MiniLM-L6-v2 produces 384-dimensional embeddings
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let embeddingPipeline = null;

/**
 * Initialize the embedding pipeline (lazy loading)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Loading embedding model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      MODEL_NAME,
      { quantized: false } // Set to true for smaller model size
    );
    console.log('Embedding model loaded');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a text string
 */
async function generateEmbedding(text) {
  try {
    const extractor = await getEmbeddingPipeline();
    
    // Generate embedding
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to array
    const embedding = Array.from(output.data);
    return embedding;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
async function generateEmbeddings(texts) {
  try {
    const extractor = await getEmbeddingPipeline();
    const embeddings = [];

    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text =>
        extractor(text, { pooling: 'mean', normalize: true })
      );
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        embeddings.push(Array.from(result.data));
      });
    }

    return embeddings;
  } catch (error) {
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
};

