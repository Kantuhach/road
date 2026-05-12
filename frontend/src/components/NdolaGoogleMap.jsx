import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  Polyline,
  Autocomplete
} from '@react-google-maps/api';

const MAP_LIBRARIES = ['geometry', 'places'];

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

/** Minimum distance from route polyline to each hazard; bottleneck is the smallest over hazards. */
function scoreRouteClearance(route, hazards) {
  if (!route?.overview_path?.length || !hazards?.length || !window.google?.maps?.geometry) {
    return Number.POSITIVE_INFINITY;
  }
  let bottleneck = Number.POSITIVE_INFINITY;
  for (const haz of hazards) {
    const hz = new google.maps.LatLng(haz.lat, haz.lng);
    let minSeg = Number.POSITIVE_INFINITY;
    for (const p of route.overview_path) {
      minSeg = Math.min(minSeg, google.maps.geometry.spherical.computeDistanceBetween(p, hz));
    }
    bottleneck = Math.min(bottleneck, minSeg);
  }
  return bottleneck;
}

function pickSafestDrivingRoute(routes, hazards) {
  if (!routes?.length || !window.google?.maps?.geometry) {
    return { best: routes?.[0] ?? null, clearance: 0, altPaths: [] };
  }
  if (!hazards?.length) {
    return {
      best: routes[0],
      clearance: Number.POSITIVE_INFINITY,
      altPaths: routes
        .slice(1)
        .map((r) => r.overview_path || [])
        .filter((p) => p.length > 1)
    };
  }
  let best = routes[0];
  let bestScore = scoreRouteClearance(best, hazards);
  for (let i = 1; i < routes.length; i++) {
    const s = scoreRouteClearance(routes[i], hazards);
    if (s > bestScore) {
      bestScore = s;
      best = routes[i];
    }
  }
  const altPaths = routes
    .filter((r) => r !== best)
    .map((r) => r.overview_path || [])
    .filter((p) => p.length > 1);
  return { best, clearance: bestScore, altPaths };
}

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
  onPickLatLng,
  tripPlannerEnabled = false,
  onTripPlannerStatus
}) {
  const loaderId = `ndola-map-${googleMapsApiKey.slice(-12)}-geom-places`;
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

  const [tripDestination, setTripDestination] = useState(null);
  const [pickDestinationMode, setPickDestinationMode] = useState(false);
  const [tripHint, setTripHint] = useState(null);
  const autocompleteRef = useRef(null);
  const statusCbRef = useRef(onTripPlannerStatus);
  useEffect(() => {
    statusCbRef.current = onTripPlannerStatus;
  }, [onTripPlannerStatus]);

  const points = useMemo(() => normAccidents(accidents), [accidents]);

  const hazardsForRouting = useMemo(() => {
    const list = [];
    for (const p of points) list.push({ lat: p.lat, lng: p.lng });
    for (const h of hotspots || []) {
      const lat = h.latitude ?? h.coordinates?.latitude;
      const lng = h.longitude ?? h.coordinates?.longitude;
      if (lat != null && lng != null) list.push({ lat, lng });
    }
    return list;
  }, [points, hotspots]);

  const hazardsFingerprint = useMemo(
    () => hazardsForRouting.map((h) => `${h.lat.toFixed(5)},${h.lng.toFixed(5)}`).join('|'),
    [hazardsForRouting]
  );

  const routingFingerprint = useMemo(() => {
    if (!tripDestination || !userLoc) return '';
    const originBucket = `${userLoc.lat.toFixed(3)},${userLoc.lng.toFixed(3)}`;
    return `${hazardsFingerprint}|${originBucket}|${tripDestination.lat.toFixed(5)}|${tripDestination.lng.toFixed(5)}`;
  }, [hazardsFingerprint, userLoc, tripDestination]);

  const ndolaSearchBounds = useMemo(() => {
    if (!isLoaded || !window.google?.maps) return undefined;
    return new google.maps.LatLngBounds(
      new google.maps.LatLng(-13.28, 28.32),
      new google.maps.LatLng(-12.65, 28.92)
    );
  }, [isLoaded]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) {
          setUserLoc({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000 }
    );
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000 }
    );
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
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

  const prevTripDestinationRef = useRef(null);
  useEffect(() => {
    if (!tripPlannerEnabled) return;
    const prev = prevTripDestinationRef.current;
    prevTripDestinationRef.current = tripDestination;
    if (prev && !tripDestination) {
      setDirections(null);
      setAlternativePaths([]);
      setTripHint(null);
    }
  }, [tripPlannerEnabled, tripDestination]);

  const computeTripRoute = useCallback(() => {
    if (!tripPlannerEnabled || !isLoaded || !userLoc || !tripDestination || !window.google) return;
    setDirectionsMessage(null);
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: userLoc,
        destination: tripDestination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        if (status !== 'OK' || !result?.routes?.length) {
          setDirections(null);
          setAlternativePaths([]);
          const msg =
            status !== 'OK'
              ? `Could not load directions (${status}). Enable Directions API on your Google Cloud key.`
              : 'No driving routes returned for this trip.';
          setTripHint(msg);
          statusCbRef.current?.('Trip routing failed — check API settings.');
          return;
        }
        const { best, clearance, altPaths } = pickSafestDrivingRoute(result.routes, hazardsForRouting);
        if (!best) return;
        setAlternativePaths(altPaths);
        setDirections({
          ...result,
          routes: [best]
        });
        const WARN_M = 130;
        if (hazardsForRouting.length && clearance < WARN_M) {
          const hint = `Stay alert: this path still passes within ~${Math.round(clearance)} m of a hotspot or verified incident.`;
          setTripHint(hint);
          statusCbRef.current?.(hint);
        } else if (hazardsForRouting.length) {
          const hint = `Safer option among alternatives (~${Math.round(clearance)} m from nearest hazard along this path).`;
          setTripHint(hint);
          statusCbRef.current?.('Trip updated — avoiding incidents where alternatives exist.');
        } else {
          setTripHint('Driving directions to your destination.');
          statusCbRef.current?.('Trip plotted.');
        }
      }
    );
  }, [tripPlannerEnabled, isLoaded, userLoc, tripDestination, hazardsForRouting]);

  useEffect(() => {
    if (!tripPlannerEnabled || !isLoaded || !tripDestination || !userLoc || !routingFingerprint) return;
    const timer = window.setTimeout(() => computeTripRoute(), 480);
    return () => window.clearTimeout(timer);
  }, [tripPlannerEnabled, isLoaded, routingFingerprint, tripDestination, userLoc, computeTripRoute]);

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

    const hazards = [{ lat: hazardLat, lng: hazardLng }];
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
        const { best, altPaths } = pickSafestDrivingRoute(result.routes, hazards);
        if (!best) return;
        setAlternativePaths(altPaths);
        setDirections({
          ...result,
          routes: [best]
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

  const tripNavigationActive = Boolean(tripPlannerEnabled && tripDestination);

  const handleAutocompletePlace = () => {
    const ac = autocompleteRef.current;
    const place = ac?.getPlace?.();
    const loc = place?.geometry?.location;
    if (!loc) return;
    setTripDestination({ lat: loc.lat(), lng: loc.lng() });
    setPickDestinationMode(false);
    setSelected(null);
  };

  if (loadError) {
    return (
      <div className="map-api-missing">
        <p>
          Google Maps failed to load. Confirm your API key in Admin Settings has Maps JavaScript API, Directions API, and
          (for address search) Places API enabled.
        </p>
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
          draggableCursor: pickLocationMode || pickDestinationMode ? 'crosshair' : undefined,
          draggingCursor: pickLocationMode || pickDestinationMode ? 'crosshair' : undefined
        }}
        onClick={(e) => {
          if (pickLocationMode && onPickLatLng) {
            const latLng = e.latLng;
            if (!latLng) return;
            onPickLatLng({ lat: latLng.lat(), lng: latLng.lng() });
            return;
          }
          if (tripPlannerEnabled && pickDestinationMode && e.latLng) {
            setTripDestination({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            setPickDestinationMode(false);
            setSelected(null);
          }
        }}
      >
        {tripPlannerEnabled && (
          <div className="driver-trip-overlay">
            <div className="driver-trip-overlay-inner">
              <h4 className="driver-trip-title">Your trip</h4>
              <p className="driver-trip-lead muted">
                Set where you are going. We pick the driving option that stays farthest from verified incidents and
                hotspots when Google offers alternatives — routes refresh live when reports change.
              </p>
              {ndolaSearchBounds ? (
                <Autocomplete
                  onLoad={(ac) => {
                    autocompleteRef.current = ac;
                  }}
                  onPlaceChanged={handleAutocompletePlace}
                  options={{
                    bounds: ndolaSearchBounds,
                    strictBounds: false,
                    fields: ['geometry', 'name', 'formatted_address']
                  }}
                >
                  <input
                    type="text"
                    className="driver-trip-search-input"
                    placeholder="Search address or place (Places API)…"
                    aria-label="Destination search"
                  />
                </Autocomplete>
              ) : null}
              <div className="driver-trip-actions">
                <button
                  type="button"
                  className="driver-trip-btn"
                  onClick={() => setPickDestinationMode((v) => !v)}
                >
                  {pickDestinationMode ? 'Cancel pin on map' : 'Drop pin on map'}
                </button>
                {tripDestination ? (
                  <button
                    type="button"
                    className="driver-trip-btn driver-trip-btn--ghost"
                    onClick={() => {
                      setTripDestination(null);
                      setPickDestinationMode(false);
                      setDirections(null);
                      setAlternativePaths([]);
                      setTripHint(null);
                    }}
                  >
                    Clear trip
                  </button>
                ) : null}
              </div>
              {pickDestinationMode ? (
                <p className="driver-trip-banner">Tap the map to set your destination pin.</p>
              ) : null}
              {!userLoc && tripDestination ? (
                <p className="driver-trip-warning">Allow location access so we can route from your current position.</p>
              ) : null}
              {tripHint ? <p className="driver-trip-hint">{tripHint}</p> : null}
              <p className="driver-trip-foot muted">
                Needs Directions API. Address search needs Places API (optional — pin on map always works).
              </p>
            </div>
          </div>
        )}

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

        {tripPlannerEnabled && tripDestination && (
          <Marker
            position={tripDestination}
            draggable
            onDragEnd={(e) => {
              const ll = e.latLng;
              if (!ll) return;
              setTripDestination({ lat: ll.lat(), lng: ll.lng() });
              setSelected(null);
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 11,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#1e3a8a',
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
                  {tripNavigationActive ? (
                    <p className="gm-info-hint">
                      Trip navigation is on — your route refreshes automatically using live incidents. Use Clear trip to use
                      hub detours from here instead.
                    </p>
                  ) : (
                    <>
                      <p className="gm-info-hint">
                        Teal line is the suggested path (keeps farther from this hotspot). Gray lines are other driving
                        options when Google returns more than one route.
                      </p>
                      {directionsMessage ? <p className="gm-info-warning">{directionsMessage}</p> : null}
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn-primary map-detour-btn" onClick={computeDetour}>
                          Show alternate routes
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <strong>{selected.roadName}</strong>
                  <div>{selected.town}</div>
                  <div>Severity: {selected.severity}</div>
                  {tripNavigationActive ? (
                    <p className="gm-info-hint">
                      Trip navigation is on — routes already avoid verified incidents when alternatives exist. Close this
                      panel or clear the trip to plot a one-off detour toward the city hub.
                    </p>
                  ) : (
                    <>
                      <p className="gm-info-hint">
                        Teal line prefers staying farthest from this incident; gray lines show other returned routes when
                        Google offers them.
                      </p>
                      {directionsMessage ? <p className="gm-info-warning">{directionsMessage}</p> : null}
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn-primary map-detour-btn" onClick={computeDetour}>
                          Show alternate routes
                        </button>
                      </div>
                    </>
                  )}
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
              <span className="legend-dot legend-route" /> Trip / detour route
            </li>
            <li>
              <span className="legend-dot legend-route-alt" /> Other driving option
            </li>
            <li>
              <span className="legend-dot legend-hotspot" /> Hotspot
            </li>
            <li>
              <span className="legend-dot legend-you" /> You
            </li>
            {tripPlannerEnabled ? (
              <li>
                <span className="legend-dot legend-destination" /> Trip destination
              </li>
            ) : null}
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
