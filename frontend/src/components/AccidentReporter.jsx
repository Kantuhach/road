import { useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const AccidentReporter = ({ onAccidentReport, userLocation }) => {
  const map = useMap();
  const fileInputRef = useRef(null);
  const [isReporting, setIsReporting] = useState(false);
  const [formData, setFormData] = useState({
    roadName: '',
    town: '',
    description: '',
    severity: 'Medium',
    photo: null,
    coordinates: null
  });

  const handleMapClick = (e) => {
    if (!isReporting) return;
    
    const { lat, lng } = e.latlng;
    setFormData(prev => ({
      ...prev,
      coordinates: { latitude: lat, longitude: lng }
    }));

    // Add temporary marker at clicked location
    const tempMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="
          background: #ef4444;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
          animation: pulse 1s infinite;
        "></div>`,
        className: 'temp-accident-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(map);

    // Remove temporary marker after selection
    setTimeout(() => {
      map.removeLayer(tempMarker);
    }, 2000);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.coordinates) {
      alert('Please click on the map to select accident location');
      return;
    }

    if (!formData.photo) {
      alert('Please upload a photo of the accident');
      return;
    }

    const accidentData = {
      ...formData,
      timestamp: new Date().toISOString(),
      reportedBy: 'driver',
      status: 'active',
      clearanceTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      id: Date.now().toString()
    };

    onAccidentReport(accidentData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      roadName: '',
      town: '',
      description: '',
      severity: 'Medium',
      photo: null,
      coordinates: null
    });
    setIsReporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startReporting = () => {
    setIsReporting(true);
    // Change map cursor to indicate reporting mode
    map.getContainer().style.cursor = 'crosshair';
  };

  const cancelReporting = () => {
    resetForm();
    map.getContainer().style.cursor = '';
  };

  // Add map click listener when in reporting mode
  useState(() => {
    if (isReporting) {
      map.on('click', handleMapClick);
    } else {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isReporting]);

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 1000,
      background: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '350px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>{`
        .accident-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .photo-preview {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid #e5e7eb;
        }
        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        .btn-danger:hover {
          background: #dc2626;
        }
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        .btn-secondary:hover {
          background: #4b5563;
        }
        .reporting-mode {
          background: #fef2f2;
          border: 2px solid #fecaca;
        }
        .coordinates-display {
          background: #f3f4f6;
          padding: 8px;
          border-radius: 6px;
          font-size: 12px;
          color: #6b7280;
          font-family: monospace;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {!isReporting ? (
        <div>
          <h3 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px', fontWeight: '700' }}>
            🚨 Report Accident
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '13px' }}>
            Click below to report an accident with photo and location
          </p>
          <button 
            onClick={startReporting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            📸 Start Accident Report
          </button>
        </div>
      ) : (
        <div className={`accident-form ${isReporting ? 'reporting-mode' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#dc2626', fontSize: '16px', fontWeight: '700' }}>
              📍 Reporting Mode Active
            </h3>
            <button onClick={cancelReporting} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
              ✕ Cancel
            </button>
          </div>

          {formData.coordinates && (
            <div className="coordinates-display">
              📍 Selected: {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Road Name *</label>
              <input
                type="text"
                value={formData.roadName}
                onChange={(e) => setFormData(prev => ({ ...prev, roadName: e.target.value }))}
                placeholder="e.g., T3 Highway, Independence Avenue"
                required
              />
            </div>

            <div className="form-group">
              <label>Town/Area *</label>
              <input
                type="text"
                value={formData.town}
                onChange={(e) => setFormData(prev => ({ ...prev, town: e.target.value }))}
                placeholder="e.g., Ndola Central, Kansenshi"
                required
              />
            </div>

            <div className="form-group">
              <label>Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="Low">Low - Minor damage</option>
                <option value="Medium">Medium - Moderate damage</option>
                <option value="High">High - Major damage</option>
                <option value="Critical">Critical - Severe damage</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the accident situation..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Photo *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              {formData.photo ? (
                <img src={formData.photo} alt="Accident" className="photo-preview" />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  📷 Upload Photo
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                🚨 Submit Report
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>

          {!formData.coordinates && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400e',
              marginTop: '12px'
            }}>
              ⚠️ Click on the map to select the accident location
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccidentReporter;
