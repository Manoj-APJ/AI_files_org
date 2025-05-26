export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileType: 'pdf' | 'image' | 'text' | 'markdown';
  category?: string;
  tags?: string[];
  summary?: string;
  annotations?: Annotation[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface Annotation {
  id: string;
  text: string;
  content: string;
  color: string;
  position: {
    x: number;
    y: number;
    pageNumber?: number;
  };
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}