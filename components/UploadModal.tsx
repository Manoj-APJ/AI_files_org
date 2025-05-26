import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { X, Upload, FileText, FileImage, File, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { pdfjs } from 'react-pdf';

// Ensure PDF.js worker is set up
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // Auto-generate title from filename
      const fileName = selectedFile.name.split('.')[0];
      setTitle(fileName);
      
      // Auto-detect file type and process if needed
      if (selectedFile.type.includes('image')) {
        processImageWithOCR(selectedFile);
      } else if (selectedFile.type.includes('pdf')) {
        processPDFWithExtraction(selectedFile);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 1
  });

  const processImageWithOCR = async (imageFile: File) => {
    setIsProcessing(true);
    
    try {
      // Type assertion to avoid TypeScript issues
      const worker = await createWorker();
      const anyWorker = worker as any;
      await anyWorker.load();
      await anyWorker.loadLanguage('eng');
      await anyWorker.initialize('eng');
      
      const result = await anyWorker.recognize(imageFile);
      setExtractedText(result.data.text);
      
      // Auto-detect category based on content
      detectCategory(result.data.text);
      
      await anyWorker.terminate();
    } catch (error) {
      console.error('OCR processing error:', error);
      setError('Failed to process image text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPDFWithExtraction = async (pdfFile: File) => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Convert the File to an ArrayBuffer for PDF.js
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let extractedText = '';
      const numPages = pdf.numPages;
      
      // Process each page
      for (let i = 1; i <= numPages; i++) {
        // Try text extraction first using PDF.js
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => item.str).join(' ');
        
        // If text extraction yields results, use it
        if (textItems.trim().length > 0) {
          extractedText += textItems + '\n\n';
        } else {
          // If no text is extracted (e.g., scanned PDF), use OCR
          try {
            // Render the page to a canvas
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              // Use Tesseract.js for OCR on the canvas
              // Type assertion to avoid TypeScript issues
              const worker = await createWorker();
              const anyWorker = worker as any;
              await anyWorker.load();
              await anyWorker.loadLanguage('eng');
              await anyWorker.initialize('eng');
              
              // Process with OCR
              const result = await anyWorker.recognize(canvas);
              extractedText += result.data.text + '\n\n';
              
              await anyWorker.terminate();
            }
          } catch (ocrError) {
            console.error('OCR error for PDF page:', ocrError);
            // Continue with other pages even if one fails
          }
        }
      }
      
      setExtractedText(extractedText.trim());
      
      // Auto-detect category based on content
      if (extractedText.trim().length > 0) {
        detectCategory(extractedText);
      }
      
    } catch (error) {
      console.error('PDF processing error:', error);
      setError('Failed to extract text from PDF. Using the file as is.');
    } finally {
      setIsProcessing(false);
    }
  };

  const detectCategory = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Simple category detection based on keywords
    if (lowerText.includes('math') || lowerText.includes('equation') || lowerText.includes('calculus')) {
      setCategory('Math');
    } else if (lowerText.includes('science') || lowerText.includes('biology') || lowerText.includes('chemistry')) {
      setCategory('Science');
    } else if (lowerText.includes('history') || lowerText.includes('century') || lowerText.includes('war')) {
      setCategory('History');
    } else if (lowerText.includes('literature') || lowerText.includes('novel') || lowerText.includes('poetry')) {
      setCategory('Literature');
    } else if (lowerText.includes('computer') || lowerText.includes('programming') || lowerText.includes('algorithm')) {
      setCategory('Computer Science');
    }
    
    // Auto-suggest tags based on content
    const possibleTags: string[] = [];
    const keywords = [
      'research', 'exam', 'homework', 'project', 'lecture', 'tutorial',
      'important', 'review', 'summary', 'notes', 'assignment'
    ];
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword) && !tags.includes(keyword)) {
        possibleTags.push(keyword);
      }
    });
    
    if (possibleTags.length > 0) {
      setTags([...tags, ...possibleTags.slice(0, 3)]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title) {
      setError('Please provide a file and title');
      return;
    }

    if (!user) {
      setError('User is not authenticated. Please log in.');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      // 1. Upload file to Supabase Storage
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const filePath = `notes/${user.id}/${fileId}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        throw uploadError;
      }

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('notes')
        .getPublicUrl(filePath);

      // 3. Determine file type
      let fileType: 'pdf' | 'image' | 'text' | 'markdown';
      if (file.type.includes('pdf')) {
        fileType = 'pdf';
      } else if (file.type.includes('image')) {
        fileType = 'image';
      } else if (file.type.includes('markdown')) {
        fileType = 'markdown';
      } else {
        fileType = 'text';
      }

      // 4. Create note in database
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          title,
          file_url: publicUrl,
          file_type: fileType,
          category: category || null,
          content: extractedText || null,
          summary: generateSummary(extractedText)
        }])
        .select()
        .single();

      if (noteError) throw noteError;

      // 5. Add tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tag => ({
          note_id: noteData.id,
          tag
        }));

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading note:', error);
      setError('Failed to upload note. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const generateSummary = (text: string) => {
    if (!text) return null;
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.includes('pdf')) {
      return <FileText className="h-12 w-12 text-red-500" />;
    } else if (file.type.includes('image')) {
      return <FileImage className="h-12 w-12 text-blue-500" />;
    } else if (file.type.includes('markdown')) {
      return <FileText className="h-12 w-12 text-purple-500" />;
    } else {
      return <File className="h-12 w-12 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-gray-900 rounded-xl shadow-xl max-w-2xl w-full border border-brand-gray-700">
        <div className="p-6 border-b border-brand-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-yellow-400">Upload Notes</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-gray-800 rounded-full text-brand-gray-400 hover:text-brand-yellow-400"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
              isDragActive 
                ? 'border-brand-yellow-400 bg-brand-yellow-400/10' 
                : 'border-brand-gray-700 hover:border-brand-yellow-400 hover:bg-brand-yellow-400/5'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center">
                {getFileIcon()}
                <p className="mt-2 text-brand-gray-300">{file.name}</p>
                <p className="text-sm text-brand-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setExtractedText('');
                  }}
                  className="mt-3 px-3 py-1 bg-brand-gray-800 rounded-lg text-brand-gray-400 hover:text-brand-yellow-400 text-sm"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-brand-gray-500 mb-2" />
                <p className="text-brand-gray-300">Drag & drop a file or click to browse</p>
                <p className="text-sm text-brand-gray-500 mt-1">
                  Supports PDF, images, text, and markdown files
                </p>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mb-6 p-4 bg-brand-gray-800 rounded-lg border border-brand-gray-700">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand-yellow-400 mr-3" />
                <p className="text-brand-gray-300">Processing file content...</p>
              </div>
            </div>
          )}

          {extractedText && !isProcessing && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-gray-300 mb-2">
                Extracted Content Preview
              </label>
              <div className="p-3 bg-brand-gray-800 rounded-lg border border-brand-gray-700 max-h-40 overflow-y-auto">
                <p className="text-sm text-brand-gray-400">
                  {extractedText.length > 300 
                    ? extractedText.substring(0, 300) + '...' 
                    : extractedText}
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label 
              htmlFor="title" 
              className="block text-sm font-medium text-brand-gray-300 mb-2"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-brand-gray-800 border border-brand-gray-700 rounded-lg focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 text-brand-gray-200"
              placeholder="Enter a title for your note"
              required
            />
          </div>

          <div className="mb-6">
            <label 
              htmlFor="category" 
              className="block text-sm font-medium text-brand-gray-300 mb-2"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-brand-gray-800 border border-brand-gray-700 rounded-lg focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 text-brand-gray-200"
            >
              <option value="">Select a category</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Literature">Literature</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <div 
                  key={tag} 
                  className="flex items-center bg-brand-gray-800 px-3 py-1 rounded-lg"
                >
                  <span className="text-sm text-brand-gray-300">{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-brand-gray-500 hover:text-brand-yellow-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 bg-brand-gray-800 border border-brand-gray-700 rounded-l-lg focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 text-brand-gray-200"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-brand-gray-800 border border-brand-gray-700 border-l-0 rounded-r-lg text-brand-gray-300 hover:bg-brand-gray-700"
              >
                Add
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-brand-gray-700 rounded-lg text-brand-gray-300 hover:bg-brand-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isProcessing || !file}
              className="px-4 py-2 bg-brand-yellow-400 hover:bg-brand-yellow-500 text-brand-gray-900 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;