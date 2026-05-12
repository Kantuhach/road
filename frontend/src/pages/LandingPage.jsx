import { Link } from 'react-router-dom';
import {
  IconCar,
  IconClipboard,
  IconLock,
  IconChart,
  IconAlertTriangle,
  IconMapPin,
  IconUsers,
  IconMobile,
  IconCompass,
  IconBell,
  IconShield,
  IconRocket
} from '../components/Icons';

export default function LandingPage({ user }) {
  const primaryDestination = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="landing-shell">
      <nav className="nav-header">
        <div className="nav-content">
          <div className="nav-brand">
            <span className="brand-icon svg-icon-wrap">
              <IconCar />
            </span>
            <span className="brand-text">Ndola Road Safety</span>
          </div>
          <div className="nav-actions">
            <Link className="btn btn-secondary btn-nav" to="/features">
              <span className="btn-icon svg-icon-wrap">
                <IconClipboard />
              </span>
              Features
            </Link>
            {!user && (
              <Link className="btn btn-primary btn-nav btn-login" to="/auth">
                <span className="btn-icon svg-icon-wrap">
                  <IconLock />
                </span>
                Sign In
              </Link>
            )}
            {user && (
              <Link className="btn btn-primary btn-nav btn-dashboard" to={primaryDestination}>
                <span className="btn-icon svg-icon-wrap">
                  <IconChart />
                </span>
                {user.role === 'admin' ? 'Admin console' : 'Dashboard'}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon svg-icon-wrap">
              <IconCar />
            </span>
            <span className="badge-text">Ndola Road Safety Initiative</span>
          </div>

          <h1 className="hero-title">
            <span className="title-gradient">Drive Safer</span>
            <br />
            <span className="title-emphasis">Arrive Smarter</span>
          </h1>

          <p className="hero-description">
            Real-time accident alerts on a live Google Map for Ndola, verified admin workflows, and photo-backed
            driver reports so everyone can choose safer corridors.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">Live</div>
              <div className="stat-label">Map updates</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Reporting</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">GPS</div>
              <div className="stat-label">Proximity cues</div>
            </div>
          </div>

          <div className="hero-actions">
            <Link className="btn btn-primary btn-hero" to={user ? primaryDestination : '/auth'}>
              <span className="btn-icon svg-icon-wrap">
                <IconRocket />
              </span>
              {user ? (user.role === 'admin' ? 'Open admin console' : 'Enter dashboard') : 'Start as driver'}
            </Link>
            <Link className="btn btn-secondary btn-hero" to="/features">
              <span className="btn-icon svg-icon-wrap">
                <IconClipboard />
              </span>
              Discover features
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-cards">
            <div className="card card-1">
              <div className="card-icon svg-icon-wrap">
                <IconAlertTriangle />
              </div>
              <div className="card-title">Live alerts</div>
              <div className="card-description">Verified incidents on the map</div>
            </div>
            <div className="card card-2">
              <div className="card-icon svg-icon-wrap">
                <IconMapPin />
              </div>
              <div className="card-title">Detours</div>
              <div className="card-description">Suggested routes around hazards</div>
            </div>
            <div className="card card-3">
              <div className="card-icon svg-icon-wrap">
                <IconUsers />
              </div>
              <div className="card-title">Community</div>
              <div className="card-description">Photos & coordinates to admins</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-highlight">Built for</span>
            <br />
            Ndola road safety
          </h2>
          <p className="section-subtitle">
            One palette for drivers and administrators — MongoDB-backed incidents and Google Maps for clarity on the
            ground.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon svg-icon-wrap">
                <IconMobile />
              </span>
            </div>
            <h3 className="feature-title">Instant reporting</h3>
            <p className="feature-description">
              Submit location, road context, and scene photos. Pending reports appear in the admin console for approval.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon svg-icon-wrap">
                <IconCompass />
              </span>
            </div>
            <h3 className="feature-title">Google Maps routing</h3>
            <p className="feature-description">
              Drivers view hotspots and active incidents on Map tiles; optional detours use Directions with alternative
              scoring away from the hazard.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon svg-icon-wrap">
                <IconBell />
              </span>
            </div>
            <h3 className="feature-title">Live websocket channel</h3>
            <p className="feature-description">
              When admins verify or clear incidents, connected dashboards refresh without a manual reload.
            </p>
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-content">
          <div className="trust-badge">
            <span className="trust-icon svg-icon-wrap">
              <IconShield />
            </span>
            <span className="trust-text">Designed for coordinated response</span>
          </div>

          <h3 className="trust-title">Drivers report. Administrators verify. Everyone sees the same live picture.</h3>

          <div className="trust-metrics">
            <div className="metric">
              <div className="metric-value">MongoDB</div>
              <div className="metric-label">Incident store</div>
            </div>
            <div className="metric">
              <div className="metric-value">JWT</div>
              <div className="metric-label">Secure roles</div>
            </div>
            <div className="metric">
              <div className="metric-value">Maps</div>
              <div className="metric-label">Ndola-first UX</div>
            </div>
          </div>

          <div className="trust-cta">
            <Link className="btn btn-primary btn-trust" to={user ? primaryDestination : '/auth'}>
              <span className="btn-icon svg-icon-wrap">
                <IconCar />
              </span>
              {user ? (user.role === 'admin' ? 'Admin console' : 'Continue to dashboard') : 'Create driver account'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
