import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PDFViewer.css';

// Note: CSS imports may need adjustment based on react-pdf version
// If you get CSS import errors, you can comment these out and add styles manually

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer({ pdfUrl, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error) {
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
    console.error('PDF load error:', error);
  }

  function goToPrevPage() {
    setPageNumber((prev) => Math.max(1, prev - 1));
  }

  function goToNextPage() {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  }

  function zoomIn() {
    setScale((prev) => Math.min(3.0, prev + 0.2));
  }

  function zoomOut() {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  }

  function resetZoom() {
    setScale(1.0);
  }

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-controls">
            <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="btn-control">
              ← Prev
            </button>
            <span className="page-info">
              Page {pageNumber} of {numPages || '...'}
            </span>
            <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="btn-control">
              Next →
            </button>
          </div>
          <div className="pdf-viewer-zoom">
            <button onClick={zoomOut} className="btn-control">-</button>
            <span className="zoom-info">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="btn-control">+</button>
            <button onClick={resetZoom} className="btn-control">Reset</button>
          </div>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="pdf-viewer-content">
          {loading && <div className="loading-message">Loading PDF...</div>}
          {error && <div className="error-message">{error}</div>}
          
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="loading-message">Loading PDF...</div>}
            options={{
              cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
              cMapPacked: true,
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;

