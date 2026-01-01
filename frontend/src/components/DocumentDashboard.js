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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'var(--color-bg-secondary)', 
        borderBottom: '1px solid var(--color-border-primary)',
        padding: '1.25rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>NyayaAI</h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Your Legal Awareness Assistant
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {user?.full_name || user?.email}
            </span>
            <button 
              onClick={logout}
              className="danger"
              style={{ 
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <DocumentUpload onUploadSuccess={fetchDocuments} />

        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Documents</h2>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: 'var(--color-text-secondary)'
            }}>
              Loading your documents...
            </div>
          ) : documents.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-primary)'
            }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
                No documents yet. Upload one above to get started!
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '1rem', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' 
            }}>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="card"
                  style={{
                    cursor: doc.status === 'ready' ? 'pointer' : 'default',
                    backgroundColor: selectedDoc?.id === doc.id ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                    border: selectedDoc?.id === doc.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border-primary)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => doc.status === 'ready' && setSelectedDoc(doc)}
                >
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    wordBreak: 'break-word'
                  }}>
                    {doc.filename}
                  </h3>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      Status: 
                    </span>
                    <span className={`status-badge status-${doc.status === 'uploaded' ? 'processing' : doc.status}`}>
                      {doc.status === 'uploaded' ? 'Processing' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--color-text-tertiary)',
                    marginBottom: 0
                  }}>
                    Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDoc && selectedDoc.status === 'ready' && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ 
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-primary)',
              padding: '1.5rem'
            }}>
              <div style={{ 
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--color-border-primary)'
              }}>
                <h2 style={{ fontSize: '1.125rem', margin: 0 }}>
                  Chat with: <span style={{ color: 'var(--color-text-secondary)' }}>{selectedDoc.filename}</span>
                </h2>
              </div>
              <AskQuestionSection documentId={selectedDoc.id} />
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ 
          marginTop: '3rem', 
          padding: '1.25rem 1.5rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Disclaimer:</strong>{' '}
          <span style={{ color: 'var(--color-text-secondary)' }}>
            NyayaAI is for legal awareness only. It is not legal advice. Always consult a qualified lawyer for legal matters.
          </span>
        </div>
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
      <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontSize: '0.9375rem',
          fontWeight: '500',
          color: 'var(--color-text-primary)'
        }}>
          Ask a question about your document
        </label>
        <textarea
          rows="4"
          placeholder="e.g., What are my responsibilities in this document? (You can type in Hindi or English)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ 
            fontSize: '0.9375rem',
            marginBottom: '0.75rem'
          }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.9375rem',
            fontWeight: '500'
          }}
        >
          {loading ? 'Thinking...' : 'Ask Question'}
        </button>
      </form>
      
      {answer && (
        <div style={{ 
          padding: '1.5rem',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-primary)'
        }}>
          <h4 style={{ 
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            Answer
          </h4>
          <p style={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.7',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
            marginBottom: '1rem'
          }}>
            {answer.answer}
          </p>
          <div style={{ 
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary)',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-border-primary)'
          }}>
            {answer.sources} relevant sections used
          </div>
        </div>
      )}
    </>
  );
}

export default DocumentDashboard;