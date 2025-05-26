import React, { useState } from 'react';
import { Download, FileText, File, FileJson, ChevronDown, Check } from 'lucide-react';

interface ExportOptionsMenuProps {
  text: string;
  fileName?: string;
}

type ExportFormat = 'txt' | 'pdf' | 'json';

const ExportOptionsMenu: React.FC<ExportOptionsMenuProps> = ({ 
  text, 
  fileName = 'extracted_text' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'txt':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'pdf':
        return <File className="h-4 w-4 mr-2 text-red-400" />;
      case 'json':
        return <FileJson className="h-4 w-4 mr-2" />;
      default:
        return <Download className="h-4 w-4 mr-2" />;
    }
  };
  
  const exportText = (format: ExportFormat) => {
    switch (format) {
      case 'txt':
        exportAsText();
        break;
      case 'pdf':
        exportAsPDF();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
    setIsOpen(false);
  };
  
  const exportAsText = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${fileName}.txt`);
  };
  
  const exportAsPDF = () => {
    // For a real implementation, you'd use a library like jsPDF
    // This is a simplified version that creates a simple HTML-based PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
          pre { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${fileName}</h1>
        <pre>${text}</pre>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadFile(blob, `${fileName}.html`);
    
    // Show a note about PDF conversion
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 16px';
    notification.style.background = '#2a2c33';
    notification.style.border = '1px solid #4b4e58';
    notification.style.borderRadius = '8px';
    notification.style.color = '#e5c07b';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    notification.style.zIndex = '1000';
    notification.style.maxWidth = '300px';
    notification.innerHTML = `For a true PDF, please print this HTML file as PDF from your browser.`;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 5000);
  };
  
  const exportAsJSON = () => {
    const jsonData = {
      content: text,
      exportDate: new Date().toISOString(),
      metadata: {
        characterCount: text.length,
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
        lineCount: text.split('\n').length
      }
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${fileName}.json`);
  };
  
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="p-1.5 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700 flex items-center text-sm"
        title="Export options"
      >
        <Download className="h-4 w-4 mr-1" />
        <span>Export</span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop for clicking away */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 z-20 w-48 bg-brand-gray-800 rounded-lg shadow-lg border border-brand-gray-700 py-1 overflow-hidden">
            <div className="px-3 py-1.5 text-xs text-brand-gray-500 font-medium border-b border-brand-gray-700">
              Export Format
            </div>
            
            <button
              onClick={() => exportText('txt')}
              className="flex items-center w-full px-3 py-2 text-sm text-brand-gray-300 hover:bg-brand-gray-700"
            >
              {getFormatIcon('txt')}
              <span>Text File (.txt)</span>
            </button>
            
            <button
              onClick={() => exportText('pdf')}
              className="flex items-center w-full px-3 py-2 text-sm text-brand-gray-300 hover:bg-brand-gray-700"
            >
              {getFormatIcon('pdf')}
              <span>HTML/PDF (.html)</span>
            </button>
            
            <button
              onClick={() => exportText('json')}
              className="flex items-center w-full px-3 py-2 text-sm text-brand-gray-300 hover:bg-brand-gray-700"
            >
              {getFormatIcon('json')}
              <span>JSON File (.json)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportOptionsMenu; 