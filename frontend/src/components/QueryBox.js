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
    <div
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        border: '1px solid #ddd',
        borderRadius: '10px',
      }}
    >
      <h3>Ask a Question About Your Document</h3>

      {/* ---------------- Query Form ---------------- */}
      <form onSubmit={handleSubmit}>
        <textarea
          rows="3"
          placeholder="e.g., इस किराया समझौते में मेरी क्या जिम्मेदारियां हैं?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: '10px', padding: '10px 20px' }}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {/* ---------------- Latest Answer ---------------- */}
      {answer && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#f8fffe',
            borderRadius: '8px',
            border: '1px solid #0fb5a8',
          }}
        >
          <h4>Answer</h4>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {answer.answer}
          </p>
          {answer.sources !== undefined && (
            <small>{answer.sources} relevant sections used</small>
          )}
        </div>
      )}

      {/* ---------------- Chat History ---------------- */}
      {history.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h4>Chat History</h4>

          {history.map((entry, i) => (
            <div
              key={i}
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <p>
                <strong>Q:</strong> {entry.question}
              </p>
              <p>
                <strong>A:</strong>{' '}
                <span style={{ whiteSpace: 'pre-wrap' }}>
                  {entry.answer}
                </span>
              </p>
              <small>
                {entry.asked_at
                  ? new Date(entry.asked_at).toLocaleString()
                  : ''}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QueryBox;