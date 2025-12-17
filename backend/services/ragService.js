const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { generateEmbedding } = require('./embeddings');
const { supabaseAdmin } = require('../config/supabase');

// Initialize LangChain OpenAI client
let llm = null;

function getLLM() {
  if (!llm) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for Q&A functionality');
    }
    llm = new ChatOpenAI({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  return llm;
}

/**
 * Retrieve relevant chunks for a query using vector similarity search
 */
async function retrieveRelevantChunks(query, userId, limit = 5) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search using pgvector
    const { data, error } = await supabaseAdmin.rpc('match_pdf_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit,
      user_id: userId,
    });

    if (error) {
      // If RPC function doesn't exist, fall back to direct query
      console.warn('RPC function not found, using direct query');
      return await retrieveChunksDirect(queryEmbedding, userId, limit);
    }

    return data || [];
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    throw error;
  }
}

/**
 * Fallback: Direct query for relevant chunks
 */
async function retrieveChunksDirect(queryEmbedding, userId, limit) {
  const { data, error } = await supabaseAdmin
    .from('pdf_chunks')
    .select(`
      id,
      content,
      chunk_index,
      page_number,
      pdf_id,
      pdfs!inner(user_id, filename)
    `)
    .eq('pdfs.user_id', userId)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to retrieve chunks: ${error.message}`);
  }

  // Calculate similarity manually (fallback)
  // In production, use pgvector's built-in similarity functions
  return data.map(chunk => ({
    ...chunk,
    similarity: 0.8, // Placeholder
  }));
}

/**
 * Answer a question using RAG (Retrieval Augmented Generation)
 */
async function answerQuestion(question, userId) {
  try {
    // Retrieve relevant context
    const relevantChunks = await retrieveRelevantChunks(question, userId, 5);

    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in your PDFs to answer this question.",
        sources: [],
      };
    }

    // Combine chunks into context
    const context = relevantChunks
      .map((chunk, idx) => `[Document ${idx + 1}]\n${chunk.content}`)
      .join('\n\n');

    // Create prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful assistant that answers questions based on the provided PDF document context.
Use only the information from the context to answer the question. If the answer is not in the context, say so.

Context:
{context}

Question: {question}

Answer:
`);

    // Create chain
    const chain = RunnableSequence.from([
      promptTemplate,
      getLLM(),
      new StringOutputParser(),
    ]);

    // Generate answer
    const answer = await chain.invoke({
      context,
      question,
    });

    // Extract sources
    const sources = relevantChunks.map(chunk => ({
      pdfId: chunk.pdf_id,
      filename: chunk.pdfs?.filename || 'Unknown',
      pageNumber: chunk.page_number,
      chunkIndex: chunk.chunk_index,
    }));

    return {
      answer,
      sources,
    };
  } catch (error) {
    console.error('Error in RAG Q&A:', error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

module.exports = {
  answerQuestion,
  retrieveRelevantChunks,
};

