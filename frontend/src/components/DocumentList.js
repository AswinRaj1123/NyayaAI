import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const UPLOAD_API = 'http://localhost:8001';  // We'll add /documents later

function DocumentList() {
  const { token } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = async () => {
    try {
      // Temporary: we'll build proper endpoint tomorrow
      // For now, just show placeholder after upload
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDocuments();
      const interval = setInterval(fetchDocuments, 5000);  // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Your Documents</h3>
      {documents.length === 0 ? (
        <p>No documents uploaded yet. Upload one to see status!</p>
      ) : (
        <ul>
          {documents.map(doc => (
            <li key={doc.id}>
              <strong>{doc.filename}</strong> — Status: <em>{doc.status}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocumentList;