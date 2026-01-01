import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function QueryBox({ documentId }) {
  const { token, QUERY_API, UPLOAD_API } = useContext(AuthContext);

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [history, setHistory] = useState([]);

  // --------------------------------------------------
  // Fetch chat history when document changes
  // --------------------------------------------------
  useEffect(() => {
    if (!documentId) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${UPLOAD_API}/documents/${documentId}/history`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };

    fetchHistory();
  }, [documentId, token, UPLOAD_API]);

  // --------------------------------------------------
  // Submit a new question
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !documentId) return;

    setLoading(true);
    setAnswer(null);

    try {
      const res = await axios.post(
        `${QUERY_API}/query`,
        {
          document_id: documentId,
          question: question,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnswer(res.data);
      setQuestion('');

      // Refresh history after successful query
      const historyRes = await axios.get(
        `${UPLOAD_API}/documents/${documentId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(historyRes.data);

    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-primary)', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-primary)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
            Ask a Question About Your Document
          </h3>

          {/* ---------------- Query Form ---------------- */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <textarea
              rows="4"
              placeholder="e.g., इस किराया समझौते में मेरी क्या जिम्मेदारियां हैं? (You can ask in Hindi or English)"
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

          {/* ---------------- Latest Answer ---------------- */}
          {answer && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-primary)',
                marginBottom: '2rem'
              }}
            >
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
                marginBottom: '1rem'
              }}>
                {answer.answer}
              </p>
              {answer.sources !== undefined && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-tertiary)',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--color-border-primary)'
                }}>
                  {answer.sources} relevant sections used
                </div>
              )}
            </div>
          )}

          {/* ---------------- Chat History ---------------- */}
          {history.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--color-border-primary)'
              }}>
                Chat History
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-primary)'
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Question
                      </span>
                      <p style={{ 
                        marginTop: '0.5rem',
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-primary)',
                        lineHeight: '1.6'
                      }}>
                        {entry.question}
                      </p>
                    </div>
                    
                    <div style={{ 
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border-primary)'
                    }}>
                      <span style={{ 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Answer
                      </span>
                      <p style={{ 
                        marginTop: '0.5rem',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-primary)',
                        lineHeight: '1.7'
                      }}>
                        {entry.answer}
                      </p>
                    </div>
                    
                    <div style={{ 
                      marginTop: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      {entry.asked_at
                        ? new Date(entry.asked_at).toLocaleString()
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueryBox;