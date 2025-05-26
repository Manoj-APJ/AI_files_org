import React, { useState, useRef, useEffect } from 'react';
import { Copy, Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import ExportOptionsMenu from './ExportOptionsMenu';

interface ExtractedTextViewerProps {
  text: string;
}

const ExtractedTextViewer: React.FC<ExtractedTextViewerProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim() || !text) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }
    
    // Find all occurrences of the search query
    const query = searchQuery.toLowerCase();
    const textLower = text.toLowerCase();
    const results: number[] = [];
    let index = textLower.indexOf(query);
    
    while (index !== -1) {
      results.push(index);
      index = textLower.indexOf(query, index + 1);
    }
    
    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
    
    // Scroll to the first result if found
    if (results.length > 0) {
      scrollToResult(0);
    }
  }, [searchQuery, text]);
  
  const scrollToResult = (resultIndex: number) => {
    if (!textRef.current || searchResults.length === 0) return;
    
    const textContainer = textRef.current;
    const textContent = text;
    
    const startIndex = searchResults[resultIndex];
    const searchWord = textContent.substr(startIndex, searchQuery.length);
    
    // Create temporary hidden elements to measure position
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.wordBreak = 'break-word';
    tempDiv.style.width = `${textContainer.clientWidth}px`;
    tempDiv.style.font = window.getComputedStyle(textContainer).font;
    
    // Text before the result
    const textBefore = textContent.substring(0, startIndex);
    tempDiv.textContent = textBefore;
    document.body.appendChild(tempDiv);
    
    // Calculate scroll position
    const scrollPosition = tempDiv.clientHeight;
    document.body.removeChild(tempDiv);
    
    // Scroll to the result with some offset
    textContainer.scrollTop = scrollPosition - 120;
    
    setCurrentResultIndex(resultIndex);
  };
  
  const highlightSearchResults = (content: string) => {
    if (!searchQuery.trim() || searchResults.length === 0) {
      return <pre className="whitespace-pre-wrap">{content}</pre>;
    }
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Sort search results to process them in order
    const sortedResults = [...searchResults].sort((a, b) => a - b);
    
    sortedResults.forEach((index, i) => {
      // Add text before the match
      if (index > lastIndex) {
        parts.push(content.substring(lastIndex, index));
      }
      
      // Add the highlighted match
      const isCurrentMatch = index === searchResults[currentResultIndex];
      parts.push(
        <span 
          key={`highlight-${i}`} 
          className={`px-0.5 rounded ${
            isCurrentMatch 
              ? 'bg-brand-yellow-400 text-brand-gray-900 font-medium'
              : 'bg-brand-yellow-400/30 text-brand-yellow-400'
          }`}
        >
          {content.substr(index, searchQuery.length)}
        </span>
      );
      
      // Update last index
      lastIndex = index + searchQuery.length;
    });
    
    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return <pre className="whitespace-pre-wrap">{parts}</pre>;
  };
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Go to previous result with Shift+Enter
        handlePreviousResult();
      } else {
        // Go to next result with Enter
        handleNextResult();
      }
    }
  };
  
  const handleNextResult = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    scrollToResult(nextIndex);
  };
  
  const handlePreviousResult = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    scrollToResult(prevIndex);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-gray-900 rounded-lg border border-brand-gray-700 overflow-hidden">
      {/* Header toolbar */}
      <div className="flex justify-between items-center p-3 bg-brand-gray-800 border-b border-brand-gray-700">
        <h3 className="text-lg font-medium text-brand-yellow-400">Extracted Text</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleCopyText}
            className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700 flex items-center text-sm transition"
            title="Copy text to clipboard"
          >
            <Copy className="h-4 w-4 mr-1" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <ExportOptionsMenu text={text} />
        </div>
      </div>
      
      {/* Search bar */}
      <div className="p-2 bg-brand-gray-800 border-b border-brand-gray-700 flex items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-brand-gray-500" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search in text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-10 py-1.5 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-brand-gray-200 placeholder-brand-gray-500 focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-gray-400 hover:text-brand-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="flex items-center ml-2">
            <span className="text-sm text-brand-gray-400 mr-2">
              {currentResultIndex + 1} of {searchResults.length}
            </span>
            <button
              onClick={handlePreviousResult}
              className="p-1 text-brand-gray-400 hover:text-brand-yellow-400"
              title="Previous match"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextResult}
              className="p-1 text-brand-gray-400 hover:text-brand-yellow-400"
              title="Next match"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Text content */}
      <div 
        ref={textRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm text-brand-gray-300 bg-brand-gray-900"
      >
        {highlightSearchResults(text)}
      </div>
    </div>
  );
};

export default ExtractedTextViewer; 