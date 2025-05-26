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
  const { noteId } = useParams<{ noteId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !noteId) return;
      
      try {
        setError(null);
        
        // Fetch note with tags and annotations - removing page_number from the query
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .select(`
            *,
            note_tags (
              tag
            ),
            annotations (
              id,
              text,
              content,
              color,
              position,
              created_at
            )
          `)
          .eq('id', noteId)
          .eq('user_id', user.id)
          .single();

        if (noteError) throw noteError;

        if (!noteData) {
          navigate('/');
          return;
        }

        // Transform the data to match our Note type
        const transformedNote: Note = {
          id: noteData.id,
          userId: noteData.user_id,
          title: noteData.title,
          content: noteData.content,
          fileUrl: noteData.file_url,
          fileType: noteData.file_type,
          category: noteData.category,
          tags: noteData.note_tags?.map(t => t.tag) || [],
          summary: noteData.summary,
          annotations: noteData.annotations?.map(a => ({
            id: a.id,
            text: a.text,
            content: a.content,
            color: a.color,
            position: a.position,
            createdAt: new Date(a.created_at)
          })) || [],
          createdAt: new Date(noteData.created_at),
          updatedAt: noteData.updated_at ? new Date(noteData.updated_at) : undefined
        };

        setNote(transformedNote);
        setEditedTitle(transformedNote.title);
        setEditedTags(transformedNote.tags || []);
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNote();
  }, [noteId, user, navigate]);

  const handleSaveChanges = async () => {
    if (!note || !noteId || !user) return;
    
    try {
      setError(null);

      // Update note
      const { error: noteError } = await supabase
        .from('notes')
        .update({
          title: editedTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (noteError) throw noteError;

      // Delete existing tags
      const { error: deleteTagsError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId);

      if (deleteTagsError) throw deleteTagsError;

      // Add new tags
      if (editedTags.length > 0) {
        const tagInserts = editedTags.map(tag => ({
          note_id: noteId,
          tag
        }));

        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      setNote({
        ...note,
        title: editedTitle,
        tags: editedTags,
        updatedAt: new Date()
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to save changes. Please try again.');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddAnnotation = async (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    if (!note || !noteId || !user) return;
    
    try {
      setError(null);

      const { data: newAnnotation, error: annotationError } = await supabase
        .from('annotations')
        .insert([{
          note_id: noteId,
          user_id: user.id,
          text: annotation.text,
          content: annotation.content,
          color: annotation.color,
          position: annotation.position
        }])
        .select()
        .single();

      if (annotationError) throw annotationError;

      const newAnnotationTransformed: Annotation = {
        id: newAnnotation.id,
        text: newAnnotation.text,
        content: newAnnotation.content,
        color: newAnnotation.color,
        position: newAnnotation.position,
        createdAt: new Date(newAnnotation.created_at)
      };

      setNote({
        ...note,
        annotations: [...(note.annotations || []), newAnnotationTransformed]
      });
      
      setCurrentAnnotation(null);
    } catch (err) {
      console.error('Error adding annotation:', err);
      setError('Failed to add annotation. Please try again.');
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!note || !noteId || !user) return;
    
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('annotations')
        .delete()
        .eq('id', annotationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setNote({
        ...note,
        annotations: (note.annotations || []).filter(
          annotation => annotation.id !== annotationId
        )
      });
    } catch (err) {
      console.error('Error deleting annotation:', err);
      setError('Failed to delete annotation. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">Note not found</h3>
          <p className="text-gray-600 mb-6">
            The note you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setHighlightMode(!highlightMode)}
                  className={`p-2 rounded-lg ${
                    highlightMode ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Highlight text"
                >
                  <Highlighter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`p-2 rounded-lg ${
                    showAnnotations ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Toggle annotations"
                >
                  <BookOpen className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
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
                    className="w-full px-4 py-2 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  />
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editedTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-gray-500 hover:text-red-500"
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
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-r-lg"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{note.title}</h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {note.category && (
                    <div className="mb-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2.5 py-1 rounded-full">
                        {note.category}
                      </span>
                    </div>
                  )}
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {note.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="border rounded-lg overflow-hidden">
                {note.fileType === 'pdf' && note.fileUrl && (
                  <PDFViewer 
                    fileUrl={note.fileUrl} 
                    annotations={showAnnotations ? note.annotations : []}
                    highlightMode={highlightMode}
                    onAddAnnotation={handleAddAnnotation}
                    onSelectAnnotation={setCurrentAnnotation}
                  />
                )}
                
                {note.fileType === 'markdown' && note.content && (
                  <MarkdownViewer 
                    content={note.content}
                    annotations={showAnnotations ? note.annotations : []}
                    highlightMode={highlightMode}
                    onAddAnnotation={handleAddAnnotation}
                    onSelectAnnotation={setCurrentAnnotation}
                  />
                )}
                
                {note.fileType === 'image' && note.fileUrl && (
                  <div className="p-4">
                    <img 
                      src={note.fileUrl} 
                      alt={note.title} 
                      className="max-w-full mx-auto rounded"
                    />
                    {note.content && (
                      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-medium mb-2">Extracted Text:</h3>
                        <p className="whitespace-pre-line">{note.content}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {note.fileType === 'text' && note.content && (
                  <div className="p-4">
                    <pre className="whitespace-pre-line font-sans">{note.content}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {showAnnotations && (
          <div className="w-full md:w-1/4">
            <AnnotationSidebar 
              annotations={note.annotations || []}
              currentAnnotation={currentAnnotation}
              onSelectAnnotation={setCurrentAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteViewer;