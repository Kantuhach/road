import { Link } from 'react-router-dom';

export default function LandingPage({ user }) {
  return (
    <div className="landing-shell">
      {/* Navigation Header */}
      <nav className="nav-header">
        <div className="nav-content">
          <div className="nav-brand">
            <span className="brand-icon">🚗</span>
            <span className="brand-text">Ndola Road Safety</span>
          </div>
          <div className="nav-actions">
            <Link className="btn btn-secondary btn-nav" to="/features">
              <span className="btn-icon">📋</span>
              Features
            </Link>
            {!user && (
              <Link className="btn btn-primary btn-nav btn-login" to="/auth">
                <span className="btn-icon">🔐</span>
                Sign In
              </Link>
            )}
            {user && (
              <Link className="btn btn-primary btn-nav btn-dashboard" to="/dashboard">
                <span className="btn-icon">📊</span>
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🚗</span>
            <span className="badge-text">Ndola Road Safety Initiative</span>
          </div>
          
          <h1 className="hero-title">
            <span className="title-gradient">Drive Safer</span>
            <br />
            <span className="title-emphasis">Arrive Smarter</span>
          </h1>
          
          <p className="hero-description">
            Transform your daily commute with real-time accident alerts, intelligent route optimization,
            and community-driven safety insights across Ndola's road network.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Live Monitoring</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
          </div>
          
          <div className="hero-actions">
            <Link className="btn btn-primary btn-hero" to={user ? '/dashboard' : '/auth'}>
              <span className="btn-icon">🚀</span>
              {user ? 'Enter Dashboard' : 'Start Your Journey'}
            </Link>
            <Link className="btn btn-secondary btn-hero" to="/features">
              <span className="btn-icon">📋</span>
              Discover Features
            </Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="card card-1">
              <div className="card-icon">⚠️</div>
              <div className="card-title">Live Alerts</div>
              <div className="card-description">Instant accident notifications</div>
            </div>
            <div className="card card-2">
              <div className="card-icon">🗺️</div>
              <div className="card-title">Smart Routes</div>
              <div className="card-description">AI-powered navigation</div>
            </div>
            <div className="card card-3">
              <div className="card-icon">👥</div>
              <div className="card-title">Community</div>
              <div className="card-description">Real-time reporting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-highlight">Revolutionary</span>
            <br />
            Road Safety Features
          </h2>
          <p className="section-subtitle">
            Experience the future of road safety with cutting-edge technology designed for Ndola drivers
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">📱</span>
            </div>
            <h3 className="feature-title">Instant Reporting</h3>
            <p className="feature-description">
              Report accidents with photos and details in seconds. Our streamlined interface ensures
              critical information reaches the community instantly.
            </p>
            <div className="feature-cta">
              <span className="cta-text">Learn More →</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🧭</span>
            </div>
            <h3 className="feature-title">Intelligent Navigation</h3>
            <p className="feature-description">
              AI-powered route optimization that automatically redirects you around accident hotspots
              and traffic congestion for safer, faster journeys.
            </p>
            <div className="feature-cta">
              <span className="cta-text">Explore Routes →</span>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🔔</span>
            </div>
            <h3 className="feature-title">Proactive Alerts</h3>
            <p className="feature-description">
              Receive real-time notifications when approaching high-risk areas. Stay informed
              and make safer driving decisions before reaching potential hazards.
            </p>
            <div className="feature-cta">
              <span className="cta-text">Setup Alerts →</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="trust-content">
          <div className="trust-badge">
            <span className="trust-icon">🛡️</span>
            <span className="trust-text">Trusted by Ndola Drivers</span>
          </div>
          
          <h3 className="trust-title">
            Join Thousands of Drivers Making Safer Choices Every Day
          </h3>
          
          <div className="trust-metrics">
            <div className="metric">
              <div className="metric-value">1M+</div>
              <div className="metric-label">Accidents Prevented</div>
            </div>
            <div className="metric">
              <div className="metric-value">4.8★</div>
              <div className="metric-label">User Rating</div>
            </div>
            <div className="metric">
              <div className="metric-value">365</div>
              <div className="metric-label">Days Active</div>
            </div>
          </div>
          
          <div className="trust-cta">
            <Link className="btn btn-primary btn-trust" to={user ? '/dashboard' : '/auth'}>
              <span className="btn-icon">🎯</span>
              {user ? 'Continue to Dashboard' : 'Join Community Now'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
