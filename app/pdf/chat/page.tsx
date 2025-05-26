'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFChatSimple } from '../../../components/PDFChatSimple';
import { extractTextFromPDF } from '../../../lib/pdf-utils';
import { Loader2, FileText, AlertCircle } from 'lucide-react';

interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  status: 'extracting' | 'ocr' | 'complete' | 'error';
  message: string;
}

export default function PDFChatPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setFile(file);
    setError(null);
    setIsProcessing(true);
    setProgress(null);

    try {
      const text = await extractTextFromPDF(file, (progress) => {
        setProgress(progress);
      });
      setExtractedText(text);
    } catch (err) {
      setError('Failed to process PDF. Please try again.');
      console.error('Error processing PDF:', err);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="h-6 w-6 text-brand-yellow-400" />
        <h1 className="text-2xl font-bold">PDF Chat</h1>
      </div>
      
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-brand-yellow-400 bg-brand-yellow-400/10' : 'border-brand-gray-700 hover:border-brand-yellow-400'}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-brand-yellow-400">Drop the PDF here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-brand-gray-300">Drag and drop a PDF file here, or click to select one</p>
              <p className="text-sm text-brand-gray-500">Supported format: PDF</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-brand-gray-800 p-4 rounded-lg border border-brand-gray-700">
            <div>
              <p className="font-medium text-brand-gray-200">{file.name}</p>
              <p className="text-sm text-brand-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setExtractedText('');
                setError(null);
                setProgress(null);
              }}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          </div>

          {error ? (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="p-4 bg-brand-gray-800 rounded-lg border border-brand-gray-700">
              <div className="flex items-center space-x-4">
                <Loader2 className="h-5 w-5 text-brand-yellow-400 animate-spin" />
                <div className="flex-1">
                  <p className="text-brand-gray-300">{progress?.message || 'Processing PDF...'}</p>
                  {progress && (
                    <div className="mt-2">
                      <div className="h-1 bg-brand-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-yellow-400 transition-all duration-300"
                          style={{
                            width: `${(progress.currentPage / progress.totalPages) * 100}%`
                          }}
                        />
                      </div>
                      <p className="text-sm text-brand-gray-400 mt-1">
                        Page {progress.currentPage} of {progress.totalPages}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-brand-gray-700 rounded-lg overflow-hidden">
              <PDFChatSimple text={extractedText} />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 