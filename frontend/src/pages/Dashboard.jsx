import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NdolaMap from '../components/NdolaMap';
import websocketService from '../services/websocketService';

const severityColor = {
  Low: 'green',
  Medium: 'orange',
  High: '#ff9800'
};

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Loading hotspot and incident data...');
  const [authError, setAuthError] = useState('');
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [nearbyAccidents, setNearbyAccidents] = useState([]);
  const [showProximityAlert, setShowProximityAlert] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);

  const townRoads = useMemo(() => ({
    'Town Centre': ['Main Street', 'George Road', 'Market Avenue'],
    Kansenshi: ['Sibonelo Road', 'Chifubu Road', 'United Road'],
    Masala: ['Masala Road', 'Chipulukusu Road', 'Nchanga Bypass'],
    Itawa: ['Itawa Road', 'M4 Highway', 'Ndeke Connector'],
    Ndeke: ['Ndeke Road', 'Chipulukusu Drive', 'Tui Street'],
    Chifubu: ['Chifubu Road', 'Kamwala Road', 'Omsa Road'],
    Twapia: ['Twapia Road', 'Luapula Road', 'Boma Road'],
    Chipulukusu: ['Chipulukusu Road', 'Mapalo Road', 'Nkana Road']
  }), []);

  useEffect(() => {
    loadHotspots();
    loadAccidents();
    initWebSocket();
    
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Initialize WebSocket for real-time updates
  const initWebSocket = () => {
    try {
      // Connect to WebSocket server
      websocketService.connect();
      
      // Handle connection events
      websocketService.on('connected', () => {
        console.log('Connected to WebSocket server');
        setWsConnection('connected');
        setStatusMessage('Real-time updates connected');
      });
      
      websocketService.on('disconnected', () => {
        console.log('Disconnected from WebSocket server');
        setWsConnection('disconnected');
        setStatusMessage('Real-time updates disconnected');
      });
      
      websocketService.on('message', (data) => {
        try {
          if (data.type === 'ACCIDENT_REPORTED') {
            // Add new accident to the list
            setAccidents(prev => [data.accident, ...prev]);
            setStatusMessage('New accident reported! Updating map...');
            
            // Show notification
            showAccidentNotification(data.accident);
          } else if (data.type === 'ACCIDENT_CLEARED') {
            // Update accident status
            setAccidents(prev => prev.map(acc => 
              acc.id === data.accidentId 
                ? { ...acc, status: 'resolved' }
                : acc
            ));
            setStatusMessage('Accident resolved! Route updated...');
          } else if (data.type === 'ACCIDENT_UPDATE') {
            // Update existing accident
            setAccidents(prev => prev.map(acc => 
              acc.id === data.accident.id 
                ? data.accident
                : acc
            ));
            setStatusMessage('Accident information updated...');
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      setWsConnection('connecting');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setWsConnection('error');
      console.error('Failed to initialize WebSocket:', error);
      setWsConnection('unavailable');
    }
  };

  // Show accident notification
  const showAccidentNotification = (accident) => {
    // Use browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Accident Reported', {
        body: `${accident.roadName} in ${accident.town} - ${accident.severity || 'High'} severity`,
        icon: '/favicon.ico',
        tag: 'accident-alert'
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle nearby accident alerts
  const handleNearbyAccidents = (nearby) => {
    setNearbyAccidents(nearby);
    setShowProximityAlert(true);
    
    // Auto-hide alert after 10 seconds
    setTimeout(() => {
      setShowProximityAlert(false);
    }, 10000);
  };

  const loadHotspots = async () => {
    try {
      const response = await axios.get('/api/hotspots');
      setHotspots(response.data);
      setStatusMessage('Hotspot data loaded.');
    } catch (error) {
      setStatusMessage('Unable to fetch hotspot data. Check backend connection.');
    }
  };

  const loadAccidents = async () => {
    try {
      const response = await axios.get('/api/accidents');
      setAccidents(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const highlightedAccident = accidents.length > 0 ? accidents[0] : null;

  const handleRoadClick = (roadName) => {
    setSelectedRoad(roadName);
    setStatusMessage(`Calculating alternative route for ${roadName}...`);
  };

  return (
    <div className="dashboard-shell">
      {/* Proximity Alert Banner */}
      {showProximityAlert && nearbyAccidents.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(90deg, #dc2626, #ef4444)',
          color: 'white',
          padding: '12px 20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <strong>⚠️ ACCIDENT ALERT</strong>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {nearbyAccidents.length} accident{nearbyAccidents.length > 1 ? 's' : ''} detected within 500m of your location!
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {nearbyAccidents.map(acc => acc.roadName).join(', ')}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowProximityAlert(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <header className="dashboard-header" style={{ marginTop: showProximityAlert ? '60px' : '0' }}>
        <div>
          <h1>Driver Dashboard</h1>
          <p>Welcome back, {user.username}. Share updates and stay ahead of route disruptions.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold',
              background: wsConnection === 'connected' ? '#22c55e' : wsConnection === 'disconnected' ? '#ef4444' : '#6b7280',
              color: 'white'
            }}>
              {wsConnection === 'connected' ? '🟢 Live Updates' : wsConnection === 'disconnected' ? '🔴 Reconnecting...' : '⚪ Offline'}
            </span>
            {accidents.filter(a => a.status !== 'resolved').length > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                background: '#ef4444',
                color: 'white',
                animation: 'pulse 2s infinite'
              }}>
                {accidents.filter(a => a.status !== 'resolved').length} Active Accident{accidents.filter(a => a.status !== 'resolved').length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>Sign out</button>
      </header>

      <main className="dashboard-grid">
        <section className="map-card">
          <div className="map-header">
            <div>
              <h2>Ndola Road Network Map</h2>
              <p>{statusMessage}</p>
              {selectedRoad && (
                <p className="selected-road">Selected: <strong>{selectedRoad}</strong></p>
              )}
            </div>
            <div className="dashboard-actions">
              <div className="user-badge">Signed in as {user.username}</div>
              <button className="btn btn-primary" onClick={() => navigate('/report')}>
                Report an accident
              </button>
            </div>
          </div>

          <NdolaMap
            hotspots={hotspots}
            accidents={accidents}
            onRoadClick={handleRoadClick}
            onNearbyAccident={handleNearbyAccidents}
          />
        </section>

        <section className="info-card">
          <div className="panel">
            <h3>Roads by Town</h3>
            <div className="town-list">
              {Object.entries(townRoads).map(([town, roads]) => (
                <div key={town} className="town-card">
                  <strong>{town}</strong>
                  <ul>
                    {roads.map((road) => (
                      <li key={road}>{road}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Suggested detours</h3>
            <div className="suggestions-list">
              <p>Use the report page to submit incidents and get updated alternate route guidance.</p>
            </div>
          </div>
        </section>
      </main>

      <section className="reporting-row">
        <div className="reports-card">
          <h2>Recent Accident Reports</h2>
          {accidents.length === 0 ? (
            <p>No recent reports yet. Report the first incident on your route.</p>
          ) : (
            accidents.map((report) => (
              <div key={report.id} className="accident-card">
                <div className="accident-header">
                  <div>
                    <h3>{report.roadName}</h3>
                    <p>{report.town} · {new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="accident-badges">
                    <span className={`badge status-${report.status?.toLowerCase() || 'pending'}`}>
                      {report.status || 'PENDING'}
                    </span>
                    {report.verificationStatus && (
                      <span className={`badge verification-${report.verificationStatus?.toLowerCase()}`}>
                        {report.verificationStatus}
                      </span>
                    )}
                    {report.imageValidated && (
                      <span className="badge image-valid">✓ Image Verified</span>
                    )}
                  </div>
                </div>
                <p>{report.description}</p>
                {report.verificationReason && (
                  <p className="verification-reason"><strong>Admin note:</strong> {report.verificationReason}</p>
                )}
                <div className="accident-meta">
                  <span>Reported by {report.driverUsername}</span>
                  <span>{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
                </div>
                {report.photoUrl && <img className="report-photo" src={report.photoUrl} alt="Accident evidence" />}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="action-row">
        <aside className="panel hotspot-panel">
          <div className="hotspot-panel-header">
            <div>
              <h3>High-Risk Accident Hotspots</h3>
              <p>Critical locations with repeated incidents and the strongest driver alerts.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Refresh view
            </button>
          </div>

          <div className="hotspot-grid">
            {hotspots.length === 0 ? (
              <div className="empty-state">
                <p>No hotspots available yet. New accident data will appear here after reporting.</p>
              </div>
            ) : hotspots.map((hotspot) => (
              <article key={hotspot.id} className={`hotspot-card hotspot-${hotspot.severity.toLowerCase()}`}>
                <div className="hotspot-card-main">
                  <div>
                    <span className="hotspot-chip">{hotspot.severity}</span>
                    <h4>{hotspot.name}</h4>
                    <p>{hotspot.timePattern}</p>
                  </div>
                  <span className={`badge severity-${hotspot.severity.toLowerCase()}`}>{hotspot.severity}</span>
                </div>
                <div className="hotspot-details">
                  <span>Latitude: {hotspot.latitude.toFixed(5)}</span>
                  <span>Longitude: {hotspot.longitude.toFixed(5)}</span>
                  {hotspot.incidentCount && (
                    <span className="incident-count">Incidents: {hotspot.incidentCount}</span>
                  )}
                  {hotspot.status && (
                    <span className={`hotspot-status status-${hotspot.status?.toLowerCase()}`}>
                      {hotspot.status}
                    </span>
                  )}
                  {hotspot.expiresAt && (
                    <span className="expiration-date">
                      Expires: {new Date(hotspot.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
