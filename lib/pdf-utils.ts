import { getDocument } from 'pdfjs-dist';
import { createWorker, Worker } from 'tesseract.js';

// Set up the worker for PDF.js
if (typeof window !== 'undefined') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  require('pdfjs-dist').GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const CHUNK_SIZE = 1000; // Number of characters per chunk
const MAX_PAGES_PER_CHUNK = 5; // Maximum number of pages to process at once

interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  status: 'extracting' | 'ocr' | 'complete' | 'error';
  message: string;
}

/**
 * Extracts text from a PDF file with OCR support
 * @param file PDF file as a File object
 * @param onProgress Callback for progress updates
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';
    let currentPage = 1;

    // Initialize Tesseract worker for OCR
    const worker: Worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Process pages in chunks
    while (currentPage <= totalPages) {
      const chunkEndPage = Math.min(currentPage + MAX_PAGES_PER_CHUNK - 1, totalPages);
      let chunkText = '';

      // Extract text from each page in the chunk
      for (let i = currentPage; i <= chunkEndPage; i++) {
        onProgress?.({
          currentPage: i,
          totalPages,
          status: 'extracting',
          message: `Extracting text from page ${i} of ${totalPages}...`
        });

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        // If the page has very little text, try OCR
        if (pageText.trim().length < 50) {
          onProgress?.({
            currentPage: i,
            totalPages,
            status: 'ocr',
            message: `Running OCR on page ${i}...`
          });

          // Convert page to image for OCR
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Failed to get canvas context');

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          // Perform OCR
          const { data: { text: ocrText } } = await worker.recognize(canvas);
          chunkText += ocrText + '\n\n';
        } else {
          chunkText += pageText + '\n\n';
        }
      }

      // Add chunk to full text
      fullText += chunkText;
      currentPage = chunkEndPage + 1;

      // Update progress
      onProgress?.({
        currentPage,
        totalPages,
        status: currentPage > totalPages ? 'complete' : 'extracting',
        message: currentPage > totalPages 
          ? 'Text extraction complete'
          : `Processed ${currentPage - 1} of ${totalPages} pages`
      });
    }

    // Terminate Tesseract worker
    await worker.terminate();

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    onProgress?.({
      currentPage: 0,
      totalPages: 0,
      status: 'error',
      message: 'Failed to extract text from PDF'
    });
    throw new Error('Failed to extract text from PDF. Please try again.');
  }
}

/**
 * Splits text into chunks for processing
 * @param text Input text string
 * @param chunkSize Size of each chunk in characters
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string, chunkSize: number = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Counts words in a text string
 * @param text Input text string
 * @returns Number of words
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Counts characters in a text string
 * @param text Input text string
 * @returns Number of characters
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Counts paragraphs in a text string
 * @param text Input text string
 * @returns Number of paragraphs
 */
export function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
}

/**
 * Gets a summary of the PDF document statistics
 * @param text Extracted text from PDF
 * @returns Object containing document statistics
 */
export function getDocumentStats(text: string) {
  return {
    words: countWords(text),
    characters: countCharacters(text),
    paragraphs: countParagraphs(text),
  };
} 