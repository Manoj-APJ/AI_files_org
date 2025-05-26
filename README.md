# AI-Powered Lecture Notes Organizer

A comprehensive application for organizing, analyzing, and annotating lecture notes with AI assistance.

## Features

- **User Authentication**: Secure login and signup using Firebase Authentication
- **Dashboard**: View and manage all your uploaded notes
- **Notes Upload**: Support for PDF, images, text, and markdown files
- **OCR Processing**: Extract text from images and PDFs using Tesseract.js
- **AI Classification**: Automatically categorize notes based on content
- **Tagging System**: Add and manage tags for better organization
- **Search & Filtering**: Find notes by title, content, category, or tags
- **Annotation System**: Highlight text and add annotations to your notes
- **PDF Viewer**: Built-in PDF viewer with annotation support
- **Markdown Support**: View and annotate markdown files
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Storage**: Firebase Storage
- **OCR**: Tesseract.js
- **PDF Handling**: react-pdf
- **Markdown Rendering**: react-markdown
- **File Upload**: react-dropzone
- **Routing**: react-router-dom

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your Firebase configuration
4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/src/components`: Reusable UI components
- `/src/contexts`: React context providers
- `/src/pages`: Main application pages
- `/src/types`: TypeScript type definitions
- `/src/firebase.ts`: Firebase configuration

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up Firebase Storage
5. Add your Firebase configuration to the `.env` file

## License

MIT