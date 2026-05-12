import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AccidentVerificationPanel() {
  const [pendingAccidents, setPendingAccidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [verificationReason, setVerificationReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingAccidents();
  }, []);

  const fetchPendingAccidents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/verification/pending-accidents');
      setPendingAccidents(response.data);
    } catch (error) {
      console.error('Error fetching pending accidents:', error);
      setMessage('Failed to load pending accidents');
    } finally {
      setLoading(false);
    }
  };

  const validateImage = async (accidentId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/verification/validate-image/${accidentId}`);
      setMessage(`Image validation: ${response.data.reason}`);
      if (response.data.valid) {
        setMessage(`Image valid! Credibility score: ${response.data.credibilityScore}/100`);
      }
      fetchPendingAccidents();
    } catch (error) {
      console.error('Error validating image:', error);
      setMessage('Failed to validate image');
    }
  };

  const verifyAccident = async (accidentId, approved) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/verification/verify-accident/${accidentId}`,
        null,
        {
          params: {
            approved,
            reason: verificationReason
          }
        }
      );
      setMessage(response.data.message);
      setSelectedAccident(null);
      setVerificationReason('');
      fetchPendingAccidents();
    } catch (error) {
      console.error('Error verifying accident:', error);
      setMessage('Failed to verify accident');
    }
  };

  return (
    <div className="admin-verification-panel">
      <h3>Accident Verification & Image Validation</h3>
      
      {message && (
        <div className="alert-message">
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading pending accidents...</p>
      ) : pendingAccidents.length === 0 ? (
        <p>No pending accidents for verification</p>
      ) : (
        <div className="pending-accidents-list">
          {pendingAccidents.map((accident) => (
            <div key={accident.id} className="accident-verification-card">
              <div className="accident-info">
                <h4>{accident.town} - {accident.roadName}</h4>
                <p><strong>Reporter:</strong> {accident.reporterName}</p>
                <p><strong>Description:</strong> {accident.description}</p>
                <p><strong>Status:</strong> {accident.verificationStatus}</p>
                <p><strong>Image Validated:</strong> {accident.imageValidated ? '✓ Yes' : '✗ No'}</p>
                <p><strong>Location:</strong> ({accident.latitude.toFixed(4)}, {accident.longitude.toFixed(4)})</p>
              </div>

              <div className="accident-actions">
                <button 
                  className="btn-validate"
                  onClick={() => validateImage(accident.id)}
                  disabled={accident.imageValidated}
                >
                  {accident.imageValidated ? 'Image Valid ✓' : 'Validate Image'}
                </button>

                {!selectedAccident || selectedAccident.id !== accident.id ? (
                  <button 
                    className="btn-review"
                    onClick={() => setSelectedAccident(accident)}
                  >
                    Review & Verify
                  </button>
                ) : (
                  <div className="verification-form">
                    <textarea
                      placeholder="Enter verification reason..."
                      value={verificationReason}
                      onChange={(e) => setVerificationReason(e.target.value)}
                      className="reason-textarea"
                    />
                    <div className="button-group">
                      <button 
                        className="btn-approve"
                        onClick={() => verifyAccident(accident.id, true)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => verifyAccident(accident.id, false)}
                      >
                        ✗ Reject
                      </button>
                      <button 
                        className="btn-cancel"
                        onClick={() => {
                          setSelectedAccident(null);
                          setVerificationReason('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
