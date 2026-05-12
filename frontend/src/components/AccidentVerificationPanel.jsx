import { useEffect, useState } from 'react';
import axios from 'axios';

function ActiveIncidentRow({ accident, authHeaders, busyId, setBusyId, onNotify, onRefresh }) {
  const [nextStatus, setNextStatus] = useState('active');
  const [note, setNote] = useState('');

  useEffect(() => {
    setNextStatus('active');
    setNote('');
  }, [accident.id]);

  const save = async () => {
    if (nextStatus === 'active') {
      onNotify('Pick Resolved or Removed from map to apply a change.');
      return;
    }
    setBusyId(accident.id);
    try {
      let payload;
      if (nextStatus === 'resolved') {
        payload = {
          status: 'resolved',
          verificationReason: note || 'Scene cleared — road usable.'
        };
      } else {
        payload = {
          verified: false,
          verificationStatus: 'rejected',
          status: 'cleared',
          verificationReason: note || 'Removed from map by admin.'
        };
      }
      await axios.put(`/api/accidents/${accident.id}`, payload, { headers: authHeaders });
      onNotify(
        nextStatus === 'resolved'
          ? 'Incident marked resolved. It is no longer shown on driver maps.'
          : 'Incident cleared. Drivers no longer see this pin.'
      );
      setNote('');
      onRefresh?.();
    } catch (e) {
      onNotify('Unable to update incident status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="accident-verification-card active-incident-card">
      <div className="accident-info">
        <h4>
          {accident.town} — {accident.roadName}
        </h4>
        <p>Severity: {accident.severity}</p>
      </div>
      <div className="active-incident-controls">
        <label className="active-incident-label" htmlFor={`status-${accident.id}`}>
          Map status
        </label>
        <select
          id={`status-${accident.id}`}
          className="active-incident-select"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
          disabled={busyId === accident.id}
        >
          <option value="active">Active on driver map</option>
          <option value="resolved">Resolved (road clear)</option>
          <option value="cleared">Removed from map / rejected</option>
        </select>
        <textarea
          className="reason-textarea active-incident-note"
          placeholder="Optional note (shown on audit / emails where applicable)…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          disabled={busyId === accident.id}
        />
        <button
          type="button"
          className="btn-secondary-admin"
          disabled={busyId === accident.id}
          onClick={save}
        >
          Save status
        </button>
      </div>
    </div>
  );
}

export default function AccidentVerificationPanel({ accidents, onRefresh, authToken }) {
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const [selectedId, setSelectedId] = useState(null);
  const [verificationReason, setVerificationReason] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const pending = (accidents || []).filter(
    (a) => !a.verified && !['cleared', 'resolved'].includes(a.status)
  );

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 6000);
  };

  const approve = async (id) => {
    setBusyId(id);
    try {
      await axios.put(
        `/api/accidents/${id}`,
        {
          verified: true,
          verifiedBy: 'admin',
          verificationStatus: 'approved',
          status: 'active'
        },
        { headers: authHeaders }
      );
      notify('Report verified and published on the map.');
      setSelectedId(null);
      setVerificationReason('');
      onRefresh?.();
    } catch (e) {
      notify('Unable to verify report.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    setBusyId(id);
    try {
      await axios.put(
        `/api/accidents/${id}`,
        {
          verified: false,
          verificationStatus: 'rejected',
          status: 'cleared',
          verificationReason: verificationReason || 'Rejected by admin'
        },
        { headers: authHeaders }
      );
      notify('Report rejected and cleared.');
      setSelectedId(null);
      setVerificationReason('');
      onRefresh?.();
    } catch (e) {
      notify('Unable to reject report.');
    } finally {
      setBusyId(null);
    }
  };

  const activeIncidents = (accidents || []).filter(
    (a) => a.verified && a.verificationStatus === 'approved' && a.status === 'active'
  );

  const markResolved = async (id) => {
    setBusyId(id);
    try {
      await axios.put(
        `/api/accidents/${id}`,
        {
          status: 'resolved',
          verificationReason: verificationReason || 'Scene cleared — road usable.'
        },
        { headers: authHeaders }
      );
      notify('Accident marked resolved. Drivers will see the route as open.');
      setSelectedId(null);
      setVerificationReason('');
      onRefresh?.();
    } catch (e) {
      notify('Unable to update status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-verification-panel">
      <h3>Driver reports</h3>
      <p className="verification-help">
        Approve to show an incident on live maps. Mark resolved when the road is clear again.
      </p>

      {message && <div className="alert-message">{message}</div>}

      {pending.length === 0 ? (
        <p>No pending driver reports.</p>
      ) : (
        <div className="pending-accidents-list">
          {pending.map((accident) => (
            <div key={accident.id} className="accident-verification-card">
              <div className="accident-info">
                <h4>
                  {accident.town} — {accident.roadName}
                </h4>
                <p>
                  <strong>Reporter:</strong> {accident.driverUsername || accident.reportedBy || 'Unknown'}
                </p>
                <p>
                  <strong>Description:</strong> {accident.description || '—'}
                </p>
                <p>
                  <strong>Severity:</strong> {accident.severity}
                </p>
                <p>
                  <strong>Location:</strong> (
                  {Number(accident.latitude ?? accident.coordinates?.latitude).toFixed(4)},{' '}
                  {Number(accident.longitude ?? accident.coordinates?.longitude).toFixed(4)})
                </p>
              </div>

              <div className="accident-actions">
                {!selectedId || selectedId !== accident.id ? (
                  <button type="button" className="btn-review" onClick={() => setSelectedId(accident.id)}>
                    Review
                  </button>
                ) : (
                  <div className="verification-form">
                    <textarea
                      placeholder="Optional note for drivers…"
                      value={verificationReason}
                      onChange={(e) => setVerificationReason(e.target.value)}
                      className="reason-textarea"
                    />
                    <div className="button-group">
                      <button
                        type="button"
                        className="btn-approve"
                        disabled={busyId === accident.id}
                        onClick={() => approve(accident.id)}
                      >
                        Approve for map
                      </button>
                      <button
                        type="button"
                        className="btn-secondary-admin"
                        disabled={busyId === accident.id}
                        onClick={() => markResolved(accident.id)}
                      >
                        Mark resolved
                      </button>
                      <button
                        type="button"
                        className="btn-reject"
                        disabled={busyId === accident.id}
                        onClick={() => reject(accident.id)}
                      >
                        Reject / clear
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setSelectedId(null);
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

      <h3 className="verification-section-title">Active on map</h3>
      <p className="verification-help">Close incidents once responders confirm the corridor is safe.</p>
      {activeIncidents.length === 0 ? (
        <p>No verified active incidents.</p>
      ) : (
        <div className="pending-accidents-list">
          {activeIncidents.map((accident) => (
            <ActiveIncidentRow
              key={accident.id}
              accident={accident}
              authHeaders={authHeaders}
              busyId={busyId}
              setBusyId={setBusyId}
              onNotify={notify}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
