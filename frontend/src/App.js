import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import DocumentDashboard from './components/DocumentDashboard';

function App() {
  const { user, token, login, register, logout } = useContext(AuthContext);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

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
        setEmail('');
        setPassword('');
        setName('');
      } else {
        await login(email, password);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (!authChecked) {
    return <p>Loading...</p>;
  }

  // Always require login first
  if (!user || !token) {
    return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '420px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        border: '1px solid var(--color-border-primary)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            NyayaAI
          </h1>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: '0.9375rem',
            marginBottom: 0
          }}>
            Your Legal Awareness Assistant
          </p>
        </div>

        <div style={{ 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          padding: '0.25rem',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className="secondary"
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: !isRegister ? 'var(--color-bg-secondary)' : 'transparent',
              color: !isRegister ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: !isRegister ? '1px solid var(--color-border-primary)' : 'none',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className="secondary"
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: isRegister ? 'var(--color-bg-secondary)' : 'transparent',
              color: isRegister ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: isRegister ? '1px solid var(--color-border-primary)' : 'none',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--color-text-primary)'
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--color-text-primary)'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--color-text-primary)'
              }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <button 
            type="submit" 
            style={{ 
              marginTop: '0.5rem',
              padding: '0.75rem',
              fontSize: '1rem'
            }}
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
    );
  }

  // Logged-in view
  return <DocumentDashboard />;
}

export default App;