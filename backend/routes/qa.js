const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { answerQuestion } = require('../services/ragService');

const router = express.Router();

/**
 * POST /api/qa/ask
 * Ask a question about user's PDFs using RAG
 */
router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`Processing Q&A request for user ${userId}: ${question}`);

    // Use RAG service to answer the question
    const result = await answerQuestion(question, userId);

    res.json({
      question,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error('Q&A error:', error);
    
    if (error.message.includes('OPENAI_API_KEY')) {
      return res.status(500).json({
        error: 'Q&A service is not configured. Please set OPENAI_API_KEY in environment variables.',
      });
    }

    res.status(500).json({ error: error.message || 'Failed to answer question' });
  }
});

module.exports = router;

