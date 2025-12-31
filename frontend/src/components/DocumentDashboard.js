import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DocumentUpload from './DocumentUpload';
import QueryBox from './QueryBox';

const UPLOAD_API = 'http://localhost:8001';

function DocumentDashboard() {
  const { token } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${UPLOAD_API}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
      const interval = setInterval(fetchDocuments, 8000);  // Poll every 8s
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: 'auto' }}>
      <h1>NyayaAI — Your Legal Awareness Assistant</h1>
      <DocumentUpload onUploadSuccess={fetchDocuments} />

      <h2 style={{ marginTop: '3rem' }}>Your Documents</h2>
      {loading ? <p>Loading...</p> : (
        documents.length === 0 ? <p>No documents yet. Upload one above!</p> :
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {documents.map(doc => (
            <div
              key={doc.id}
              style={{
                padding: '1.5rem',
                border: '2px solid #ccc',
                borderRadius: '12px',
                cursor: doc.status === 'ready' ? 'pointer' : 'default',
                background: selectedDoc?.id === doc.id ? '#e6f7ff' : '#fff'
              }}
              onClick={() => doc.status === 'ready' && setSelectedDoc(doc)}
            >
              <h3>{doc.filename}</h3>
              <p><strong>Status:</strong> 
                <span style={{
                  color: doc.status === 'ready' ? 'green' : doc.status === 'error' ? 'red' : 'orange'
                }}>
                  {doc.status === 'uploaded' ? 'Uploaded' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </span>
              </p>
              <small>Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && selectedDoc.status === 'ready' && (
        <div style={{ marginTop: '3rem' }}>
          <h2>Chat with: {selectedDoc.filename}</h2>
          <QueryBox documentId={selectedDoc.id} />
        </div>
      )}

      <div style={{ marginTop: '4rem', padding: '1.5rem', background: '#fff3cd', borderRadius: '8px' }}>
        <strong>Disclaimer:</strong> NyayaAI is for legal awareness only. It is not legal advice. Always consult a qualified lawyer.
      </div>
    </div>
  );
}

export default DocumentDashboard;