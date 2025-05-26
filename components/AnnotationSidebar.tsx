import React, { useState } from 'react';
import { Annotation } from '../types';
import { Trash2, Edit, Save, X } from 'lucide-react';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  currentAnnotation: Annotation | null;
  onSelectAnnotation: (annotation: Annotation | null) => void;
  onDeleteAnnotation: (annotationId: string) => void;
}

const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations,
  currentAnnotation,
  onSelectAnnotation,
  onDeleteAnnotation
}) => {
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const handleEditAnnotation = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id);
    setEditedContent(annotation.content);
  };

  const handleSaveEdit = (annotation: Annotation) => {
    // In a real app, we would update the annotation in the database
    setEditingAnnotation(null);
  };

  const handleCancelEdit = () => {
    setEditingAnnotation(null);
    setEditedContent('');
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Annotations</h2>
      </div>
      
      <div className="p-4">
        {annotations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No annotations yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Highlight text and add notes to create annotations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {annotations.map(annotation => (
              <div 
                key={annotation.id}
                className={`border rounded-lg overflow-hidden ${
                  currentAnnotation?.id === annotation.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {formatDate(annotation.createdAt)}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditAnnotation(annotation)}
                      className="p-1 text-gray-500 hover:text-blue-500 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAnnotation(annotation.id)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="bg-yellow-100 p-2 rounded mb-2 text-sm">
                    "{annotation.text}"
                  </div>
                  
                  {editingAnnotation === annotation.id ? (
                    <div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                        rows={3}
                      ></textarea>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSaveEdit(annotation)}
                          className="p-1 text-blue-500 hover:text-blue-700 rounded"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700">{annotation.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationSidebar;
