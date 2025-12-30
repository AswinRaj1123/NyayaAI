import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'http://localhost:8001';  // Upload service will run on 8001
const QUERY_API = 'http://localhost:8003'; // Query service

function DocumentUpload() {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);

  // Fetch documents on component mount and auto-poll every 3 seconds
  useEffect(() => {
    fetchDocuments();
    const pollInterval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(pollInterval);
  }, [token]);

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDocuments(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
      setFile(null);
      // Refresh documents list
      setTimeout(fetchDocuments, 500);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  const handleAskQuestion = async () => {
    if (!selectedDocId || !question.trim()) {
      alert('Please select a document and enter a question');
      return;
    }

    setAsking(true);
    setAnswer(null);
    try {
      const res = await axios.post(
        `${QUERY_API}/query`,
        {
          document_id: selectedDocId,
          question: question
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setAnswer(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      alert('Query failed: ' + errorMsg);
      console.error('Query error:', err);
    }
    setAsking(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded':
        return '#fff3cd';
      case 'processing':
        return '#cfe2ff';
      case 'ready':
        return '#d1e7dd';
      case 'error':
        return '#f8d7da';
      default:
        return '#f8f9fa';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Upload Section */}
      <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '500px', marginBottom: '2rem' }}>
        <h2>Upload Legal Document</h2>
        <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        
        {result && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fff0' }}>
            <p><strong>Success!</strong> Document ID: {result.document_id}</p>
            <p>Status: {result.status}</p>
          </div>
        )}
      </div>

      {/* Documents List Section */}
      <div>
        <h2>Your Documents</h2>
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>No documents uploaded yet. Upload one to see status!</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {documents.map((doc) => {
              const isReady = doc.status === 'ready';
              return (
                <div
                  key={doc.document_id}
                  style={{
                    padding: '1rem',
                    border: `2px solid ${isReady ? '#28a745' : '#ddd'}`,
                    borderRadius: '8px',
                    background: getStatusColor(doc.status),
                    cursor: isReady ? 'pointer' : 'default'
                  }}
                  onClick={() => isReady && setSelectedDocId(doc.document_id)}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{doc.filename}</h3>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>ID:</strong> {doc.document_id}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Status:</strong> 
                    <span style={{
                      textTransform: 'capitalize',
                      marginLeft: '0.5rem',
                      fontWeight: 'bold',
                      color: isReady ? '#28a745' : doc.status === 'uploaded' ? '#ffc107' : '#17a2b8'
                    }}>
                      {doc.status}
                    </span>
                    {doc.status === 'processing' && ' ⏳'}
                    {isReady && ' ✓'}
                  </p>
                  {doc.created_at && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Uploaded:</strong> {new Date(doc.created_at).toLocaleString()}
                    </p>
                  )}
                  {isReady && selectedDocId === doc.document_id && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#28a745', fontSize: '0.9rem' }}>
                      ✓ Selected for questions
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Q&A Section */}
      {selectedDocId && documents.find(d => d.document_id === selectedDocId)?.status === 'ready' && (
        <div style={{
          marginTop: '2rem',
          padding: '2rem',
          border: '2px solid #28a745',
          borderRadius: '8px',
          background: '#f8fff9'
        }}>
          <h2>Ask a Question</h2>
          <p style={{ color: '#666' }}>
            Selected Document ID: <strong>{selectedDocId}</strong>
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question about the document..."
            style={{
              width: '100%',
              height: '100px',
              padding: '0.5rem',
              marginBottom: '1rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'Arial, sans-serif'
            }}
          />
          <button
            onClick={handleAskQuestion}
            disabled={asking || !question.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: asking ? 'wait' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {asking ? 'Getting Answer...' : 'Ask Question'}
          </button>

          {answer && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#e8f5e9',
              borderRadius: '4px',
              border: '1px solid #c8e6c9'
            }}>
              <h3>Answer:</h3>
              <p>{answer.answer}</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                <strong>Sources:</strong> {answer.sources} document sections
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;