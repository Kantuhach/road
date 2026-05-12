import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NdolaGoogleMap from '../components/NdolaGoogleMap';
import DriverShell from '../components/DriverShell';
import websocketService from '../services/websocketService';
import { IconAlertTriangle, IconCircleLive, IconMapPin } from '../components/Icons';

function accidentKey(a) {
  return String(a?.id ?? a?._id ?? '');
}

function isPublishedAccident(a) {
  if (!a || ['resolved', 'cleared'].includes(a.status)) return false;
  return a.verified === true && a.verificationStatus === 'approved' && a.status === 'active';
}

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Loading hotspot and incident data...');
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [nearbyAccidents, setNearbyAccidents] = useState([]);
  const [showProximityAlert, setShowProximityAlert] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

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

  useEffect(() => {
    axios
      .get('/api/settings/maps')
      .then((res) => {
        const k = res.data?.googleMapsApiKey;
        setGoogleMapsApiKey(typeof k === 'string' ? k.trim() : '');
      })
      .catch(() => setGoogleMapsApiKey(''));
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
          if (data.type === 'ACCIDENT_CLEARED') {
            setAccidents((prev) => prev.filter((acc) => accidentKey(acc) !== String(data.accidentId)));
            setStatusMessage('Incident cleared — route updated.');
          } else if (data.type === 'ACCIDENT_UPDATE') {
            const updated = data.accident;
            const id = accidentKey(updated);
            setAccidents((prev) => {
              const rest = prev.filter((acc) => accidentKey(acc) !== id);
              if (!isPublishedAccident(updated)) return rest;
              return [updated, ...rest];
            });
            if (data.newlyPublished && isPublishedAccident(updated)) {
              showAccidentNotification(updated);
              setStatusMessage('New verified incident published on the map.');
            } else {
              setStatusMessage('Incident information updated.');
            }
          } else if (data.type === 'HOTSPOT_CREATED') {
            const h = data.hotspot;
            if (!h) return;
            const hid = String(h.id ?? h._id);
            setHotspots((prev) => {
              if (prev.some((p) => String(p.id) === hid)) return prev;
              return [{ ...h, id: hid }, ...prev];
            });
            setStatusMessage('New hotspot added to the map.');
          } else if (data.type === 'HOTSPOT_UPDATED') {
            const h = data.hotspot;
            if (!h) return;
            const hid = String(h.id ?? h._id);
            setHotspots((prev) => prev.map((p) => (String(p.id) === hid ? { ...h, id: hid } : p)));
            setStatusMessage('Hotspot updated.');
          } else if (data.type === 'HOTSPOT_REMOVED') {
            const id = String(data.id);
            setHotspots((prev) => prev.filter((p) => String(p.id) !== id));
            setStatusMessage('A hotspot was removed from the map.');
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
      const list = response.data.accidents ?? response.data;
      setAccidents(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRoadClick = (roadName) => {
    setSelectedRoad(roadName);
    setStatusMessage(`Calculating alternative route for ${roadName}...`);
  };

  const activeIncidentCount = useMemo(
    () => accidents.filter((a) => a.status !== 'resolved' && a.status !== 'cleared').length,
    [accidents]
  );

  const wsChipClass =
    wsConnection === 'connected'
      ? 'driver-chip driver-chip--live driver-chip--live-on'
      : wsConnection === 'disconnected'
        ? 'driver-chip driver-chip--live driver-chip--live-off'
        : 'driver-chip driver-chip--live driver-chip--live-muted';

  return (
    <DriverShell user={user} onLogout={onLogout}>
      <div
        className={`driver-view driver-dashboard-inner${showProximityAlert && nearbyAccidents.length > 0 ? ' driver-dashboard-inner--alert' : ''}`}
      >
      {showProximityAlert && nearbyAccidents.length > 0 && (
        <div className="driver-proximity-banner" role="alert">
          <div className="driver-proximity-banner__inner">
            <span className="svg-icon-wrap svg-alert-banner" aria-hidden>
              <IconAlertTriangle />
            </span>
            <div>
              <strong>Accident nearby</strong>
              <div className="driver-proximity-banner__meta">
                {nearbyAccidents.length} incident{nearbyAccidents.length > 1 ? 's' : ''} within about 500m —{' '}
                {nearbyAccidents.map((acc) => acc.roadName).join(', ')}
              </div>
            </div>
          </div>
          <button type="button" className="driver-proximity-banner__dismiss" onClick={() => setShowProximityAlert(false)}>
            Dismiss
          </button>
        </div>
      )}

      <header className="driver-view__hero">
        <div className="driver-view__hero-main">
          <p className="driver-view__eyebrow">Ndola · Road safety</p>
          <h1 className="driver-view__title">Your dashboard</h1>
          <p className="driver-view__lead">
            Hi <strong>{user.username}</strong> — live map, corridor reference, and reports in one place.
          </p>
          <div className="driver-badge-row">
            <span className={wsChipClass}>
              <IconCircleLive />
              {wsConnection === 'connected'
                ? 'Live updates'
                : wsConnection === 'disconnected'
                  ? 'Reconnecting…'
                  : 'Connecting…'}
            </span>
            {activeIncidentCount > 0 && (
              <span className="driver-chip driver-chip--alert">
                {activeIncidentCount} active incident{activeIncidentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="driver-view__hero-actions">
          <button type="button" className="btn btn-primary driver-btn-cta" onClick={() => navigate('/report')}>
            Report incident
          </button>
        </div>
      </header>

      <div className="driver-quick-stats" aria-label="Quick statistics">
        <div className="driver-stat-tile">
          <span className="driver-stat-tile__label">Open incidents</span>
          <span className="driver-stat-tile__value">{activeIncidentCount}</span>
        </div>
        <div className="driver-stat-tile">
          <span className="driver-stat-tile__label">Hotspots</span>
          <span className="driver-stat-tile__value">{hotspots.length}</span>
        </div>
        <div className="driver-stat-tile">
          <span className="driver-stat-tile__label">Reports loaded</span>
          <span className="driver-stat-tile__value">{accidents.length}</span>
        </div>
      </div>

      <div className="driver-view__split">
        <section className="map-card driver-map-card">
          <div className="map-header driver-map-header">
            <div>
              <h2>Road network map</h2>
              <p className="driver-map-status muted">{statusMessage}</p>
              {selectedRoad && (
                <p className="selected-road">
                  Route focus: <strong>{selectedRoad}</strong>
                </p>
              )}
            </div>
          </div>

          <NdolaGoogleMap
            googleMapsApiKey={googleMapsApiKey || undefined}
            hotspots={hotspots}
            accidents={accidents}
            tripPlannerEnabled
            onTripPlannerStatus={setStatusMessage}
            onRoadClick={handleRoadClick}
            onNearbyAccident={handleNearbyAccidents}
          />
        </section>

        <aside className="driver-side-stack">
          <div className="driver-panel driver-panel--reference">
            <h3 className="driver-panel__title">Roads by town</h3>
            <p className="driver-panel__hint muted">Quick reference while you drive.</p>
            <div className="town-list driver-town-list">
              {Object.entries(townRoads).map(([town, roads]) => (
                <details key={town} className="driver-town-disclosure">
                  <summary>{town}</summary>
                  <ul>
                    {roads.map((road) => (
                      <li key={road}>{road}</li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>

          <div className="driver-panel driver-panel--tips">
            <h3 className="driver-panel__title">Navigation &amp; Google APIs</h3>
            <p className="driver-panel__body">
              Use <strong>Your trip</strong> on the map to search or drop a destination. We request alternative driving routes from Google, then prefer the option that stays farthest from verified incidents and hotspots when multiple routes exist. Your trip redraws when live incidents change (same WebSocket feed as the pins).
            </p>
            <p className="driver-panel__body muted driver-google-api-note">
              In Google Cloud Console, enable billing and APIs on the same key used in Admin → Settings:{' '}
              <strong>Maps JavaScript API</strong>, <strong>Directions API</strong>, and optionally{' '}
              <strong>Places API</strong> (address search). Restrict the key by HTTP referrer for production.
            </p>
          </div>
        </aside>
      </div>

      <section className="driver-section">
        <div className="driver-section__head">
          <h2 className="driver-section__title">Recent reports</h2>
          <span className="driver-section__meta muted">{accidents.length} total</span>
        </div>
        <div className="reports-card driver-reports-card">
          {accidents.length === 0 ? (
            <p className="driver-empty muted">No reports yet. Be the first to flag an incident on your route.</p>
          ) : (
            accidents.map((report) => (
              <div key={report.id ?? report._id} className="accident-card driver-accident-card">
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
                  <span>
                    {(report.latitude ?? report.coordinates?.latitude)?.toFixed(5)},{' '}
                    {(report.longitude ?? report.coordinates?.longitude)?.toFixed(5)}
                  </span>
                </div>
                {report.photoUrl && (
                  <img className="report-photo" src={report.photoUrl} alt="Accident evidence" />
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="driver-section driver-hotspots-section">
        <div className="driver-section__head">
          <h2 className="driver-section__title">
            <span className="driver-section__title-icon svg-icon-wrap" aria-hidden>
              <IconMapPin />
            </span>
            High-risk hotspots
          </h2>
          <button type="button" className="btn btn-secondary btn-compact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to map
          </button>
        </div>
        <aside className="driver-hotspot-panel hotspot-panel">
          <div className="hotspot-panel-header">
            <div>
              <p className="muted driver-hotspot-lead">
                Critical corridors — watch for alerts and slowdowns in these zones.
              </p>
            </div>
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
    </DriverShell>
  );
}
