import React, { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import DocumentUpload from './components/DocumentUpload';

function App() {
  const { user, login, register, logout } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(email, password, name);
        alert('Registered! Now login.');
        setIsRegister(false);
      } else {
        await login(email, password);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  // -----------------------------
  // LOGGED-IN VIEW
  // -----------------------------
  if (user) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Welcome, {user.full_name || user.email}!</h1>
        <p>You are logged in.</p>

        {/* ✅ Document Upload & List */}
        <DocumentUpload />

        <br />
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  // -----------------------------
  // AUTH VIEW
  // -----------------------------
  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h1>NyayaAI</h1>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <br /><br />

        {isRegister && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <br /><br />
          </>
        )}

        <button type="submit">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>

      <p>
        {isRegister ? 'Already have an account?' : "Don't have an account?"}
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          style={{ marginLeft: '0.5rem' }}
        >
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
}

export default App;