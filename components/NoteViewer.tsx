import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { 
  ArrowLeft, Download, Share, Edit, Save, Tag, 
  Trash2, FileText, BookOpen, Highlighter, X 
} from 'lucide-react';
import { Note, Annotation } from '../types';
import PDFViewer from '../components/PDFViewer';
import MarkdownViewer from '../components/MarkdownViewer';
import AnnotationSidebar from '../components/AnnotationSidebar';

const NoteViewer = () => {
  // ... existing state and functions ...

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-brand-yellow-400/20 text-brand-yellow-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <div className="bg-brand-gray-800 rounded-xl shadow-md mb-6">
            <div className="p-4 border-b border-brand-gray-700 flex justify-between items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-brand-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setHighlightMode(!highlightMode)}
                  className={`p-2 rounded-lg ${
                    highlightMode ? 'bg-brand-yellow-400/20 text-brand-yellow-200' : 'text-brand-gray-300 hover:bg-brand-gray-700'
                  }`}
                  title="Highlight text"
                >
                  <Highlighter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`p-2 rounded-lg ${
                    showAnnotations ? 'bg-brand-yellow-400/20 text-brand-yellow-200' : 'text-brand-gray-300 hover:bg-brand-gray-700'
                  }`}
                  title="Toggle annotations"
                >
                  <BookOpen className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
                  title="Share"
                >
                  <Share className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="mb-6">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 text-2xl font-bold bg-brand-gray-700 border border-brand-gray-600 text-white rounded-lg focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 mb-4"
                    placeholder="Enter title"
                  />
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editedTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center bg-brand-gray-700 text-brand-gray-300 px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-brand-gray-400 hover:text-brand-yellow-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-grow px-4 py-2 bg-brand-gray-700 border border-brand-gray-600 text-white rounded-l-lg focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-brand-gray-700 hover:bg-brand-gray-600 text-brand-yellow-400 px-4 py-2 rounded-r-lg border border-l-0 border-brand-gray-600"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-brand-gray-600 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="flex items-center px-4 py-2 bg-brand-yellow-400 text-brand-gray-900 rounded-lg hover:bg-brand-yellow-500"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                // ... rest of the component remains the same ...
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteViewer;