import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer, Polyline } from '@react-google-maps/api';

const MAP_LIBRARIES = ['geometry'];

export const NDOLA_CENTER = { lat: -12.9697, lng: 28.6367 };

const containerStyle = {
  width: '100%',
  height: 'min(62vh, 600px)',
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
    .filter((a) => {
      if (a.lat == null || a.lng == null) return false;
      if (['resolved', 'cleared'].includes(a.status)) return false;
      return (
        a.verified === true &&
        a.verificationStatus === 'approved' &&
        a.status === 'active'
      );
    });
}

function NdolaGoogleMapInner({
  googleMapsApiKey,
  hotspots = [],
  accidents = [],
  onRoadClick,
  onNearbyAccident,
  pickLocationMode = false,
  pickedLatLng = null,
  onPickLatLng
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
  const [alternativePaths, setAlternativePaths] = useState([]);
  const [directionsMessage, setDirectionsMessage] = useState(null);
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
    if (pickLocationMode || !isLoaded || !userLoc || !onNearbyAccident || !window.google?.maps?.geometry) return;
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
  }, [pickLocationMode, isLoaded, userLoc, points, onNearbyAccident]);

  useEffect(() => {
    if (!selected) return;
    if (selected.type === 'hotspot') {
      const stillThere = (hotspots || []).some((h) => {
        const lat = h.latitude ?? h.coordinates?.latitude;
        const lng = h.longitude ?? h.coordinates?.longitude;
        if (lat == null || lng == null) return false;
        const idStr = String(h.id ?? '');
        if (selected.key && idStr && selected.key === idStr) return true;
        return Math.abs(lat - selected.lat) < 1e-5 && Math.abs(lng - selected.lng) < 1e-5;
      });
      if (!stillThere) {
        setSelected(null);
        setDirections(null);
        setAlternativePaths([]);
        setDirectionsMessage(null);
      }
      return;
    }
    const still = points.some((p) => p.key === selected.key);
    if (!still) {
      setSelected(null);
      setDirections(null);
      setAlternativePaths([]);
      setDirectionsMessage(null);
    }
  }, [hotspots, points, selected]);

  const computeDetour = useCallback(() => {
    setDirectionsMessage(null);
    setAlternativePaths([]);
    if (!isLoaded || !selected || !window.google) return;
    if (!userLoc) {
      setDirectionsMessage(
        'Turn on location access for this site (browser prompt), then try again. Detours are drawn from your position toward the city hub.'
      );
      return;
    }
    const hazardLat = selected.lat;
    const hazardLng = selected.lng;
    if (hazardLat == null || hazardLng == null) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: userLoc,
        destination: NDOLA_CENTER,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        if (status !== 'OK' || !result?.routes?.length) {
          setDirections(null);
          setDirectionsMessage(
            status !== 'OK'
              ? `Could not load directions (${status}). Confirm the API key has the Directions API enabled.`
              : 'No driving routes returned for this area.'
          );
          return;
        }
        const hazard = new google.maps.LatLng(hazardLat, hazardLng);
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
        const altPaths = result.routes
          .filter((r) => r !== bestRoute)
          .map((r) => r.overview_path || [])
          .filter((path) => path.length > 1);
        setAlternativePaths(altPaths);
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
            onClick={() => {
              setDirections(null);
              setAlternativePaths([]);
              setDirectionsMessage(null);
              setSelected({
                type: 'hotspot',
                lat,
                lng,
                key: String(h.id ?? `${lat}-${lng}`),
                name: h.name,
                severity: h.severity,
                timePattern: h.timePattern || ''
              });
              onRoadClick?.(h.name);
            }}
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
          fullscreenControl: true,
          draggableCursor: pickLocationMode ? 'crosshair' : undefined,
          draggingCursor: pickLocationMode ? 'crosshair' : undefined
        }}
        onClick={
          pickLocationMode && onPickLatLng
            ? (e) => {
                const latLng = e.latLng;
                if (!latLng) return;
                onPickLatLng({ lat: latLng.lat(), lng: latLng.lng() });
              }
            : undefined
        }
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

        {pickLocationMode && pickedLatLng && (
          <Marker
            position={pickedLatLng}
            draggable
            onDragEnd={(e) => {
              const ll = e.latLng;
              if (!ll || !onPickLatLng) return;
              onPickLatLng({ lat: ll.lat(), lng: ll.lng() });
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#c026d3',
              fillOpacity: 1,
              strokeColor: '#fafafa',
              strokeWeight: 3
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
              setDirections(null);
              setAlternativePaths([]);
              setDirectionsMessage(null);
              setSelected({
                type: 'accident',
                ...a
              });
              onRoadClick?.(a.roadName);
            }}
          />
        ))}

        {alternativePaths.map((path, idx) => (
          <Polyline
            key={`alt-route-${idx}`}
            path={path}
            options={{
              strokeColor: '#64748b',
              strokeWeight: 4,
              strokeOpacity: 0.55,
              geodesic: true,
              zIndex: 1
            }}
          />
        ))}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: '#0d9488', strokeWeight: 5, strokeOpacity: 0.92, zIndex: 2 },
              suppressMarkers: false
            }}
          />
        )}

        {selected && selected.lat != null && selected.lng != null && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => {
              setSelected(null);
              setDirections(null);
              setAlternativePaths([]);
              setDirectionsMessage(null);
            }}
          >
            <div className="gm-info">
              {selected.type === 'hotspot' ? (
                <>
                  <strong>Hotspot · {selected.name}</strong>
                  <div>Severity: {selected.severity}</div>
                  {selected.timePattern ? <div className="gm-info-muted">{selected.timePattern}</div> : null}
                  <p className="gm-info-hint">
                    Teal line is the suggested path (keeps farther from this hotspot). Gray lines are other driving options when Google returns more than one route.
                  </p>
                  {directionsMessage ? <p className="gm-info-warning">{directionsMessage}</p> : null}
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn-primary map-detour-btn" onClick={computeDetour}>
                      Show alternate routes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <strong>{selected.roadName}</strong>
                  <div>{selected.town}</div>
                  <div>Severity: {selected.severity}</div>
                  <p className="gm-info-hint">
                    Teal line prefers staying farthest from this incident; gray lines show other returned routes when Google offers them.
                  </p>
                  {directionsMessage ? <p className="gm-info-warning">{directionsMessage}</p> : null}
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn-primary map-detour-btn" onClick={computeDetour}>
                      Show alternate routes
                    </button>
                  </div>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {!pickLocationMode && (
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
      )}
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
