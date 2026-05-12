import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import NdolaGoogleMap from './NdolaGoogleMap';
import { IconMapPin } from './Icons';

const initialForm = {
  name: '',
  latitude: '',
  longitude: '',
  severity: 'Medium',
  timePattern: 'Any time'
};

export default function HotspotAdmin({
  hotspots,
  onHotspotSaved,
  onHotspotDeleted,
  authToken,
  googleMapsApiKey
}) {
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('');
  const [pickedLatLng, setPickedLatLng] = useState(null);

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const syncPickFromForm = useCallback(() => {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setPickedLatLng({ lat, lng });
    }
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    if (!form.latitude || !form.longitude) {
      setPickedLatLng(null);
      return;
    }
    syncPickFromForm();
  }, [form.latitude, form.longitude, syncPickFromForm]);

  const clearForm = () => {
    setSelectedId(null);
    setForm(initialForm);
    setStatus('');
    setPickedLatLng(null);
  };

  const handleSelect = (hotspot) => {
    setSelectedId(hotspot.id);
    setForm({
      name: hotspot.name,
      latitude: String(hotspot.latitude),
      longitude: String(hotspot.longitude),
      severity: hotspot.severity,
      timePattern: hotspot.timePattern || 'Any time'
    });
    setPickedLatLng({ lat: hotspot.latitude, lng: hotspot.longitude });
    setStatus(`Editing “${hotspot.name}”. Drag the purple pin or click the map to adjust.`);
  };

  const handleMapPick = (ll) => {
    setPickedLatLng(ll);
    setForm((f) => ({
      ...f,
      latitude: ll.lat.toFixed(6),
      longitude: ll.lng.toFixed(6)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    const payload = {
      name: form.name,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      severity: form.severity,
      timePattern: form.timePattern || 'Any time'
    };

    try {
      const response = selectedId
        ? await axios.put(`/api/hotspots/${selectedId}`, payload, { headers: authHeaders })
        : await axios.post('/api/hotspots', payload, { headers: authHeaders });

      const raw = response.data?.hotspot ?? response.data;
      onHotspotSaved(raw);
      setStatus(selectedId ? 'Hotspot updated — visible on driver maps.' : 'Hotspot saved — drivers see it on the live map.');
      clearForm();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      setStatus(msg === 'Admin access required' ? 'Session expired — sign in again as admin.' : 'Unable to save hotspot. Check login and network.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Remove this hotspot from the live map?');
    if (!confirmed) return;

    try {
      await axios.delete(`/api/hotspots/${id}`, { headers: authHeaders });
      onHotspotDeleted(id);
      setStatus('Hotspot removed.');
      if (selectedId === id) clearForm();
    } catch {
      setStatus('Unable to delete — ensure you are signed in as admin.');
    }
  };

  return (
    <div className="admin-hotspot-workspace">
      <div className="admin-hotspot-intro glass-card glass-card--flush">
        <div className="admin-hotspot-intro-head">
          <span className="admin-hotspot-intro-icon svg-icon-wrap">
            <IconMapPin />
          </span>
          <div>
            <h2 className="admin-hotspot-intro-title">Hotspots on the map</h2>
            <p className="muted admin-hotspot-intro-desc">
              Click the map to drop a pin, name the corridor, then save. Drivers see hotspots immediately after save.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-hotspot-grid">
        <div className="admin-hotspot-map-panel glass-card">
          <div className="admin-hotspot-map-head">
            <h3>Placement map</h3>
            <p className="muted">Crosshair mode — click to place the purple pin.</p>
          </div>
          <NdolaGoogleMap
            googleMapsApiKey={googleMapsApiKey}
            hotspots={hotspots}
            accidents={[]}
            pickLocationMode
            pickedLatLng={pickedLatLng}
            onPickLatLng={handleMapPick}
          />
        </div>

        <div className="admin-hotspot-side">
          <div className="glass-card admin-hotspot-form-card">
            <h3>{selectedId ? 'Edit hotspot' : 'New hotspot'}</h3>
            <form onSubmit={handleSubmit} className="admin-form admin-hotspot-form">
              <label className="settings-label">
                Location name
                <input
                  className="settings-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Kansenshi roundabout"
                  required
                />
              </label>

              <div className="admin-hotspot-coord-row">
                <label className="settings-label">
                  Latitude
                  <input
                    className="settings-input"
                    type="number"
                    step="0.000001"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    required
                  />
                </label>
                <label className="settings-label">
                  Longitude
                  <input
                    className="settings-input"
                    type="number"
                    step="0.000001"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label className="settings-label">
                Severity
                <select
                  className="settings-input"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>

              <label className="settings-label">
                Time pattern
                <input
                  className="settings-input"
                  value={form.timePattern}
                  onChange={(e) => setForm({ ...form, timePattern: e.target.value })}
                  placeholder="e.g. Rush hour"
                />
              </label>

              <div className="admin-hotspot-form-actions">
                <button type="submit" className="btn btn-primary">
                  {selectedId ? 'Update hotspot' : 'Save to driver map'}
                </button>
                {selectedId && (
                  <button type="button" className="btn btn-secondary" onClick={clearForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="glass-card admin-hotspot-list-card">
            <div className="section-head-inline">
              <h3>Saved hotspots</h3>
              <span className="pill">{hotspots.length}</span>
            </div>
            <div className="admin-hotspot-cards">
              {hotspots.length === 0 ? (
                <p className="muted">None yet — place your first pin on the map.</p>
              ) : (
                hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    className={`admin-hotspot-tile${selectedId === hotspot.id ? ' admin-hotspot-tile--active' : ''}`}
                  >
                    <div className="admin-hotspot-tile-main">
                      <span className={`admin-hotspot-sev admin-hotspot-sev--${String(hotspot.severity).toLowerCase()}`}>
                        {hotspot.severity}
                      </span>
                      <strong>{hotspot.name}</strong>
                      <div className="muted admin-hotspot-tile-meta">{hotspot.timePattern}</div>
                      <div className="muted admin-hotspot-tile-coords">
                        {Number(hotspot.latitude).toFixed(5)}, {Number(hotspot.longitude).toFixed(5)}
                      </div>
                    </div>
                    <div className="admin-hotspot-tile-actions">
                      <button type="button" className="btn btn-secondary btn-compact" onClick={() => handleSelect(hotspot)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-secondary btn-compact danger-outline" onClick={() => handleDelete(hotspot.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {status && (
            <p className={`settings-feedback ${status.includes('Unable') || status.includes('expired') ? 'error' : 'success'}`}>{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
