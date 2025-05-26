import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { GeminiService } from '../lib/gemini-service';
import { GEMINI_API_KEY } from '../config/gemini';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface PDFChatProps {
  extractedText: string;
  isProcessing?: boolean;
}

const PDFChat: React.FC<PDFChatProps> = ({ extractedText, isProcessing = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiService = GeminiService.getInstance(GEMINI_API_KEY);

  // Initialize Gemini service when extracted text changes
  useEffect(() => {
    if (!extractedText || isProcessing) return;

    const initializeService = async () => {
      try {
        setLoading(true);
        setError(null);
        await geminiService.setPDFContent(extractedText);
        setIsApiReady(true);
      } catch (err: any) {
        console.error('Error initializing Gemini service:', err);
        setError(`Failed to process document: ${err.message || 'Unknown error'}`);
        setIsApiReady(false);
      } finally {
        setLoading(false);
      }
    };

    initializeService();
  }, [extractedText, isProcessing]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const retryInitialization = async () => {
    try {
      setLoading(true);
      setError(null);
      await geminiService.setPDFContent(extractedText);
      setIsApiReady(true);
    } catch (err: any) {
      console.error('Error in retry initialization:', err);
      setError(`Failed to initialize: ${err.message || 'Unknown error'}`);
      setIsApiReady(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !isApiReady) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      console.log("Sending chat request to Gemini API...");
      const response = await geminiService.chat(input.trim());
      console.log("Received successful response");
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I couldn't generate a response. Please try asking a different question.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error generating response:', err);
      
      // Extract the most relevant error message
      let errorMessage = 'Sorry, I encountered an error processing your question.';
      let technicalError = err.message || 'Unknown error';
      
      // Handle API version errors
      if (err.message && err.message.includes('404') && err.message.includes('not found for API version')) {
        errorMessage = 'There seems to be an API configuration issue. Please check your API key and model settings.';
        technicalError = 'API version mismatch: Model not available in the specified API version';
        
        // Try to reinitialize with different API version
        setIsApiReady(false);
      }
      else if (err.message && err.message.includes('Failed to process chat request')) {
        errorMessage = 'Sorry, I had trouble understanding the document. Please try a more specific question or upload a shorter document.';
      } else if (err.message && err.message.includes('400')) {
        errorMessage = 'Sorry, your question may contain content that cannot be processed. Please rephrase your question.';
      } else if (err.message && err.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (err.message && err.message.includes('500')) {
        errorMessage = 'Sorry, the service is experiencing issues. Please try again later.';
      }
      
      // Add a failed response message
      const errorResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponseMessage]);
      setError(`API Error: ${technicalError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
            {!isApiReady && (
              <button 
                onClick={retryInitialization}
                className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* API Status indicator */}
      {!isApiReady && !loading && !error && (
        <div className="bg-yellow-50 p-4 mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-700">API is not ready. Please wait or try to initialize again.</span>
            <button 
              onClick={retryInitialization}
              className="ml-auto px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Initialize</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-md">
              <h3 className="font-medium text-lg mb-2">Chat with your PDF</h3>
              <p className="mb-4">Ask questions about the document content and get AI-powered answers.</p>
              <div className="text-sm bg-gray-100 p-3 rounded-lg">
                <p className="font-medium">Tips:</p>
                <ul className="list-disc list-inside mt-1 text-left">
                  <li>Ask specific questions about the content</li>
                  <li>Refer to particular sections or topics</li>
                  <li>Use simple, clear language</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !isApiReady 
                ? "API not ready yet..." 
                : loading 
                  ? "Waiting for response..." 
                  : "Ask a question about the document..."
            }
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || !isApiReady}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !isApiReady}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PDFChat; 