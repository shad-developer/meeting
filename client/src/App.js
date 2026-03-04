import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MeetingPage from './pages/MeetingPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid rgba(102,126,234,0.3)',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={<PublicRoute><AuthPage /></PublicRoute>}
            />
            <Route
              path="/"
              element={<PrivateRoute><HomePage /></PrivateRoute>}
            />
            <Route
              path="/meeting/:roomId"
              element={<PrivateRoute><MeetingPage /></PrivateRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
