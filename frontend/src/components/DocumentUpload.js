import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'http://localhost:8001';  // Upload service will run on 8001

function DocumentUpload() {
  const { token } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

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
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '500px' }}>
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
  );
}

export default DocumentUpload;