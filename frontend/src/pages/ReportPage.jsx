import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ReportPage({ user }) {
  const navigate = useNavigate();
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
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>Accident Report</h1>
          <p>{statusMessage}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </button>
      </header>

      <main className="dashboard-grid">
        <section className="report-card">
          <h2>Submit a report</h2>
          <p>Share the location, road, and photo evidence so responders can verify and publish alerts.</p>
          <form className="report-form" onSubmit={handleSubmit}>
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
            <button type="submit" className="btn btn-primary">
              Submit report
            </button>
          </form>
        </section>

        <section className="info-card">
          <div className="panel">
            <h3>Route recommendations</h3>
            <div className="suggestions-list">
              {routeSuggestions.length === 0 ? (
                <p>Choose a town to load nearby alternate routes.</p>
              ) : (
                routeSuggestions.map((route, index) => (
                  <div key={index} className="suggestion-item">
                    {route}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="panel">
            <h3>Report tips</h3>
            <ul>
              <li>Use clear road names and exact town location.</li>
              <li>Attach a photo when there is visible obstruction or damage.</li>
              <li>Keep descriptions short and factual.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
