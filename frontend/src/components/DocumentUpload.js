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
    </div>
  );
}

export default DocumentUpload;