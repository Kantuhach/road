import { useEffect, useState } from 'react';
import axios from 'axios';
import { IconSettings } from './Icons';

const emptyForm = {
  emailEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  emailFrom: '',
  adminNotifyEmail: ''
};

function formatSaveError(err) {
  const data = err.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (err.response?.status === 401) return 'Session expired — sign in again as admin.';
  if (err.response?.status === 403) return 'Admin access required.';
  if (err.response?.status === 404) return 'API not found — is the backend running and /api proxied correctly?';
  if (!err.response) return err.message || 'Network error — check connection and try again.';
  return `Save failed (${err.response.status}).`;
}

export default function AdminEmailSettings({ authToken }) {
  const [form, setForm] = useState(emptyForm);
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  const headers = { Authorization: `Bearer ${authToken}` };

  useEffect(() => {
    let cancelled = false;
    axios
      .get('/api/settings/email', { headers })
      .then((res) => {
        if (cancelled) return;
        const d = res.data;
        setForm((f) => ({
          ...f,
          emailEnabled: Boolean(d.emailEnabled),
          smtpHost: d.smtpHost || '',
          smtpPort: d.smtpPort ?? 587,
          smtpSecure: Boolean(d.smtpSecure),
          smtpUser: d.smtpUser || '',
          smtpPassword: '',
          emailFrom: d.emailFrom || '',
          adminNotifyEmail: d.adminNotifyEmail || ''
        }));
        setHasSmtpPassword(Boolean(d.hasSmtpPassword));
      })
      .catch(() => {
        if (!cancelled) setMessage('Could not load email settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axios.put(
        '/api/settings/email',
        {
          emailEnabled: form.emailEnabled,
          smtpHost: form.smtpHost,
          smtpPort: Number(form.smtpPort) || 587,
          smtpSecure: form.smtpSecure,
          smtpUser: form.smtpUser,
          emailFrom: form.emailFrom,
          adminNotifyEmail: form.adminNotifyEmail,
          ...(form.smtpPassword.trim() ? { smtpPassword: form.smtpPassword } : {})
        },
        { headers }
      );
      setMessage('Email settings saved.');
      if (form.smtpPassword.trim()) setHasSmtpPassword(true);
      setForm((f) => ({ ...f, smtpPassword: '' }));
    } catch (err) {
      setMessage(formatSaveError(err));
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setMessage('');
    try {
      await axios.post('/api/settings/email/test', { to: testTo.trim() }, { headers });
      setMessage(`Test email sent to ${testTo.trim()}.`);
    } catch (err) {
      setMessage(formatSaveError(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="glass-card settings-map-card admin-email-card">
      <div className="settings-map-head">
        <span className="settings-map-icon svg-icon-wrap">
          <IconSettings />
        </span>
        <div>
          <h2 className="settings-map-title">Email notifications</h2>
          <p className="settings-map-desc">
            SMTP credentials are stored in the database (protect your admin account). When enabled, <strong>admins</strong> receive an email on each new driver report;{' '}
            <strong>drivers</strong> with an email on their profile receive mail when an incident is approved or a hotspot is published.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <form className="settings-map-form admin-email-form" onSubmit={save} noValidate>
          <label className="settings-label checkbox-inline">
            <input
              type="checkbox"
              checked={form.emailEnabled}
              onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })}
            />
            Enable outbound email
          </label>

          <label className="settings-label">
            Admin alert inbox
            <input
              className="settings-input"
              type="email"
              autoComplete="email"
              value={form.adminNotifyEmail}
              onChange={(e) => setForm({ ...form, adminNotifyEmail: e.target.value })}
              placeholder="ops@example.com"
            />
          </label>

          <label className="settings-label">
            From address
            <input
              className="settings-input"
              type="email"
              value={form.emailFrom}
              onChange={(e) => setForm({ ...form, emailFrom: e.target.value })}
              placeholder="noreply@yourdomain.com"
            />
          </label>

          <div className="admin-email-row">
            <label className="settings-label">
              SMTP host
              <input
                className="settings-input"
                value={form.smtpHost}
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </label>
            <label className="settings-label">
              Port
              <input
                className="settings-input"
                type="number"
                min={1}
                max={65535}
                step={1}
                value={form.smtpPort}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setForm({ ...form, smtpPort: 587 });
                    return;
                  }
                  const n = parseInt(v, 10);
                  setForm({ ...form, smtpPort: Number.isFinite(n) ? n : 587 });
                }}
              />
            </label>
          </div>

          <label className="settings-label checkbox-inline">
            <input
              type="checkbox"
              checked={form.smtpSecure}
              onChange={(e) => setForm({ ...form, smtpSecure: e.target.checked })}
            />
            Use TLS (secure) — often ON for port 465
          </label>

          <label className="settings-label">
            SMTP username
            <input
              className="settings-input"
              autoComplete="username"
              value={form.smtpUser}
              onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
            />
          </label>

          <label className="settings-label">
            SMTP password
            <input
              className="settings-input"
              type="password"
              autoComplete="new-password"
              value={form.smtpPassword}
              onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
              placeholder={hasSmtpPassword ? '•••••••• (leave blank to keep)' : 'App password / SMTP secret'}
            />
          </label>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save email settings'}
            </button>
          </div>

          <div className="admin-email-test">
            <label className="settings-label">
              Send test email to
              <input
                className="settings-input"
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="your@email.com"
              />
            </label>
            <button type="button" className="btn btn-secondary" disabled={testing || !testTo.trim()} onClick={sendTest}>
              {testing ? 'Sending…' : 'Send test'}
            </button>
          </div>

          {message && (
            <p
              className={`settings-feedback ${
                /fail|Fail|error|Could not|expired|required|Network|not found|Unable|403|401/i.test(message)
                  ? 'error'
                  : 'success'
              }`}
            >
              {message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
