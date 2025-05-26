import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GEMINI_CONFIG } from '../config/gemini';

export class GeminiService {
  private static instance: GeminiService;
  private model: any;
  private textSplitter: RecursiveCharacterTextSplitter;
  private pdfContent: string = '';
  private conversationHistory: Array<{ role: 'human' | 'ai', content: string }> = [];
  private maxHistoryLength: number = 10;
  private processingState: 'idle' | 'processing' | 'error' = 'idle';
  private lastError: string | null = null;
  private apiKey: string;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
    try {
      // Initialize the Google Generative AI client with the API key
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Use configuration from config file
      this.model = genAI.getGenerativeModel({
        model: GEMINI_CONFIG.MODEL,
        generationConfig: {
          temperature: GEMINI_CONFIG.TEMPERATURE,
          maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
        }
      });
      
      console.log("Gemini API initialized successfully with model:", GEMINI_CONFIG.MODEL);
    } catch (error) {
      console.error("Error initializing Gemini API:", error);
      throw new Error("Failed to initialize Gemini API. Please check your API key and configuration.");
    }
    
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 400,
      separators: ['\n\n', '\n', ' ', '']
    });
  }

  public static getInstance(apiKey: string): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService(apiKey);
    }
    return GeminiService.instance;
  }

  public getProcessingState(): 'idle' | 'processing' | 'error' {
    return this.processingState;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public async setPDFContent(pdfText: string): Promise<void> {
    try {
      this.processingState = 'processing';
      
      // Validate PDF text
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('PDF text is empty or invalid');
      }
      
      console.log("Processing PDF content, length:", pdfText.length);
      
      // Clean and normalize the text
      const cleanedText = pdfText
        .replace(/\s+/g, ' ')
        .trim();
      
      // For v1beta, we'll keep it simple - just use the first part of the document 
      // to avoid token limit issues with Gemini Pro
      const MAX_CHARS = 60000; // Safe limit for Gemini API
      
      if (cleanedText.length > MAX_CHARS) {
        console.warn(`PDF too large (${cleanedText.length} chars), truncating to ${MAX_CHARS} chars`);
        this.pdfContent = cleanedText.substring(0, MAX_CHARS);
      } else {
        this.pdfContent = cleanedText;
      }
      
      console.log("Processed PDF content length:", this.pdfContent.length);
      
      this.clearConversationHistory();
      this.processingState = 'idle';
    } catch (error) {
      console.error('Error processing PDF content:', error);
      this.processingState = 'error';
      this.lastError = 'Failed to process PDF content';
      throw new Error('Failed to process PDF content');
    }
  }

  public async chat(question: string): Promise<string> {
    try {
      this.processingState = 'processing';
      
      if (!this.pdfContent) {
        throw new Error('No PDF has been loaded. Please load a PDF first.');
      }

      console.log("Sending question to Gemini API:", question);

      // Simple approach with direct text prompt
      try {
        // Create a simple prompt with the document and question
        // Limit content length to avoid token limits
        const maxContentLength = 30000;
        const truncatedContent = this.pdfContent.length > maxContentLength 
          ? this.pdfContent.substring(0, maxContentLength) + "... [Content truncated due to length]"
          : this.pdfContent;
        
        const prompt = `
Document content:
${truncatedContent}

Question: ${question}

Please answer the question based only on the document content above. 
If you cannot find the answer in the document, say so clearly.`;

        console.log(`Sending prompt (length: ${prompt.length} chars)`);
        
        // Call the API
        const result = await this.model.generateContent(prompt);
        
        if (!result || !result.response) {
          throw new Error("Empty response from Gemini API");
        }
        
        const responseText = result.response.text();
        console.log("Received response from Gemini API");
        
        // Store conversation for context
        this.addToConversationHistory('human', question);
        this.addToConversationHistory('ai', responseText);
        
        this.processingState = 'idle';
        return responseText;
      } catch (error: any) {
        console.error("API error:", error.message);
        
        // Handle specific API errors
        if (error.message.includes("404") || error.message.includes("not found")) {
          throw new Error("The Gemini API model is not available. Please check your configuration.");
        } else if (error.message.includes("401") || error.message.includes("403")) {
          throw new Error("Invalid API key or insufficient permissions. Please check your API key.");
        } else if (error.message.includes("too long") || error.message.includes("token") || error.message.includes("limit")) {
          console.log("Retrying with shorter content...");
          
          // Try with much shorter content
          const shorterPrompt = `
Document excerpt:
${this.pdfContent.substring(0, 10000)}... [Content truncated]

Question: ${question}

Please answer based on this excerpt from the document. 
If you cannot find the answer in this excerpt, say so clearly.`;
          
          const result = await this.model.generateContent(shorterPrompt);
          const responseText = result.response.text();
          
          console.log("Received response with shorter content");
          
          // Store conversation for context
          this.addToConversationHistory('human', question);
          this.addToConversationHistory('ai', responseText);
          
          this.processingState = 'idle';
          return responseText;
        }
        
        // If it's another error, rethrow it with a more descriptive message
        throw new Error(`API request failed: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in Gemini chat:', error);
      this.processingState = 'error';
      this.lastError = error.message || 'Failed to process chat request. Please try again.';
      throw new Error(this.lastError || 'Failed to process chat request. Please try again.');
    }
  }

  private getConversationContext(): string {
    if (this.conversationHistory.length === 0) return '';
    
    return this.conversationHistory
      .map(msg => `${msg.role === 'human' ? 'Human' : 'AI'}: ${msg.content}`)
      .join('\n');
  }

  private addToConversationHistory(role: 'human' | 'ai', content: string): void {
    this.conversationHistory.push({ role, content });
    
    // Maintain max history length
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  public getConversationHistory(): Array<{ role: 'human' | 'ai', content: string }> {
    return [...this.conversationHistory];
  }

  public clearConversationHistory(): void {
    this.conversationHistory = [];
  }
} 