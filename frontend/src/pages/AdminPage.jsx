import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../apiConfig';
import HotspotAdmin from '../components/HotspotAdmin';
import AccidentVerificationPanel from '../components/AccidentVerificationPanel';
import AdminMapSettings from '../components/AdminMapSettings';
import AdminEmailSettings from '../components/AdminEmailSettings';
import AdminUsersPanel from '../components/AdminUsersPanel';
import {
  IconShield,
  IconLogout,
  IconUser,
  IconChart,
  IconAlertTriangle,
  IconMapPin,
  IconSearch,
  IconClipboard,
  IconCheck,
  IconHourglass,
  IconSettings
} from '../components/Icons';

const TAB_COPY = {
  dashboard: { title: 'Overview', subtitle: 'System pulse at a glance.' },
  accidents: { title: 'Incident queue', subtitle: 'Verify driver reports and manage clearance.' },
  hotspots: { title: 'Hotspots', subtitle: 'Place corridors on the map — drivers see them live.' },
  analytics: { title: 'Analytics', subtitle: 'Quick counts from live data.' },
  users: { title: 'Users', subtitle: 'Create accounts — drivers sign in with username or email.' },
  settings: { title: 'Settings', subtitle: 'Maps API key, SMTP email, and notifications.' }
};

export default function AdminPage({ appUser, setAppUser }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(() => appUser?.role === 'admin');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [hotspots, setHotspots] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  useEffect(() => {
    if (appUser?.role === 'admin') {
      setAuthenticated(true);
    }
  }, [appUser]);

  useEffect(() => {
    if (!authenticated) return;
    axios
      .get('/api/settings/maps')
      .then((res) => setGoogleMapsApiKey(typeof res.data?.googleMapsApiKey === 'string' ? res.data.googleMapsApiKey.trim() : ''))
      .catch(() => setGoogleMapsApiKey(''));
  }, [authenticated]);

  useEffect(() => {
    if (authenticated) {
      loadHotspots();
      loadAccidents();
    }
  }, [authenticated, appUser?.token]);

  const stats = useMemo(
    () => ({
      activeAlerts: accidents.filter((a) => ['active', 'pending'].includes(a.status)).length,
      verified: accidents.filter((a) => a.verified).length,
      pendingVerify: accidents.filter(
        (a) => !a.verified && !['cleared', 'resolved'].includes(a.status)
      ).length,
      totalHotspots: hotspots.length
    }),
    [accidents, hotspots]
  );

  const loadHotspots = async () => {
    try {
      const response = await axios.get('/api/hotspots');
      setHotspots(response.data || []);
    } catch (e) {
      console.error(e);
      setHotspots([]);
    }
  };

  const loadAccidents = async () => {
    try {
      const token = appUser?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get('/api/accidents', { headers });
      const list = response.data.accidents ?? response.data;
      setAccidents(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setAccidents([]);
    }
  };

  const filteredAccidents = accidents.filter((accident) => {
    const matchesSearch =
      accident.roadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.town?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || accident.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.trim(), password: form.password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials.');
      }
      setAppUser({
        token: data.token,
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        email: data.user.email || ''
      });
      setAuthenticated(true);
      setForm({ username: '', password: '' });
    } catch (e) {
      setError(e.message || 'Access denied.');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAppUser(null);
    setForm({ username: '', password: '' });
    navigate('/');
  };

  const statsCards = (
    <div className="stats-grid modern-stats-grid">
      <div className="stat-card glass-stat primary">
        <div className="stat-icon svg-icon-wrap">
          <IconAlertTriangle />
        </div>
        <div className="stat-info">
          <h3>Active alerts</h3>
          <span className="stat-value">{stats.activeAlerts}</span>
        </div>
      </div>
      <div className="stat-card glass-stat success">
        <div className="stat-icon svg-icon-wrap">
          <IconCheck />
        </div>
        <div className="stat-info">
          <h3>Verified</h3>
          <span className="stat-value">{stats.verified}</span>
        </div>
      </div>
      <div className="stat-card glass-stat warning">
        <div className="stat-icon svg-icon-wrap">
          <IconHourglass />
        </div>
        <div className="stat-info">
          <h3>Pending review</h3>
          <span className="stat-value">{stats.pendingVerify}</span>
        </div>
      </div>
      <div className="stat-card glass-stat danger">
        <div className="stat-icon svg-icon-wrap">
          <IconMapPin />
        </div>
        <div className="stat-info">
          <h3>Hotspots</h3>
          <span className="stat-value">{stats.totalHotspots}</span>
        </div>
      </div>
    </div>
  );

  const authToken = appUser?.token;

  return (
    <>
      {!authenticated ? (
        <div className="admin-login-shell">
          <style>{`
            .admin-login-shell {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: linear-gradient(145deg, #0f172a 0%, #134e4a 45%, #0f766e 100%);
            }
            .admin-login-card {
              width: 100%;
              max-width: 440px;
              padding: 40px;
              border-radius: 20px;
              background: rgba(255,255,255,0.97);
              box-shadow: 0 25px 80px rgba(15,23,42,0.35);
            }
            .admin-login-card h1 { margin: 0 0 8px; font-size: 1.75rem; color: #0f172a; }
            .admin-login-badge {
              display: inline-flex; align-items: center; gap: 10px;
              background: linear-gradient(135deg, #0d9488, #0f766e);
              color: white; padding: 8px 16px; border-radius: 999px;
              font-weight: 700; font-size: 0.85rem; margin-bottom: 20px;
            }
          `}</style>
          <div className="admin-login-card">
            <div className="admin-login-badge">
              <IconShield /> RTSA Admin
            </div>
            <h1>Sign in</h1>
            <p className="muted" style={{ marginBottom: '24px' }}>
              Authorized personnel — manage incidents, hotspots, and map settings.
            </p>
            <form className="auth-form modern-form" onSubmit={handleLogin}>
              <label className="form-label-block">
                Username or email
                <input
                  value={form.username}
                  onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </label>
              <label className="form-label-block">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
              </label>
              {error && <p className="form-status error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-wide">
                Continue
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="admin-app">
          <aside className="admin-sidebar-modern">
            <div className="admin-sidebar-brand">
              <span className="svg-icon-wrap admin-brand-icon">
                <IconShield />
              </span>
              <div>
                <div className="admin-brand-title">Control center</div>
                <div className="admin-brand-sub">Ndola roads</div>
              </div>
            </div>

            <nav className="admin-sidebar-nav">
              <button
                type="button"
                className={`admin-side-link${activeTab === 'dashboard' ? ' active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <IconChart /> Overview
              </button>
              <button
                type="button"
                className={`admin-side-link${activeTab === 'accidents' ? ' active' : ''}`}
                onClick={() => setActiveTab('accidents')}
              >
                <IconAlertTriangle /> Incidents
              </button>
              <button
                type="button"
                className={`admin-side-link${activeTab === 'hotspots' ? ' active' : ''}`}
                onClick={() => setActiveTab('hotspots')}
              >
                <IconMapPin /> Hotspots
              </button>
              <button
                type="button"
                className={`admin-side-link${activeTab === 'analytics' ? ' active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <IconClipboard /> Analytics
              </button>
              <button
                type="button"
                className={`admin-side-link${activeTab === 'users' ? ' active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <IconUser /> Users
              </button>
              <button
                type="button"
                className={`admin-side-link${activeTab === 'settings' ? ' active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <IconSettings /> Settings
              </button>
            </nav>

            <div className="admin-sidebar-foot">
              <div className="admin-user-mini">{appUser?.username}</div>
              <button type="button" className="btn btn-ghost admin-logout-side" onClick={handleLogout}>
                <IconLogout /> Sign out
              </button>
            </div>
          </aside>

          <main className="admin-main-modern">
            <header className="admin-page-head">
              <div>
                <h1 className="admin-page-title">{TAB_COPY[activeTab].title}</h1>
                <p className="admin-page-sub muted">{TAB_COPY[activeTab].subtitle}</p>
              </div>
              <div className="admin-head-meta muted">
                {hotspots.length} hotspots · {accidents.length} reports
              </div>
            </header>

            {activeTab === 'analytics' && (
              <div className="admin-toolbar glass-toolbar">
                <div className="search-box-admin">
                  <span className="svg-icon-wrap">
                    <IconSearch />
                  </span>
                  <input
                    type="search"
                    placeholder="Search road or town…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select-modern"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            )}

            <div className="admin-page-body">
              {activeTab === 'dashboard' && (
                <div className="stack-gap">
                  {statsCards}
                  <section className="glass-card welcome-admin-card">
                    <h2>Welcome back</h2>
                    <p className="muted">
                      <strong>Incidents</strong> — approve reports before they appear on driver maps.{' '}
                      <strong>Hotspots</strong> — click the map to pin and save. <strong>Users</strong> — add accounts with email;
                      sign-in accepts username or email. <strong>Settings</strong> — Maps API and SMTP.
                    </p>
                  </section>
                </div>
              )}

              {activeTab === 'accidents' && (
                <section className="glass-card">
                  <div className="section-head-inline">
                    <h2>Verification queue</h2>
                    <span className="pill">{stats.pendingVerify} pending review</span>
                  </div>
                  <AccidentVerificationPanel accidents={accidents} onRefresh={loadAccidents} authToken={authToken} />
                </section>
              )}

              {activeTab === 'hotspots' && (
                <HotspotAdmin
                  hotspots={hotspots}
                  authToken={authToken}
                  googleMapsApiKey={googleMapsApiKey}
                  onHotspotSaved={(updated) => {
                    const exists = hotspots.some((h) => String(h.id) === String(updated.id));
                    setHotspots((current) =>
                      exists
                        ? current.map((h) => (String(h.id) === String(updated.id) ? updated : h))
                        : [...current, updated]
                    );
                  }}
                  onHotspotDeleted={(id) => setHotspots((current) => current.filter((h) => h.id !== id))}
                />
              )}

              {activeTab === 'analytics' && (
                <div className="stack-gap">
                  {statsCards}
                  <section className="glass-card">
                    <h2>Recent reports</h2>
                    <div className="admin-table-wrap">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Road</th>
                            <th>Town</th>
                            <th>Status</th>
                            <th>Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAccidents.slice(0, 25).map((a) => (
                            <tr key={a.id}>
                              <td>{a.roadName}</td>
                              <td>{a.town}</td>
                              <td>{a.status}</td>
                              <td>{a.severity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'users' && authToken && <AdminUsersPanel authToken={authToken} />}

              {activeTab === 'settings' && authToken && (
                <div className="stack-gap admin-settings-stack">
                  <AdminMapSettings authToken={authToken} />
                  <AdminEmailSettings authToken={authToken} />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
