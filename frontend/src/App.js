import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PDFViewer from './components/PDFViewer';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);

  // PDF Viewer state
  const [viewingPdf, setViewingPdf] = useState(null);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchPDFs();
    }
  }, [token]);

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  const fetchUser = async () => {
    try {
      // Simple validation - in production, verify token with backend
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.userId, email: payload.email });
    } catch (err) {
      console.error('Error fetching user:', err);
      logout();
    }
  };

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pdfs');
      setPdfs(response.data.pdfs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      setError(null);
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        email,
        password,
      });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setSuccess('Account created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      setError(null);
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setSuccess('Logged in successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPdfs([]);
    setSearchResults(null);
    setQaAnswer(null);
    localStorage.removeItem('token');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('pdf');

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      const uploadData = new FormData();
      uploadData.append('pdf', file);

      const response = await api.post('/pdfs/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`PDF uploaded successfully! Processed ${response.data.pdf.chunkCount} chunks.`);
      fetchPDFs();
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/pdfs/${pdfId}`);
      setSuccess('PDF deleted successfully');
      fetchPDFs();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleViewPDF = async (pdfId) => {
    try {
      setError(null);
      const response = await api.get(`/pdfs/${pdfId}/view`);
      setPdfViewerUrl(response.data.url);
      setViewingPdf(pdfId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load PDF');
    }
  };

  const closePDFViewer = () => {
    setViewingPdf(null);
    setPdfViewerUrl(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/search/semantic', {
        query: searchQuery,
        limit: 10,
      });
      setSearchResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    try {
      setError(null);
      setQaLoading(true);
      const response = await api.post('/qa/ask', { question });
      setQaAnswer(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get answer');
    } finally {
      setQaLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container">
        <div className="auth-container">
          <h1>AI PDF Organizer</h1>
          <p>Sign up or log in to organize your PDFs with AI</p>

          <div className="auth-tabs">
            <div className="tab-content">
              <h2>Sign Up</h2>
              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" required minLength={6} />
                </div>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing up...' : 'Sign Up'}
                </button>
              </form>
            </div>

            <div className="tab-content">
              <h2>Log In</h2>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" required />
                </div>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>AI PDF Organizer</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Upload Section */}
      <div className="card">
        <h2>Upload PDF</h2>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <input type="file" name="pdf" accept=".pdf" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </form>
      </div>

      {/* Search Section */}
      <div className="card">
        <h2>Semantic Search</h2>
        <p className="section-description">
          Search your PDFs by meaning, not just keywords
        </p>
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults && (
          <div className="search-results">
            <h3>Results ({searchResults.totalResults})</h3>
            {searchResults.results.length === 0 ? (
              <p>No results found</p>
            ) : (
              searchResults.results.map((result, idx) => (
                <div key={idx} className="search-result-item">
                  <div className="result-header">
                    <h4>{result.pdf.originalFilename || result.pdf.filename}</h4>
                    <button
                      onClick={() => handleViewPDF(result.pdf.id)}
                      className="btn btn-primary btn-sm"
                    >
                      View PDF
                    </button>
                  </div>
                  <p className="relevance-score">
                    Relevance: {(result.relevanceScore * 100).toFixed(1)}%
                  </p>
                  <p className="preview">{result.preview}...</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Q&A Section */}
      <div className="card">
        <h2>Ask Questions</h2>
        <p className="section-description">
          Ask questions about your PDFs and get AI-powered answers
        </p>
        <form onSubmit={handleAskQuestion}>
          <div className="form-group">
            <textarea
              placeholder="What would you like to know?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={qaLoading}>
            {qaLoading ? 'Thinking...' : 'Ask Question'}
          </button>
        </form>

        {qaAnswer && (
          <div className="qa-answer">
            <h3>Answer</h3>
            <p>{qaAnswer.answer}</p>
            {qaAnswer.sources && qaAnswer.sources.length > 0 && (
              <div className="sources">
                <h4>Sources:</h4>
                <ul>
                  {qaAnswer.sources.map((source, idx) => (
                    <li key={idx}>
                      {source.filename}
                      {source.pageNumber && ` (Page ${source.pageNumber})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDFs List */}
      <div className="card">
        <h2>Your PDFs ({pdfs.length})</h2>
        {loading && !pdfs.length ? (
          <div className="loading">Loading PDFs...</div>
        ) : pdfs.length === 0 ? (
          <p>No PDFs uploaded yet</p>
        ) : (
          <div className="pdfs-list">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="pdf-item">
                <div className="pdf-info">
                  <h4>{pdf.original_filename}</h4>
                  <p className="pdf-meta">
                    {pdf.page_count} pages •{' '}
                    {(pdf.file_size / 1024).toFixed(2)} KB •{' '}
                    {new Date(pdf.upload_date).toLocaleDateString()}
                  </p>
                  {pdf.tags && pdf.tags.length > 0 && (
                    <div className="tags">
                      {pdf.tags.map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pdf-actions">
                  <button
                    onClick={() => handleViewPDF(pdf.id)}
                    className="btn btn-primary"
                  >
                    View
                  </button>
                <div className="pdf-actions">
                  <button
                    onClick={() => handleViewPDF(pdf.id)}
                    className="btn btn-primary"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      {viewingPdf && (
        <PDFViewer pdfUrl={pdfViewerUrl} onClose={closePDFViewer} />
      )}
    </div>
  );
}

export default App;

