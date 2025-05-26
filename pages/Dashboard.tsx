import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Tag, Calendar, Filter, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import UploadModal from '../components/UploadModal';
import NoteCard from '../components/NoteCard';
import { Note } from '../types';

const Dashboard = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // Get all unique categories and tags from notes
  const categories = [...new Set(notes.map(note => note.category).filter(Boolean))];
  const tags = [...new Set(notes.flatMap(note => note.tags || []))];

  useEffect(() => {
    fetchNotes();
  }, [user]);

  useEffect(() => {
    // Filter notes based on search term, category, and tag
    let filtered = notes;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(term) ||
        note.content?.toLowerCase().includes(term) ||
        note.category?.toLowerCase().includes(term) ||
        note.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    
    if (selectedTag) {
      filtered = filtered.filter(note => note.tags?.includes(selectedTag));
    }
    
    setFilteredNotes(filtered);
  }, [searchTerm, selectedCategory, selectedTag, notes]);

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      setError(null);
      
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select(`
          *,
          note_tags (
            tag
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      const transformedNotes: Note[] = notesData.map(note => ({
        id: note.id,
        userId: note.user_id,
        title: note.title,
        content: note.content,
        fileUrl: note.file_url,
        fileType: note.file_type,
        category: note.category,
        tags: note.note_tags?.map(t => t.tag) || [],
        summary: note.summary,
        createdAt: new Date(note.created_at),
        updatedAt: note.updated_at ? new Date(note.updated_at) : undefined
      }));

      setNotes(transformedNotes);
      setFilteredNotes(transformedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    
    try {
      setError(null);

      // Delete the note
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Delete the file from storage
      const note = notes.find(n => n.id === noteId);
      if (note?.fileUrl) {
        const filePath = note.fileUrl.split('/').pop();
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('notes')
            .remove([`notes/${user.id}/${filePath}`]);

          if (storageError) {
            console.error('Error deleting file:', storageError);
          }
        }
      }

      // Update the notes list
      setNotes(notes.filter(note => note.id !== noteId));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Lecture Notes</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center bg-brand-yellow-400 hover:bg-brand-yellow-500 text-brand-gray-900 px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Upload Notes
        </button>
      </div>

      {error && (
        <div className="bg-brand-yellow-400/20 text-brand-yellow-200 p-4 rounded-lg mb-8 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-brand-gray-800 rounded-xl shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-brand-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-brand-gray-700 border border-brand-gray-600 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400 placeholder-brand-gray-400"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="appearance-none pl-10 pr-8 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400"
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-brand-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="appearance-none pl-10 pr-8 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-yellow-400 focus:border-brand-yellow-400"
              >
                <option value="">All Tags</option>
                {tags.map((tag, index) => (
                  <option key={index} value={tag}>{tag}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-brand-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow-400"></div>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="relative group">
              <NoteCard note={note} />
              <button
                onClick={() => setDeleteConfirmation(note.id)}
                className="absolute top-2 right-2 p-2 bg-brand-yellow-400/20 text-brand-yellow-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-yellow-400/30"
                title="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-brand-gray-800 rounded-xl shadow-md p-8 text-center">
          <FileText className="h-16 w-16 text-brand-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No notes found</h3>
          <p className="text-brand-gray-400 mb-6">
            {notes.length === 0
              ? "You haven't uploaded any notes yet. Start by uploading your first document."
              : "No notes match your current filters. Try adjusting your search criteria."}
          </p>
          {notes.length === 0 && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center bg-brand-yellow-400 hover:bg-brand-yellow-500 text-brand-gray-900 px-4 py-2 rounded-lg transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Notes
            </button>
          )}
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Note</h3>
            <p className="text-brand-gray-300 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-brand-gray-600 rounded-lg text-brand-gray-300 hover:bg-brand-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNote(deleteConfirmation)}
                className="px-4 py-2 bg-brand-yellow-400/20 text-brand-yellow-200 rounded-lg hover:bg-brand-yellow-400/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onUploadSuccess={() => {
            setIsUploadModalOpen(false);
            fetchNotes();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;