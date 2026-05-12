import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';

const MAP_LIBRARIES = ['geometry'];

export const NDOLA_CENTER = { lat: -12.9697, lng: 28.6367 };

const containerStyle = {
  width: '100%',
  height: 'min(58vh, 520px)',
  borderRadius: '16px'
};

const severityColor = {
  Critical: '#b91c1c',
  High: '#ea580c',
  Medium: '#ca8a04',
  Low: '#15803d'
};

function normAccidents(list) {
  return (list || [])
    .map((a) => {
      const lat = a.latitude ?? a.coordinates?.latitude ?? a.lat;
      const lng = a.longitude ?? a.coordinates?.longitude ?? a.lng;
      return {
        ...a,
        lat,
        lng,
        key: String(a.id || a._id || '')
      };
    })
    .filter((a) => a.lat != null && a.lng != null && !['resolved', 'cleared'].includes(a.status));
}

function NdolaGoogleMapInner({
  googleMapsApiKey,
  hotspots = [],
  accidents = [],
  onRoadClick,
  onNearbyAccident
}) {
  const loaderId = `ndola-map-${googleMapsApiKey.slice(-12)}`;
  const { isLoaded, loadError } = useJsApiLoader({
    id: loaderId,
    googleMapsApiKey,
    libraries: MAP_LIBRARIES
  });

  const [userLoc, setUserLoc] = useState(null);
  const [selected, setSelected] = useState(null);
  const [directions, setDirections] = useState(null);
  const lastNearbyKey = useRef('');

  const points = useMemo(() => normAccidents(accidents), [accidents]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    if (!isLoaded || !userLoc || !onNearbyAccident || !window.google?.maps?.geometry) return;
    const haz = points.filter((a) => {
      const d = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userLoc.lat, userLoc.lng),
        new google.maps.LatLng(a.lat, a.lng)
      );
      return d < 500;
    });
    const key = haz
      .map((a) => a.key)
      .sort()
      .join(',');
    if (key === lastNearbyKey.current) return;
    lastNearbyKey.current = key;
    if (haz.length) onNearbyAccident(haz);
  }, [isLoaded, userLoc, points, onNearbyAccident]);

  const computeDetour = useCallback(() => {
    if (!isLoaded || !userLoc || !selected || !window.google) return;
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: userLoc,
        destination: NDOLA_CENTER,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        if (status !== 'OK' || !result?.routes?.length) return;
        const hazard = new google.maps.LatLng(selected.lat, selected.lng);
        let bestRoute = result.routes[0];
        let bestDist = -1;
        for (const route of result.routes) {
          let minSeg = Infinity;
          (route.overview_path || []).forEach((p) => {
            const d = google.maps.geometry.spherical.computeDistanceBetween(p, hazard);
            minSeg = Math.min(minSeg, d);
          });
          if (minSeg > bestDist) {
            bestDist = minSeg;
            bestRoute = route;
          }
        }
        setDirections({
          ...result,
          routes: [bestRoute]
        });
      }
    );
  }, [isLoaded, userLoc, selected]);

  const hotspotMarkers = useMemo(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps?.SymbolPath) return [];
    return (hotspots || [])
      .map((h) => {
        const lat = h.latitude ?? h.coordinates?.latitude;
        const lng = h.longitude ?? h.coordinates?.longitude;
        if (lat == null || lng == null) return null;
        return (
          <Marker
            key={`hot-${h.id || lat}-${lng}`}
            position={{ lat, lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#14b8a6',
              fillOpacity: 0.9,
              strokeColor: '#0f766e',
              strokeWeight: 2
            }}
            onClick={() => onRoadClick?.(h.name)}
          />
        );
      })
      .filter(Boolean);
  }, [hotspots, onRoadClick, isLoaded]);

  if (loadError) {
    return (
      <div className="map-api-missing">
        <p>Google Maps failed to load. Confirm your API key in Admin Settings has Maps JavaScript API and Directions API enabled.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading map-loading-card">
        <span className="loading-spinner" />
        Loading map…
      </div>
    );
  }

  return (
    <div className="google-map-wrap google-map-wrap-elevated">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={NDOLA_CENTER}
        zoom={12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {userLoc && (
          <Marker
            position={userLoc}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#fbbf24',
              fillOpacity: 1,
              strokeColor: '#92400e',
              strokeWeight: 2
            }}
          />
        )}

        {hotspotMarkers}

        {points.map((a) => (
          <Marker
            key={a.key}
            position={{ lat: a.lat, lng: a.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 11,
              fillColor: severityColor[a.severity] || '#64748b',
              fillOpacity: 1,
              strokeColor: '#1e293b',
              strokeWeight: 2
            }}
            onClick={() => {
              setSelected(a);
              setDirections(null);
              onRoadClick?.(a.roadName);
            }}
          />
        ))}

        {directions && <DirectionsRenderer directions={directions} />}

        {selected && (
          <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
            <div className="gm-info">
              <strong>{selected.roadName}</strong>
              <div>{selected.town}</div>
              <div>Severity: {selected.severity}</div>
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-primary map-detour-btn" onClick={computeDetour}>
                  Suggested detour (via city hub)
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="map-legend-panel">
        <div className="map-legend-title">Legend</div>
        <ul className="map-legend-list">
          <li>
            <span className="legend-dot legend-accident-critical" /> Critical / High
          </li>
          <li>
            <span className="legend-dot legend-accident-medium" /> Medium
          </li>
          <li>
            <span className="legend-dot legend-accident-low" /> Low
          </li>
          <li>
            <span className="legend-dot legend-route" /> Detour route
          </li>
          <li>
            <span className="legend-dot legend-hotspot" /> Hotspot
          </li>
          <li>
            <span className="legend-dot legend-you" /> You
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function NdolaGoogleMap(props) {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const fromProps = props.googleMapsApiKey ? String(props.googleMapsApiKey).trim() : '';
  const resolved = fromProps || envKey;

  if (!resolved) {
    return (
      <div className="map-api-missing map-api-missing-card">
        <p className="map-api-title">Map unavailable</p>
        <p>
          Your administrator must add a Google Maps API key under{' '}
          <strong>Admin → Settings</strong>. Developers can still use{' '}
          <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>frontend/.env</code>.
        </p>
      </div>
    );
  }

  return <NdolaGoogleMapInner {...props} googleMapsApiKey={resolved} />;
}
