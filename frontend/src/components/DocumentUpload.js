import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function DocumentUpload({ onUploadSuccess }) {
  const { token, UPLOAD_API } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch documents on component mount and auto-poll every 3 seconds
  useEffect(() => {
    fetchDocuments();
    const pollInterval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(pollInterval);
  }, [token]);

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${UPLOAD_API}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${UPLOAD_API}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
      setFile(null);
      // Refresh documents list
      onUploadSuccess();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      border: '1px solid var(--color-border-primary)',
      marginBottom: '1rem'
    }}>
      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Upload Legal Document</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ 
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--color-text-primary)'
          }}>
            Choose a file (PDF, DOCX, or TXT)
          </label>
          <input 
            type="file" 
            accept=".pdf,.docx,.txt" 
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          />
        </div>
        
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.9375rem',
            alignSelf: 'flex-start'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
        
        {result && (
          <div style={{ 
            padding: '1rem 1.25rem',
            backgroundColor: '#dcfce7',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #86efac'
          }}>
            <p style={{ 
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#15803d',
              marginBottom: '0.25rem'
            }}>
              ✓ Document uploaded successfully!
            </p>
            <p style={{ 
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 0
            }}>
              Status: {result.status} • ID: {result.document_id}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentUpload;