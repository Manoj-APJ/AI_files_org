// Gemini API Configuration
// Make sure this is your proper Gemini API key with proper permissions
export const GEMINI_API_KEY = 'Gemini_Api_kEY';

// Validate API key format
if (!GEMINI_API_KEY) {
  console.error('Gemini API key is not set. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
} else if (!GEMINI_API_KEY.startsWith('AIza')) {
  console.error('Invalid Gemini API key format. Key should start with "AIza".');
}

// Configuration for the Gemini API
export const GEMINI_CONFIG = {
  // Using the correct model name for Gemini Pro
  MODEL: 'gemini-pro',
  MAX_OUTPUT_TOKENS: 2048, // Increased token limit for better responses
  TEMPERATURE: 0.4,
  TIMEOUT_MS: 60000 // 60 second timeout
}; 
