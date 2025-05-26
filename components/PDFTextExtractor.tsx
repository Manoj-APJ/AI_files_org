import React, { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { Loader2, FileText, CheckCircle } from 'lucide-react';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFTextExtractorProps {
  fileUrl: string;
  onTextExtracted: (text: string) => void;
  onError: (error: string) => void;
}

interface PageProgress {
  pageNumber: number;
  status: 'pending' | 'extracting' | 'complete' | 'error';
  text: string;
}

// Define progress data interface for PDF.js
interface PDFProgressData {
  loaded: number;
  total: number;
}

const PDFTextExtractor: React.FC<PDFTextExtractorProps> = ({
  fileUrl,
  onTextExtracted,
  onError
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [extractionStartTime, setExtractionStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const [pageProgressList, setPageProgressList] = useState<PageProgress[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const extractTextFromPDF = async () => {
      try {
        setIsExtracting(true);
        setExtractionStartTime(new Date());
        
        // Load PDF document
        const loadingTask = pdfjs.getDocument(fileUrl);
        
        // Add loading progress event
        loadingTask.onProgress = (progressData: PDFProgressData) => {
          if (progressData.total > 0) {
            const loadingProgress = Math.round((progressData.loaded / progressData.total) * 20);
            setProgress(loadingProgress); // Loading is 0-20% of the process
          }
        };
        
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        setNumPages(totalPages);
        
        // Initialize page progress list with proper typing
        const initialPageProgressList: PageProgress[] = Array.from({ length: totalPages }, (_, i) => ({
          pageNumber: i + 1,
          status: 'pending' as const,
          text: ''
        }));
        setPageProgressList(initialPageProgressList);
        
        // Calculate page processing batch size based on total pages
        // For very large PDFs, process fewer pages at once to avoid memory issues
        const batchSize = totalPages > 100 ? 5 : (totalPages > 50 ? 10 : 20);
        
        // Process pages in batches to avoid memory issues
        let allText = '';
        let processedPages = 0;
        
        for (let i = 1; i <= totalPages; i += batchSize) {
          // Process a batch of pages
          const batch = Array.from(
            { length: Math.min(batchSize, totalPages - i + 1) }, 
            (_, j) => i + j
          );
          
          // Process pages in parallel within the batch
          await Promise.all(batch.map(async (pageNum) => {
            try {
              setCurrentPage(pageNum);
              
              // Update status for this page
              setPageProgressList(prev => prev.map(page => 
                page.pageNumber === pageNum 
                  ? { ...page, status: 'extracting' as const } 
                  : page
              ));
              
              // Get the page
              const page = await pdf.getPage(pageNum);
              
              // Try text extraction using PDF.js
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              
              // Update progress
              processedPages++;
              const newProgress = 20 + Math.round((processedPages / totalPages) * 80); // 20-100%
              setProgress(newProgress);
              
              // Calculate estimated time remaining
              if (extractionStartTime && processedPages > 1) {
                const timeElapsed = (new Date().getTime() - extractionStartTime.getTime()) / 1000; // in seconds
                const timePerPage = timeElapsed / processedPages;
                const pagesRemaining = totalPages - processedPages;
                const timeRemaining = timePerPage * pagesRemaining;
                
                if (timeRemaining > 60) {
                  setEstimatedTimeRemaining(`~${Math.round(timeRemaining / 60)} minutes remaining`);
                } else {
                  setEstimatedTimeRemaining(`~${Math.round(timeRemaining)} seconds remaining`);
                }
              }
              
              // Update text and status
              allText += pageText + '\n\n';
              
              // Update page progress
              setPageProgressList(prev => prev.map(page => 
                page.pageNumber === pageNum 
                  ? { ...page, status: 'complete' as const, text: pageText } 
                  : page
              ));
            } catch (pageError) {
              console.error(`Error extracting text from page ${pageNum}:`, pageError);
              setPageProgressList(prev => prev.map(page => 
                page.pageNumber === pageNum 
                  ? { ...page, status: 'error' as const } 
                  : page
              ));
            }
          }));
          
          // Free up memory by waiting briefly between batches
          if (i + batchSize <= totalPages) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Provide extracted text to parent component
        onTextExtracted(allText.trim());
      } catch (error: any) {
        console.error('Error extracting text from PDF:', error);
        setErrorDetails(error.message || 'Unknown error');
        onError(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
      } finally {
        setIsExtracting(false);
        setEstimatedTimeRemaining(null);
      }
    };
    
    if (fileUrl) {
      extractTextFromPDF();
    }
  }, [fileUrl, onTextExtracted, onError]);
  
  const handleRetry = () => {
    // Reset states and retry
    setIsExtracting(true);
    setProgress(0);
    setCurrentPage(0);
    setErrorDetails(null);
    
    // The useEffect will trigger again since dependencies haven't changed
  };
  
  // Display extraction statistics
  const extractionStats = pageProgressList.reduce((stats, page) => {
    stats[page.status]++;
    return stats;
  }, { pending: 0, extracting: 0, complete: 0, error: 0 });
  
  return (
    <div className="flex flex-col items-center p-6 bg-brand-gray-800 rounded-lg border border-brand-gray-700">
      <h3 className="text-xl font-medium text-brand-yellow-400 mb-4 flex items-center">
        <FileText className="h-6 w-6 mr-2" />
        {isExtracting ? 'Extracting Text from PDF' : 'Text Extraction Complete'}
      </h3>
      
      <div className="w-full bg-brand-gray-700 rounded-full h-2.5 mb-2">
        <div 
          className="bg-brand-yellow-400 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="w-full flex justify-between text-sm text-brand-gray-400 mb-4">
        <span>{progress}%</span>
        {estimatedTimeRemaining && <span>{estimatedTimeRemaining}</span>}
      </div>
      
      {isExtracting ? (
        <div className="text-center mb-4">
          <p className="text-brand-gray-300 text-sm mb-2">
            Processing page {currentPage} of {numPages || '?'}
          </p>
          <div className="flex items-center justify-center mt-2">
            <Loader2 className="h-5 w-5 text-brand-yellow-400 animate-spin mr-2" />
            <p className="text-brand-gray-400 text-sm">
              Extracting text... Please wait
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center mb-4">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-brand-gray-300">
              {extractionStats.error === 0 
                ? 'Extraction complete!' 
                : `Extraction complete with ${extractionStats.error} page errors`}
            </p>
          </div>
        </div>
      )}
      
      {/* Page extraction details - only show if there are many pages */}
      {numPages && numPages > 10 && (
        <div className="w-full mt-4 bg-brand-gray-900 rounded-md p-3 max-h-40 overflow-y-auto text-sm">
          <p className="text-brand-gray-400 mb-2 text-xs">Extraction Status:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brand-gray-600 mr-2"></div>
              <span className="text-brand-gray-400">Pending: {extractionStats.pending}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-brand-yellow-400 animate-pulse mr-2"></div>
              <span className="text-brand-gray-400">Extracting: {extractionStats.extracting}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-brand-gray-400">Complete: {extractionStats.complete}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-brand-gray-400">Failed: {extractionStats.error}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Error details */}
      {errorDetails && (
        <div className="w-full mt-4 bg-red-900/20 border border-red-600 rounded-md p-3 text-red-400">
          <p className="font-medium mb-1">Error Details:</p>
          <p className="text-sm">{errorDetails}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-3 py-1 bg-brand-gray-700 hover:bg-brand-gray-600 text-brand-gray-300 rounded-lg text-sm"
          >
            Retry Extraction
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFTextExtractor; 