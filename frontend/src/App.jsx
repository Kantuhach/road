import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import ReportPage from './pages/ReportPage';
import SystemFeatures from './components/SystemFeatures';

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = window.localStorage.getItem('roadAppUser');
    return stored ? JSON.parse(stored) : null;
  });

  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('roadAppUser', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('roadAppUser');
    }
  }, [user]);

  const handleAuth = async ({ mode, username, password, email }) => {
    setAuthError('');
    try {
      const url = mode === 'login' ? 'http://localhost:8080/api/auth/login' : 'http://localhost:8080/api/auth/register';
      const payload = { username, password, ...(mode === 'register' ? { email } : {}) };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Authentication failed (${response.status})`);
      }
      const driver = await response.json();
      setUser(driver);
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Unable to authenticate. Check your credentials or register first.');
    }
  };

  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onAuth={handleAuth} authError={authError} />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/auth" replace />}
        />
        <Route path="/report" element={user ? <ReportPage user={user} /> : <Navigate to="/auth" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/features" element={<SystemFeatures />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
