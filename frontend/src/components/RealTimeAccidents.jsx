import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

const RealTimeAccidents = ({ accidents, userLocation, onRouteRequest, map }) => {
  const [activeAccidents, setActiveAccidents] = useState([]);
  const accidentMarkersRef = useRef({});
  const routeLayerRef = useRef(null);

  // Calculate safe route avoiding accidents
  const calculateSafeRoute = (start, end, accidentAreas) => {
    // Simple route calculation that avoids accident areas
    // In a real app, this would use a routing service like OSRM or Google Directions API
    const safeRoute = [start];
    
    // Add waypoints to avoid accident areas
    accidentAreas.forEach(accident => {
      const accidentLat = accident.latitude || accident.lat;
      const accidentLng = accident.longitude || accident.lng;
      const distance = getDistance(start.lat, start.lng, accidentLat, accidentLng);
      
      if (distance < 2000) { // If accident is within 2km, create detour
        const detourAngle = Math.atan2(accidentLng - start.lng, accidentLat - start.lat);
        const detourDistance = 500; // 500m detour
        const detourLat = accidentLat + Math.sin(detourAngle + Math.PI/2) * detourDistance / 111320;
        const detourLng = accidentLng + Math.cos(detourAngle + Math.PI/2) * detourDistance / (111320 * Math.cos(accidentLat * Math.PI/180));
        
        safeRoute.push([detourLat, detourLng]);
      }
    });
    
    safeRoute.push(end);
    return safeRoute;
  };

  // Calculate distance between two points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get remaining time until accident clearance
  const getTimeRemaining = (clearanceTime) => {
    const now = new Date();
    const clearance = new Date(clearanceTime);
    const diff = clearance - now;
    
    if (diff <= 0) return 'CLEARED';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Create accident marker with severity-based styling
  const createAccidentMarker = (accident) => {
    const severityColors = {
      'Critical': '#dc2626',
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#10b981'
    };

    const color = severityColors[accident.severity] || '#f59e0b';
    const timeRemaining = getTimeRemaining(accident.clearanceTime);
    
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 20px ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          font-weight: bold;
          position: relative;
          animation: accidentPulse 2s infinite;
        ">
          ⚠️
          <div style="
            position: absolute;
            top: -30px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            font-weight: normal;
          ">${timeRemaining}</div>
        </div>
      `,
      className: 'accident-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Update accident markers on map
  useEffect(() => {
    // Clear existing markers
    Object.values(accidentMarkersRef.current).forEach(marker => {
      map.removeLayer(marker);
    });
    accidentMarkersRef.current = {};

    // Add new markers for active accidents
    const active = accidents.filter(accident => {
      const clearanceTime = new Date(accident.clearanceTime);
      return clearanceTime > new Date();
    });

    active.forEach(accident => {
      const lat = accident.latitude || accident.lat;
      const lng = accident.longitude || accident.lng;
      
      if (lat && lng) {
        const marker = L.marker([lat, lng], {
          icon: createAccidentMarker(accident)
        });

        // Create popup with accident details
        const popupContent = `
          <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          ">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="
                background: ${severityColors[accident.severity] || '#f59e0b'};
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-right: 8px;
              ">${accident.severity}</div>
              <div style="
                background: #ef4444;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                animation: pulse 1s infinite;
              ">ACTIVE</div>
            </div>
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${accident.roadName}</h4>
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">📍 ${accident.town}</p>
            ${accident.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #374151;">${accident.description}</p>` : ''}
            ${accident.photo ? `<img src="${accident.photo}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">` : ''}
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
              <div>⏰ Clearing in: ${getTimeRemaining(accident.clearanceTime)}</div>
              <div>📅 Reported: ${new Date(accident.timestamp).toLocaleString()}</div>
              <div>👤 Reported by: ${accident.reportedBy || 'Driver'}</div>
            </div>
            <button onclick="window.requestSafeRoute(${lat}, ${lng})" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              width: 100%;
              margin-top: 12px;
            ">🛣️ Get Safe Route</button>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        accidentMarkersRef.current[accident.id] = marker;
      }
    });

    setActiveAccidents(active);

    // Add global function for safe route requests
    window.requestSafeRoute = (lat, lng) => {
      if (userLocation) {
        const safeRoute = calculateSafeRoute(userLocation, { lat, lng }, active);
        displaySafeRoute(safeRoute);
        onRouteRequest && onRouteRequest({ start: userLocation, end: { lat, lng }, route: safeRoute });
      }
    };

  }, [accidents, userLocation]);

  // Display safe route on map
  const displaySafeRoute = (route) => {
    // Remove existing route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    // Add new safe route
    routeLayerRef.current = L.polyline(route, {
      color: '#10b981',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 5',
      className: 'safe-route'
    }).addTo(map);

    // Fit map to show route
    const bounds = L.latLngBounds(route);
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdowns
      setActiveAccidents(prev => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(accidentMarkersRef.current).forEach(marker => {
        map.removeLayer(marker);
      });
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }
      delete window.requestSafeRoute;
    };
  }, []);

  return (
    <div>
      <style>{`
        @keyframes accidentPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .safe-route {
          animation: dashMove 20s linear infinite;
        }
        @keyframes dashMove {
          to { stroke-dashoffset: -30; }
        }
      `}</style>

      {/* Accident Summary Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        maxWidth: '300px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px', fontWeight: '700' }}>
          🚨 Active Accidents
        </h3>
        
        {activeAccidents.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            ✅ No active accidents in your area
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeAccidents.map(accident => (
              <div key={accident.id} style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                  {accident.roadName}
                </div>
                <div style={{ color: '#78350f' }}>
                  ⏰ {getTimeRemaining(accident.clearanceTime)} remaining
                </div>
                <div style={{ color: '#78350f', fontSize: '11px' }}>
                  Severity: {accident.severity}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#0c4a6e'
        }}>
          💡 Click on any accident marker to get safe alternative routes
        </div>
      </div>
    </div>
  );
};

export default RealTimeAccidents;
