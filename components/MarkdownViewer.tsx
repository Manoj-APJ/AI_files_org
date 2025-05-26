import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { Annotation } from '../types';

interface MarkdownViewerProps {
  content: string;
  annotations?: Annotation[];
  highlightMode: boolean;
  onAddAnnotation: (annotation: Annotation) => void;
  onSelectAnnotation: (annotation: Annotation | null) => void;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  annotations = [],
  highlightMode,
  onAddAnnotation,
  onSelectAnnotation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState<{ x: number; y: number } | null>(null);

  const handleTextSelection = () => {
    if (!highlightMode) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const text = selection.toString().trim();
    if (!text) return;
    
    setSelectedText(text);
    
    // Get position of the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setAnnotationPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top
      });
    }
  };

  const handleAddAnnotation = () => {
    if (!selectedText || !annotationText || !annotationPosition) return;
    
    const newAnnotation: Annotation = {
      id: uuidv4(),
      text: selectedText,
      content: annotationText,
      color: 'yellow',
      position: annotationPosition,
      createdAt: new Date()
    };
    
    onAddAnnotation(newAnnotation);
    setSelectedText('');
    setAnnotationText('');
    setAnnotationPosition(null);
  };

  const handleCancelAnnotation = () => {
    setSelectedText('');
    setAnnotationText('');
    setAnnotationPosition(null);
  };

  // Apply highlights to the content
  useEffect(() => {
    if (!containerRef.current || !annotations || annotations.length === 0) return;
    
    const container = containerRef.current;
    const textNodes = [];
    
    // Helper function to get all text nodes
    function getTextNodes(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          getTextNodes(node.childNodes[i]);
        }
      }
    }
    
    getTextNodes(container);
    
    // For each annotation, find and highlight the text
    annotations.forEach(annotation => {
      const text = annotation.text;
      
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const content = node.textContent || '';
        const index = content.indexOf(text);
        
        if (index !== -1) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + text.length);
          
          const span = document.createElement('span');
          span.className = 'bg-yellow-200 cursor-pointer';
          span.dataset.annotationId = annotation.id;
          span.addEventListener('click', () => onSelectAnnotation(annotation));
          
          range.surroundContents(span);
          break;
        }
      }
    });
    
    // Cleanup function
    return () => {
      const highlights = container.querySelectorAll('span.bg-yellow-200');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
          while (highlight.firstChild) {
            parent.insertBefore(highlight.firstChild, highlight);
          }
          parent.removeChild(highlight);
        }
      });
    };
  }, [annotations, onSelectAnnotation]);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="prose max-w-none p-6"
        onMouseUp={handleTextSelection}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      
      {selectedText && annotationPosition && (
        <div 
          className="absolute bg-white border rounded-lg shadow-lg p-4 z-10"
          style={{
            left: annotationPosition.x,
            top: annotationPosition.y + 20,
            width: '300px'
          }}
        >
          <p className="text-sm font-medium mb-2">Add annotation for:</p>
          <p className="bg-yellow-100 p-2 rounded mb-2 text-sm">"{selectedText}"</p>
          <textarea
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            placeholder="Add your notes here..."
            rows={3}
          ></textarea>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelAnnotation}
              className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAnnotation}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              disabled={!annotationText}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownViewer;