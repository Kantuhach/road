import { useEffect, useState } from 'react';
import axios from 'axios';
import { IconSettings } from './Icons';

export default function AdminMapSettings({ authToken }) {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios
      .get('/api/settings/maps')
      .then((res) => {
        if (!cancelled) setGoogleMapsApiKey(res.data.googleMapsApiKey || '');
      })
      .catch(() => {
        if (!cancelled) setMessage('Could not load current settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axios.put(
        '/api/settings/maps',
        { googleMapsApiKey },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setMessage('Google Maps API key saved. Drivers will use it on their next page load.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed. Ensure you are logged in as admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card settings-map-card">
      <div className="settings-map-head">
        <span className="settings-map-icon svg-icon-wrap">
          <IconSettings />
        </span>
        <div>
          <h2 className="settings-map-title">Map integration</h2>
          <p className="settings-map-desc">
            Paste your browser-restricted Maps JavaScript API key. Enable <strong>Maps JavaScript API</strong> and{' '}
            <strong>Directions API</strong> in Google Cloud and restrict the key by HTTP referrer (your site URL).
          </p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <form className="settings-map-form" onSubmit={save}>
          <label className="settings-label">
            Google Maps API key
            <input
              type="password"
              autoComplete="off"
              className="settings-input"
              value={googleMapsApiKey}
              onChange={(e) => setGoogleMapsApiKey(e.target.value)}
              placeholder="AIza…"
            />
          </label>
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save key'}
            </button>
          </div>
          {message && <p className={`settings-feedback ${message.includes('failed') ? 'error' : 'success'}`}>{message}</p>}
        </form>
      )}
    </section>
  );
}
