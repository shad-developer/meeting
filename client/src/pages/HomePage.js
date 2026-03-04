import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  const createMeeting = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/rooms/create', {
        name: meetingName || `${user.name}'s Meeting`,
      });
      navigate(`/meeting/${data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    if (!joinCode.trim()) return setError('Please enter a room ID');
    setError('');
    setLoading(true);
    try {
      await api.get(`/rooms/${joinCode.trim().toUpperCase()}`);
      navigate(`/meeting/${joinCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      fontFamily: "'Syne', sans-serif",
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 20%, rgba(102,126,234,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(118,75,162,0.08) 0%, transparent 60%)',
      }} />

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>🎥</div>
          <span style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>MeetApp</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '0.85rem',
          }}>
            👤 {user?.name}
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.5)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 80px)',
        padding: '40px 20px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '800',
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            Video meetings,<br />reimagined.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', margin: 0 }}>
            HD video · Screen sharing · Group calls · Live chat
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '28px',
          }}>
            {['create', 'join'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  fontFamily: "'Syne', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                {t === 'create' ? '+ New Meeting' : '→ Join Meeting'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Meeting name (optional)"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={createMeeting}
                disabled={loading}
                style={primaryBtnStyle(loading)}
              >
                {loading ? 'Creating...' : '🎥 Start Meeting'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Enter Room ID (e.g. AB12CD34)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
                style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <button
                onClick={joinMeeting}
                disabled={loading || !joinCode.trim()}
                style={primaryBtnStyle(loading || !joinCode.trim())}
              >
                {loading ? 'Joining...' : '→ Join Meeting'}
              </button>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '14px',
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
        </div>

        {/* Features */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '48px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { icon: '🎙️', label: 'HD Audio' },
            { icon: '📷', label: 'HD Video' },
            { icon: '🖥️', label: 'Screen Share' },
            { icon: '💬', label: 'Live Chat' },
            { icon: '👥', label: 'Group Calls' },
            { icon: '🔒', label: 'Secure' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
            }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>
      </main>
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

const primaryBtnStyle = (disabled) => ({
  background: disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea, #764ba2)',
  border: 'none',
  borderRadius: '12px',
  color: '#fff',
  padding: '14px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: '700',
  fontSize: '1rem',
  fontFamily: "'Syne', sans-serif",
  transition: 'opacity 0.2s',
  opacity: disabled ? 0.6 : 1,
  width: '100%',
});

export default HomePage;
