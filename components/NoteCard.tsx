import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileImage, FileCode, Calendar, Tag } from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getFileIcon = () => {
    switch (note.fileType) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-brand-yellow-400" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-brand-yellow-400" />;
      case 'markdown':
        return <FileCode className="h-6 w-6 text-brand-yellow-400" />;
      default:
        return <FileText className="h-6 w-6 text-brand-yellow-400" />;
    }
  };

  const getCategoryColor = () => {
    switch (note.category) {
      case 'Math':
        return 'bg-brand-yellow-400/20 text-brand-yellow-200';
      case 'Science':
        return 'bg-brand-yellow-400/20 text-brand-yellow-200';
      case 'History':
        return 'bg-brand-yellow-400/20 text-brand-yellow-200';
      case 'Literature':
        return 'bg-brand-yellow-400/20 text-brand-yellow-200';
      case 'Computer Science':
        return 'bg-brand-yellow-400/20 text-brand-yellow-200';
      default:
        return 'bg-brand-yellow-400/20 text-brand-yellow-200';
    }
  };

  return (
    <Link to={`/notes/${note.id}`} className="block">
      <div className="bg-brand-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-200 h-full flex flex-col border border-brand-gray-700">
        <div className="p-5 flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-brand-gray-700 rounded-lg">
              {getFileIcon()}
            </div>
            {note.category && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getCategoryColor()}`}>
                {note.category}
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">{note.title}</h3>
          
          {note.summary && (
            <p className="text-brand-gray-300 mb-4 text-sm line-clamp-3">{note.summary}</p>
          )}
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {note.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="inline-flex items-center text-xs bg-brand-gray-700 text-brand-gray-300 px-2 py-1 rounded-full">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="inline-flex items-center text-xs bg-brand-gray-700 text-brand-gray-300 px-2 py-1 rounded-full">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="px-5 py-3 bg-brand-gray-700/50 border-t border-brand-gray-700 flex items-center text-xs text-brand-gray-400">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(note.createdAt)}
        </div>
      </div>
    </Link>
  );
};

export default NoteCard;