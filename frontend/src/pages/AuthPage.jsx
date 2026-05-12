import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  IconCar,
  IconHome,
  IconLock,
  IconSparkles,
  IconRocket,
  IconMail,
  IconRegister,
  IconSignIn,
  IconSettings,
  IconUser,
  IconAlertTriangle
} from '../components/Icons';

export default function AuthPage({ user, onAuth, authError }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const role = await onAuth({
        mode,
        username: form.username,
        password: form.password,
        email: form.email
      });
      if (role === 'admin') navigate('/admin');
      else if (role === 'driver') navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Background Animation */}
      <div className="auth-background">
        <div className="auth-overlay"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="auth-nav">
        <div className="auth-nav-content">
          <Link to="/" className="auth-nav-brand">
            <span className="brand-icon svg-icon-wrap" aria-hidden>
              <IconCar />
            </span>
            <span className="brand-text">Ndola Road Safety</span>
          </Link>
          <Link to="/" className="btn btn-secondary btn-back">
            <span className="btn-icon svg-icon-wrap" aria-hidden>
              <IconHome />
            </span>
            Back Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Auth Header */}
          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <span className="auth-icon svg-icon-wrap svg-icon-auth">
                {mode === 'login' ? <IconLock /> : <IconRocket />}
              </span>
            </div>
            <h1 className="auth-title">
              {mode === 'login' ? 'Welcome Back!' : 'Join Our Community'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Access your dashboard and continue making roads safer'
                : 'Start reporting accidents and helping others stay safe'
              }
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="auth-toggle">
            <button 
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`} 
              type="button" 
              onClick={() => setMode('login')}
            >
              <span className="tab-icon svg-icon-wrap" aria-hidden>
                <IconSignIn />
              </span>
              Sign In
            </button>
            <button 
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`} 
              type="button" 
              onClick={() => setMode('register')}
            >
              <span className="tab-icon svg-icon-wrap" aria-hidden>
                <IconRegister />
              </span>
              Register
            </button>
          </div>

          {/* Auth Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon svg-icon-wrap" aria-hidden>
                    <IconMail />
                  </span>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon svg-icon-wrap" aria-hidden>
                  <IconUser />
                </span>
                Username
              </label>
              <input
                className="form-input"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon svg-icon-wrap" aria-hidden>
                  <IconLock />
                </span>
                Password
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                required
              />
            </div>

            {authError && (
              <div className="form-status error">
                <span className="status-icon svg-icon-wrap" aria-hidden>
                  <IconAlertTriangle />
                </span>
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="btn-icon svg-icon-wrap" aria-hidden>
                    {mode === 'login' ? <IconRocket /> : <IconSparkles />}
                  </span>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="footer-text">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button 
                className="footer-link" 
                type="button" 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Register Now' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Admin Access */}
          <div className="admin-access">
            <button 
              className="btn btn-secondary btn-admin" 
              type="button" 
              onClick={() => navigate('/admin')}
            >
              <span className="btn-icon svg-icon-wrap" aria-hidden>
                <IconSettings />
              </span>
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
