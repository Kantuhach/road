import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HotspotAdmin from '../components/HotspotAdmin';
import AccidentVerificationPanel from '../components/AccidentVerificationPanel';

const rtsaCredentials = {
  username: 'rtsa_admin',
  password: 'rtsa2024!'
};

const rtsaInfo = {
  agency: 'Road Transport and Safety Agency',
  acronym: 'RTSA',
  department: 'Traffic Safety Division',
  jurisdiction: 'Zambia'
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [hotspots, setHotspots] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [realTimeStats, setRealTimeStats] = useState({
    activeAlerts: 12,
    verified: 28,
    pending: 5,
    totalHotspots: 0
  });

  useEffect(() => {
    if (authenticated) {
      loadHotspots();
      loadAccidents();
      startRealTimeUpdates();
    }
  }, [authenticated]);

  // Real-time updates simulation
  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(() => {
        setRealTimeStats(prev => ({
          ...prev,
          activeAlerts: Math.max(0, prev.activeAlerts + Math.floor(Math.random() * 3) - 1),
          verified: prev.verified + (Math.random() > 0.7 ? 1 : 0),
          pending: Math.max(0, prev.pending + Math.floor(Math.random() * 3) - 1),
          totalHotspots: hotspots.length
        }));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [authenticated, hotspots.length]);

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
      const response = await axios.get('/api/accidents');
      setAccidents(response.data || []);
    } catch (e) {
      console.error(e);
      setAccidents([]);
    }
  };

  const startRealTimeUpdates = () => {
    console.log('Starting real-time updates for RTSA dashboard');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const filteredAccidents = accidents.filter(accident => {
    const matchesSearch = accident.roadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          accident.town?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || accident.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleLogin = (event) => {
    event.preventDefault();
    if (form.username === rtsaCredentials.username && form.password === rtsaCredentials.password) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid RTSA credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setForm({ username: '', password: '' });
    setHotspots([]);
    navigate('/auth');
  };

  return (
    <div className="auth-shell rtsa-shell">
      <div className="auth-card rtsa-card">
        <style>{`
          .rtsa-shell {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1e293b 100%);
            min-height: 100vh;
          }
          
          .rtsa-card {
            background: rgba(255, 255, 255, 0.98);
            border: 2px solid #1e40af;
            box-shadow: 0 20px 40px rgba(30, 64, 175, 0.2);
          }
          
          .rtsa-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #1e40af, #1e3a8a);
            padding: 8px 16px;
            border-radius: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
          }
          
          .rtsa-icon {
            font-size: 24px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          }
          
          .rtsa-text {
            color: white;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 1px;
          }
          
          .rtsa-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .rtsa-logo {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          
          .rtsa-icon-large {
            font-size: 48px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
          }
          
          .rtsa-btn {
            background: linear-gradient(135deg, #1e40af, #1e3a8a);
            color: white;
            border: none;
            box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
          }
          
          .rtsa-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4);
          }
          
          .rtsa-logout {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
          }
          
          .rtsa-logout:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
          }
          
          .label-icon {
            font-size: 18px;
            margin-right: 8px;
          }
          
          .auth-subtitle {
            color: #64748b;
            font-size: 0.95rem;
            margin-top: 8px;
            font-style: italic;
          }
          
          .dashboard-subtitle {
            color: #64748b;
            font-size: 1rem;
            margin-top: 12px;
            line-height: 1.5;
          }
          
          .admin-dashboard h1 {
            color: #1e40af;
          }
          
          .admin-dashboard p {
            color: #475569;
          }
          
          /* Modern Admin Dashboard Styles */
          .dashboard-header-modern {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1e293b 100%);
            padding: 24px 32px;
            border-radius: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 8px 32px rgba(30, 64, 175, 0.2);
            animation: slideDown 0.6s ease-out;
          }
          
          .header-content {
            flex: 1;
          }
          
          .rtsa-header-modern {
            margin-bottom: 12px;
          }
          
          .rtsa-logo-modern {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .logo-text h1 {
            color: white;
            font-size: 28px;
            font-weight: 800;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .logo-text p {
            color: #93c5fd;
            font-size: 16px;
            margin: 4px 0 0 0;
            font-weight: 500;
          }
          
          .dashboard-subtitle-modern {
            color: #dbeafe;
            font-size: 14px;
            margin: 0;
            font-style: italic;
            opacity: 0.9;
          }
          
          .header-actions {
            display: flex;
            align-items: center;
            gap: 24px;
          }
          
          .stats-summary {
            display: flex;
            gap: 20px;
          }
          
          .stat-item {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 12px 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .stat-number {
            display: block;
            font-size: 24px;
            font-weight: 800;
            color: white;
            line-height: 1;
          }
          
          .stat-label {
            font-size: 12px;
            color: #dbeafe;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
            display: block;
          }
          
          .rtsa-logout-modern {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
          }
          
          .rtsa-logout-modern:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
          }
          
          /* Navigation Tabs */
          .admin-nav-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            background: rgba(255, 255, 255, 0.05);
            padding: 8px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }
          
          .nav-tab {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border: none;
            background: transparent;
            color: #64748b;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          }
          
          .nav-tab.active {
            background: linear-gradient(135deg, #1e40af, #1e3a8a);
            color: white;
            box-shadow: 0 4px 16px rgba(30, 64, 175, 0.3);
          }
          
          .nav-tab:hover:not(.active) {
            background: rgba(255, 255, 255, 0.1);
            color: #1e40af;
          }
          
          .tab-icon {
            font-size: 18px;
          }
          
          /* Admin Grid Layout */
          .admin-grid {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          
          /* Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          
          .stat-card {
            background: white;
            padding: 20px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }
          
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }
          
          .stat-card.primary {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
          }
          
          .stat-card.success {
            border-color: #10b981;
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          }
          
          .stat-card.warning {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #fffbeb, #fef3c7);
          }
          
          .stat-card.danger {
            border-color: #ef4444;
            background: linear-gradient(135deg, #fef2f2, #fee2e2);
          }
          
          .stat-card .stat-icon {
            font-size: 32px;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .stat-info h3 {
            margin: 0 0 4px 0;
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .stat-value {
            font-size: 28px;
            font-weight: 800;
            color: #1e293b;
            line-height: 1;
          }
          
          /* Modern Sections */
          .admin-sections-modern {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 24px;
          }
          
          .section-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #f1f5f9;
          }
          
          .section-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            border-color: #e2e8f0;
          }
          
          .section-header {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 20px 24px;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .section-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .section-badge {
            background: linear-gradient(135deg, #1e40af, #1e3a8a);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section-content {
            padding: 24px;
            max-height: 600px;
            overflow-y: auto;
          }
          
          .section-content::-webkit-scrollbar {
            width: 8px;
          }
          
          .section-content::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .section-content::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          
          .section-content::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Animations */
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .admin-dashboard {
            animation: fadeIn 0.8s ease-out;
          }
          
          /* Responsive Design */
          @media (max-width: 768px) {
            .dashboard-header-modern {
              flex-direction: column;
              gap: 20px;
              text-align: center;
            }
            
            .header-actions {
              flex-direction: column;
              width: 100%;
            }
            
            .stats-summary {
              justify-content: center;
            }
            
            .admin-nav-tabs {
              flex-wrap: wrap;
              justify-content: center;
            }
            
            .stats-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            .admin-sections-modern {
              grid-template-columns: 1fr;
            }
          }
          
          /* Search and Filter Styles */
          .search-filter-bar {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            padding: 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            border: 2px solid #f1f5f9;
          }
          
          .search-box {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
          }
          
          .search-icon {
            position: absolute;
            left: 16px;
            font-size: 18px;
            color: #64748b;
            z-index: 1;
          }
          
          .search-input {
            width: 100%;
            padding: 12px 16px 12px 48px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            background: #f8fafc;
          }
          
          .search-input:focus {
            outline: none;
            border-color: #1e40af;
            background: white;
            box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
          }
          
          .search-input::placeholder {
            color: #94a3b8;
          }
          
          .filter-box {
            min-width: 180px;
          }
          
          .filter-select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            background: #f8fafc;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .filter-select:focus {
            outline: none;
            border-color: #1e40af;
            background: white;
            box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
          }
          
          /* Tab Content Animation */
          .tab-content {
            animation: fadeIn 0.4s ease-out;
          }
          
          /* Enhanced Mobile Responsive */
          @media (max-width: 768px) {
            .search-filter-bar {
              flex-direction: column;
              gap: 12px;
            }
            
            .search-box {
              width: 100%;
            }
            
            .filter-box {
              width: 100%;
            }
          }
        `}</style>
        {!authenticated ? (
          <>
            <div className="auth-hero">
              <div className="rtsa-badge">
                <span className="rtsa-icon">🛡️</span>
                <span className="rtsa-text">RTSA</span>
              </div>
              <h1>RTSA Admin Portal</h1>
              <p>Road Transport and Safety Agency - Zambia</p>
              <p className="auth-subtitle">Authorized personnel only. Manage accident hotspots and road safety data.</p>
            </div>
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                <span className="label-icon">👤</span>
                RTSA Username
                <input
                  value={form.username}
                  onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                  placeholder="Enter RTSA username"
                  required
                />
              </label>
              <label>
                <span className="label-icon">🔐</span>
                RTSA Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                  placeholder="Enter RTSA password"
                  required
                />
              </label>
              {error && <p className="form-status error">{error}</p>}
              <button type="submit" className="btn btn-primary rtsa-btn">
                <span className="btn-icon">🛡️</span>
                Access RTSA Portal
              </button>
            </form>
          </>
        ) : (
          <div className="admin-dashboard">
            {/* Animated Header */}
            <div className="dashboard-header-modern">
              <div className="header-content">
                <div className="rtsa-header-modern">
                  <div className="rtsa-logo-modern">
                    <span className="rtsa-icon-large">🛡️</span>
                    <div className="logo-text">
                      <h1>RTSA Control Center</h1>
                      <p>Road Transport and Safety Agency - Zambia</p>
                    </div>
                  </div>
                </div>
                <p className="dashboard-subtitle-modern">Comprehensive Road Safety Management System</p>
              </div>
              <div className="header-actions">
                <div className="stats-summary">
                  <div className="stat-item">
                    <span className="stat-number">{hotspots.length}</span>
                    <span className="stat-label">Hotspots</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{accidents?.length || 0}</span>
                    <span className="stat-label">Reports</span>
                  </div>
                </div>
                <button className="btn btn-secondary rtsa-logout-modern" onClick={handleLogout}>
                  <span className="btn-icon">🚪</span>
                  Sign out
                </button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="admin-nav-tabs">
              <button 
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                <span className="tab-icon">📊</span>
                <span>Dashboard</span>
              </button>
              <button 
                className={`nav-tab ${activeTab === 'accidents' ? 'active' : ''}`}
                onClick={() => handleTabChange('accidents')}
              >
                <span className="tab-icon">⚠️</span>
                <span>Accident Reports</span>
              </button>
              <button 
                className={`nav-tab ${activeTab === 'hotspots' ? 'active' : ''}`}
                onClick={() => handleTabChange('hotspots')}
              >
                <span className="tab-icon">📍</span>
                <span>Hotspot Management</span>
              </button>
              <button 
                className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleTabChange('analytics')}
              >
                <span className="tab-icon">📈</span>
                <span>Analytics</span>
              </button>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search accidents, hotspots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-box">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            {/* Main Content Grid */}
            <div className="admin-grid">
              {/* Quick Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">🚨</div>
                  <div className="stat-info">
                    <h3>Active Alerts</h3>
                    <span className="stat-value">{realTimeStats.activeAlerts}</span>
                  </div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>Verified</h3>
                    <span className="stat-value">{realTimeStats.verified}</span>
                  </div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>Pending</h3>
                    <span className="stat-value">{realTimeStats.pending}</span>
                  </div>
                </div>
                <div className="stat-card danger">
                  <div className="stat-icon">📍</div>
                  <div className="stat-info">
                    <h3>Hotspots</h3>
                    <span className="stat-value">{realTimeStats.totalHotspots}</span>
                  </div>
                </div>
              </div>
              
              {/* Main Sections */}
              <div className="admin-sections-modern">
                <div className="section-card">
                  <div className="section-header">
                    <h2>📋 Accident Verification Panel</h2>
                    <span className="section-badge">{filteredAccidents.length} filtered</span>
                  </div>
                  <div className="section-content">
                    <AccidentVerificationPanel />
                  </div>
                </div>
                
                <div className="section-card">
                  <div className="section-header">
                    <h2>🗺️ Hotspot Management</h2>
                    <span className="section-badge">{hotspots.length} total</span>
                  </div>
                  <div className="section-content">
                    <HotspotAdmin
                      hotspots={hotspots}
                      onHotspotSaved={(updated) => {
                        const exists = hotspots.some((h) => h.id === updated.id);
                        setHotspots((current) =>
                          exists ? current.map((h) => (h.id === updated.id ? updated : h)) : [...current, updated]
                        );
                      }}
                      onHotspotDeleted={(id) => setHotspots((current) => current.filter((h) => h.id !== id))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
