import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { v4 as uuidv4 } from 'uuid';
import { Annotation } from '../types';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCw, FileText, X, MessageSquare, FileDigit } from 'lucide-react';
import PDFTextExtractor from './PDFTextExtractor';
import ExtractedTextViewer from './ExtractedTextViewer';
import PDFChat from './PDFChat';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  annotations?: Annotation[];
  highlightMode: boolean;
  onAddAnnotation: (annotation: Annotation) => void;
  onSelectAnnotation: (annotation: Annotation | null) => void;
}

type ViewMode = 'pdf' | 'text' | 'chat';

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  annotations = [],
  highlightMode,
  onAddAnnotation,
  onSelectAnnotation
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState<{ x: number; y: number; pageNumber: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  
  // New states for text extraction
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  
  // New state for view mode
  const [viewMode, setViewMode] = useState<ViewMode>('pdf');
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    
    // Set initial scale based on container width
    const container = document.getElementById('pdf-container');
    if (container) {
      setContainerWidth(container.clientWidth);
      const initialScale = Math.min((container.clientWidth - 48) / 612, 1.5); // 612 is standard PDF width
      setScale(initialScale);
    }
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages || 1);
    });
  };

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
    const container = document.getElementById('pdf-container');
    
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setAnnotationPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
        pageNumber
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

  const renderAnnotations = () => {
    if (!annotations || annotations.length === 0) return null;
    
    return annotations
      .filter(annotation => annotation.position.pageNumber === pageNumber)
      .map(annotation => (
        <div
          key={annotation.id}
          className="absolute bg-yellow-200 bg-opacity-50 cursor-pointer transition-all hover:bg-yellow-300"
          style={{
            left: annotation.position.x - 50,
            top: annotation.position.y - 10,
            width: '100px',
            height: '20px'
          }}
          onClick={() => onSelectAnnotation(annotation)}
        ></div>
      ));
  };
  
  // Handle text extraction
  const handleExtractText = () => {
    setIsExtractingText(true);
    setExtractionError(null);
  };
  
  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    setIsExtractingText(false);
    setViewMode('text'); // Automatically switch to text view
  };
  
  const handleExtractionError = (error: string) => {
    setExtractionError(error);
    setIsExtractingText(false);
  };
  
  const cancelTextExtraction = () => {
    setIsExtractingText(false);
    setExtractionError(null);
  };
  
  const closeExtractedText = () => {
    setViewMode('pdf');
    // Keep the extracted text in memory for switching back
  };

  // Render the navigation tabs
  const renderTabs = () => (
    <div className="flex border-b border-brand-gray-700">
      <button
        className={`px-4 py-3 flex items-center text-sm font-medium ${
          viewMode === 'pdf' 
            ? 'text-brand-yellow-400 border-b-2 border-brand-yellow-400' 
            : 'text-brand-gray-400 hover:text-brand-gray-200'
        }`}
        onClick={() => setViewMode('pdf')}
      >
        <FileDigit className="h-4 w-4 mr-2" />
        PDF View
      </button>
      
      <button
        className={`px-4 py-3 flex items-center text-sm font-medium ${
          viewMode === 'text' && extractedText
            ? 'text-brand-yellow-400 border-b-2 border-brand-yellow-400' 
            : 'text-brand-gray-400 hover:text-brand-gray-200'
        } ${!extractedText ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => extractedText && setViewMode('text')}
        disabled={!extractedText}
      >
        <FileText className="h-4 w-4 mr-2" />
        Extracted Text
      </button>
      
      <button
        className={`px-4 py-3 flex items-center text-sm font-medium ${
          viewMode === 'chat' && extractedText
            ? 'text-brand-yellow-400 border-b-2 border-brand-yellow-400' 
            : 'text-brand-gray-400 hover:text-brand-gray-200'
        } ${!extractedText ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => extractedText && setViewMode('chat')}
        disabled={!extractedText}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat with PDF
      </button>
    </div>
  );

  return (
    <div className="relative bg-brand-gray-900 rounded-lg overflow-hidden flex flex-col h-full">
      {isExtractingText ? (
        <PDFTextExtractor
          fileUrl={fileUrl}
          onTextExtracted={handleTextExtracted}
          onError={handleExtractionError}
        />
      ) : (
        <>
          <div className="flex justify-between items-center p-3 bg-brand-gray-800 border-b border-brand-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1 || viewMode !== 'pdf'}
                className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-brand-gray-300">
                {viewMode === 'pdf' ? `Page ${pageNumber} of ${numPages || '?'}` : ''}
              </span>
              <button
                onClick={() => changePage(1)}
                disabled={pageNumber >= (numPages || 1) || viewMode !== 'pdf'}
                className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {viewMode === 'pdf' && (
                <>
                  <button
                    onClick={() => setScale(scale => Math.max(0.5, scale - 0.1))}
                    className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-brand-gray-300 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale(scale => Math.min(2.0, scale + 0.1))}
                    className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setRotation(rotation => (rotation + 90) % 360)}
                    className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
                    title="Rotate"
                  >
                    <RotateCw className="h-5 w-5" />
                  </button>
                </>
              )}
              
              {!extractedText && (
                <button
                  onClick={handleExtractText}
                  className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700 flex items-center"
                  title="Extract text"
                >
                  <FileText className="h-5 w-5 mr-1" />
                  <span className="text-xs hidden sm:inline">Extract Text</span>
                </button>
              )}
            </div>
          </div>
          
          {extractedText && renderTabs()}
          
          {viewMode === 'pdf' && (
            <div 
              id="pdf-container" 
              className="relative overflow-auto bg-brand-gray-900 p-4 flex-1"
              onMouseUp={handleTextSelection}
            >
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-yellow-400" />
                  </div>
                }
                className="flex justify-center"
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-xl [&_.textLayer]:text-brand-yellow-200 [&_.textLayer]:select-text [&_.textLayer]:!bg-transparent"
                  width={containerWidth ? containerWidth - 48 : undefined}
                />
                {renderAnnotations()}
              </Document>
              
              {isLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-brand-gray-900 bg-opacity-80">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-yellow-400" />
                </div>
              )}
            </div>
          )}
          
          {viewMode === 'text' && extractedText && (
            <div className="flex-1 overflow-auto">
              <ExtractedTextViewer text={extractedText} />
            </div>
          )}
          
          {viewMode === 'chat' && extractedText && (
            <div className="flex-1 overflow-hidden">
              <PDFChat 
                extractedText={extractedText} 
                isProcessing={isExtractingText} 
              />
            </div>
          )}
        </>
      )}
      
      {extractionError && (
        <div className="bg-red-900/20 border border-red-600 p-4 m-4 rounded-lg">
          <p className="text-red-400">{extractionError}</p>
          <button
            onClick={cancelTextExtraction}
            className="mt-2 px-3 py-1 bg-brand-gray-700 hover:bg-brand-gray-600 text-brand-gray-300 rounded-lg text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {selectedText && annotationPosition && (
        <div 
          className="absolute bg-brand-gray-800 border border-brand-gray-700 rounded-lg shadow-xl p-4 z-10"
          style={{
            left: annotationPosition.x,
            top: annotationPosition.y + 20,
            width: '300px'
          }}
        >
          <p className="text-sm font-medium text-brand-gray-300 mb-2">Add annotation for:</p>
          <p className="bg-brand-yellow-400/20 p-2 rounded mb-2 text-sm text-brand-yellow-200">
            "{selectedText}"
          </p>
          <textarea
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            className="w-full px-3 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 mb-3 text-brand-gray-200"
            placeholder="Add your notes here..."
            rows={3}
          ></textarea>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelAnnotation}
              className="px-3 py-1 border border-brand-gray-600 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAnnotation}
              className="px-3 py-1 bg-brand-yellow-400 hover:bg-brand-yellow-500 text-brand-gray-900 rounded-lg text-sm"
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

export default PDFViewer;