import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const QUERY_API = 'http://localhost:8003';  // Query service port

function QueryBox({ documentId }) {
  const { token } = useContext(AuthContext);
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
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '10px' }}>
      <h3>Ask a Question About Your Document</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="3"
          placeholder="e.g., इस किराया समझौते में मेरी क्या जिम्मेदारियां हैं?"
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
    </div>
  );
}

export default QueryBox;