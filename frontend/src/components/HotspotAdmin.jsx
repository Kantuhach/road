import { useState } from 'react';
import axios from 'axios';

const initialForm = {
  name: '',
  latitude: '',
  longitude: '',
  severity: 'Medium',
  timePattern: ''
};

export default function HotspotAdmin({ hotspots, onHotspotSaved, onHotspotDeleted }) {
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('');

  const clearForm = () => {
    setSelectedId(null);
    setForm(initialForm);
    setStatus('');
  };

  const handleSelect = (hotspot) => {
    setSelectedId(hotspot.id);
    setForm({
      name: hotspot.name,
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      severity: hotspot.severity,
      timePattern: hotspot.timePattern
    });
    setStatus(`Editing ${hotspot.name}. Save to update or delete.`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      severity: form.severity,
      timePattern: form.timePattern
    };

    try {
      const response = selectedId
        ? await axios.put(`/api/hotspots/${selectedId}`, payload)
        : await axios.post('/api/hotspots', payload);

      const raw = response.data?.hotspot ?? response.data;
      onHotspotSaved(raw);
      setStatus(selectedId ? 'Hotspot updated successfully.' : 'Hotspot added successfully.');
      clearForm();
    } catch (error) {
      setStatus('Unable to save hotspot. Check backend or network.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this hotspot permanently?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`/api/hotspots/${id}`);
      onHotspotDeleted(id);
      setStatus('Hotspot deleted successfully.');
      if (selectedId === id) {
        clearForm();
      }
    } catch (error) {
      setStatus('Unable to delete hotspot. Check backend or network.');
    }
  };

  return (
    <div className="panel admin-panel">
      <h3>Admin Hotspot Management</h3>
      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Location name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label>
          Latitude
          <input
            type="number"
            step="0.000001"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            required
          />
        </label>

        <label>
          Longitude
          <input
            type="number"
            step="0.000001"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            required
          />
        </label>

        <label>
          Severity
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <label>
          Time pattern
          <input
            value={form.timePattern}
            onChange={(e) => setForm({ ...form, timePattern: e.target.value })}
            placeholder="e.g. Morning Peak"
            required
          />
        </label>

        <div className="button-row">
          <button type="submit" className="btn btn-primary">
            {selectedId ? 'Update Hotspot' : 'Add Hotspot'}
          </button>
          {selectedId && (
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-hotspot-list">
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className={`admin-hotspot-item ${selectedId === hotspot.id ? 'selected-hotspot' : ''}`}
          >
            <div>
              <strong>{hotspot.name}</strong>
              <div className="admin-hotspot-meta">
                <span>{hotspot.severity}</span>
                <span>{hotspot.timePattern}</span>
              </div>
            </div>
            <div className="action-buttons">
              <button type="button" className="action-button action-edit" onClick={() => handleSelect(hotspot)}>
                Edit
              </button>
              <button type="button" className="action-button action-delete" onClick={() => handleDelete(hotspot.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {status && <p className="form-status">{status}</p>}
    </div>
  );
}
