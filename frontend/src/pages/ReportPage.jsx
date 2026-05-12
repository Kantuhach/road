import { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import DriverShell from '../components/DriverShell';

export default function ReportPage({ user, onLogout }) {
  const fileRef = useRef(null);
  const [reportForm, setReportForm] = useState({
    reporterName: user.username,
    driverUsername: user.username,
    town: 'Town Centre',
    roadName: 'Main Street',
    latitude: -12.9697,
    longitude: 28.6367,
    description: ''
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [statusMessage, setStatusMessage] = useState('Fill in the accident details below and submit.');
  const [submitError, setSubmitError] = useState('');
  const [routeSuggestions, setRouteSuggestions] = useState([]);

  const townRoads = useMemo(
    () => ({
      'Town Centre': ['Main Street', 'George Road', 'Market Avenue'],
      Kansenshi: ['Sibonelo Road', 'Chifubu Road', 'United Road'],
      Masala: ['Masala Road', 'Chipulukusu Road', 'Nchanga Bypass'],
      Itawa: ['Itawa Road', 'M4 Highway', 'Ndeke Connector'],
      Ndeke: ['Ndeke Road', 'Chipulukusu Drive', 'Tui Street'],
      Chifubu: ['Chifubu Road', 'Kamwala Road', 'Omsa Road'],
      Twapia: ['Twapia Road', 'Luapula Road', 'Boma Road'],
      Chipulukusu: ['Chipulukusu Road', 'Mapalo Road', 'Nkana Road']
    }),
    []
  );

  const selectedRoads = townRoads[reportForm.town] || [];

  useEffect(() => {
    if (!reportForm.town) {
      return;
    }

    axios
      .get('/api/route-suggestions', { params: { town: reportForm.town } })
      .then((response) => setRouteSuggestions(response.data))
      .catch(() => setRouteSuggestions([]));
  }, [reportForm.town]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReportForm((current) => ({
          ...current,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
        setStatusMessage('GPS location captured — adjust if needed before sending.');
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000 }
    );
  }, []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setSubmitError('Attach a photo from the scene (required for verification).');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('roadName', reportForm.roadName);
      fd.append('town', reportForm.town);
      fd.append('latitude', String(reportForm.latitude));
      fd.append('longitude', String(reportForm.longitude));
      fd.append('description', reportForm.description);
      fd.append('driverUsername', user.username);
      fd.append('photo', file);

      const response = await axios.post('/api/accidents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 || response.status === 201) {
        setStatusMessage('Accident report submitted successfully. An administrator will review it.');
        setReportForm((current) => ({
          ...current,
          description: ''
        }));
        setPhotoPreview('');
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setSubmitError('Unable to submit the report, please try again.');
      }
    } catch {
      setSubmitError('Unable to submit the report. Check your connection and try again.');
    }
  };

  return (
    <DriverShell user={user} onLogout={onLogout}>
      <div className="driver-view driver-report-inner">
        <header className="driver-view__hero driver-report-hero">
          <div className="driver-view__hero-main">
            <p className="driver-view__eyebrow">Submit evidence</p>
            <h1 className="driver-view__title">Report an incident</h1>
            <p className="driver-view__lead muted">{statusMessage}</p>
          </div>
        </header>

        <main className="driver-view__split driver-report-split">
          <section className="report-card driver-report-main-card">
            <h2 className="driver-panel__title">Incident details</h2>
            <p className="driver-panel__hint muted">
              Location, description, and a scene photo help admins verify and publish alerts.
            </p>
          <form className="report-form driver-report-form" onSubmit={handleSubmit}>
            <label>
              Town
              <select
                value={reportForm.town}
                onChange={(e) => setReportForm((current) => ({ ...current, town: e.target.value }))}
              >
                {Object.keys(townRoads).map((town) => (
                  <option key={town} value={town}>
                    {town}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Road
              <select
                value={reportForm.roadName}
                onChange={(e) => setReportForm((current) => ({ ...current, roadName: e.target.value }))}
              >
                {selectedRoads.map((road) => (
                  <option key={road} value={road}>
                    {road}
                  </option>
                ))}
              </select>
            </label>

            <div className="driver-form-row-pair">
              <label>
                Latitude
                <input
                  type="number"
                  step="any"
                  value={reportForm.latitude}
                  onChange={(e) =>
                    setReportForm((current) => ({ ...current, latitude: parseFloat(e.target.value) }))
                  }
                />
              </label>

              <label>
                Longitude
                <input
                  type="number"
                  step="any"
                  value={reportForm.longitude}
                  onChange={(e) =>
                    setReportForm((current) => ({ ...current, longitude: parseFloat(e.target.value) }))
                  }
                />
              </label>
            </div>

            <label>
              Description
              <textarea
                value={reportForm.description}
                onChange={(e) => setReportForm((current) => ({ ...current, description: e.target.value }))}
                rows="5"
                required
              />
            </label>

            <label>
              Photo evidence
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
            {photoPreview && <img className="photo-preview" src={photoPreview} alt="Accident preview" />}

            {submitError && <p className="form-status error">{submitError}</p>}
            <button type="submit" className="btn btn-primary driver-btn-cta">
              Submit report
            </button>
          </form>
        </section>

        <aside className="driver-side-stack driver-report-aside">
            <div className="driver-panel driver-panel--routes">
              <h3 className="driver-panel__title">Route recommendations</h3>
              <p className="driver-panel__hint muted">Updates when you change town.</p>
              <div className="suggestions-list driver-suggestions">
                {routeSuggestions.length === 0 ? (
                  <p className="muted">Choose a town to load nearby alternate routes.</p>
                ) : (
                  routeSuggestions.map((route, index) => (
                    <div key={index} className="suggestion-item driver-suggestion-chip">
                      {route}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="driver-panel driver-panel--checklist">
              <h3 className="driver-panel__title">Before you send</h3>
              <ul className="driver-checklist">
                <li>Clear road name and correct town</li>
                <li>Photo shows obstruction or scene context</li>
                <li>Short, factual description</li>
              </ul>
            </div>
          </aside>
      </main>
      </div>
    </DriverShell>
  );
}
