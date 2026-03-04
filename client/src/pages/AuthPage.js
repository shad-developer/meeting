import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Syne', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(102,126,234,0.15), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(118,75,162,0.12), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{
        width: '420px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 16px',
          }}>
            🎥
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
            MeetApp
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '6px 0 0' }}>
            {mode === 'login' ? 'Sign in to join meetings' : 'Create your account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '28px',
        }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                fontFamily: "'Syne', sans-serif",
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={inputStyle}
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#f87171',
              padding: '10px 14px',
              fontSize: '0.82rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              padding: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              fontFamily: "'Syne', sans-serif",
              marginTop: '4px',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#fff',
  padding: '13px 16px',
  fontSize: '0.9rem',
  fontFamily: "'Syne', sans-serif",
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default AuthPage;
