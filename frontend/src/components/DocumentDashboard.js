import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DocumentUpload from './DocumentUpload';

function DocumentDashboard() {
  const { token, user, logout, UPLOAD_API } = useContext(AuthContext);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>NyayaAI — Your Legal Awareness Assistant</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {user?.full_name || user?.email}
          </span>
          <button 
            onClick={logout}
            style={{ 
              padding: '8px 16px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
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
          <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '10px' }}>
            <AskQuestionSection documentId={selectedDoc.id} />
          </div>
        </div>
      )}

      <div style={{ marginTop: '4rem', padding: '1.5rem', background: '#fff3cd', borderRadius: '8px' }}>
        <strong>Disclaimer:</strong> NyayaAI is for legal awareness only. It is not legal advice. Always consult a qualified lawyer.
      </div>
    </div>
  );
}

function AskQuestionSection({ documentId }) {
  const { token, QUERY_API } = useContext(AuthContext);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer(null);
    
    try {
      const res = await axios.post(`${QUERY_API}/query`, {
        document_id: documentId,
        question: question
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnswer(res.data);
      setQuestion('');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  return (
    <>
      <h3>Ask a Question About Your Document</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="3"
          placeholder="e.g., What are my responsibilities in this document?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          required
        />
        <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '10px 20px' }}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      
      {answer && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fffe', borderRadius: '8px', border: '1px solid #0fb5a8' }}>
          <h4>Answer:</h4>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{answer.answer}</p>
          <small>{answer.sources} relevant sections used</small>
        </div>
      )}
    </>
  );
}

export default DocumentDashboard;