import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'http://localhost:8001';  // Upload service will run on 8001

function DocumentUpload() {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch documents on component mount and after upload
  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
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
      setTimeout(fetchDocuments, 1000);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
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
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: getStatusColor(doc.status)
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{doc.filename}</h3>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>ID:</strong> {doc.document_id}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{doc.status}</span>
                </p>
                {doc.created_at && (
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                    <strong>Uploaded:</strong> {new Date(doc.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentUpload;