import { useEffect, useState } from 'react';
import axios from 'axios';
import { IconUser } from './Icons';

export default function AdminUsersPanel({ authToken }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'driver'
  });

  const headers = { Authorization: `Bearer ${authToken}` };

  const loadUsers = () => {
    axios
      .get('/api/auth/users', { headers })
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMessage('Could not load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [authToken]);

  const createUser = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/auth/users', form, { headers });
      setMessage(`Created account @${form.username.trim().toLowerCase()}.`);
      setForm({ username: '', email: '', password: '', role: 'driver' });
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not create user.');
    }
  };

  return (
    <div className="admin-users-stack stack-gap">
      <section className="glass-card admin-users-intro">
        <div className="admin-hotspot-intro-head">
          <span className="admin-hotspot-intro-icon svg-icon-wrap">
            <IconUser />
          </span>
          <div>
            <h2 className="admin-hotspot-intro-title">Accounts</h2>
            <p className="muted admin-hotspot-intro-desc">
              Create drivers or admins with a verified email. They can sign in with <strong>username or email</strong> plus password on the public auth page.
            </p>
          </div>
        </div>
      </section>

      <div className="admin-users-grid">
        <section className="glass-card admin-users-form-card">
          <h3>Add user</h3>
          <form className="admin-form admin-users-form" onSubmit={createUser}>
            <label className="settings-label">
              Username
              <input
                className="settings-input"
                autoComplete="off"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </label>
            <label className="settings-label">
              Email
              <input
                className="settings-input"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="settings-label">
              Initial password
              <input
                className="settings-input"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </label>
            <label className="settings-label">
              Role
              <select
                className="settings-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary">
              Create user
            </button>
            {message && (
              <p className={`settings-feedback ${message.includes('Could not') || message.includes('taken') || message.includes('use') ? 'error' : 'success'}`}>
                {message}
              </p>
            )}
          </form>
        </section>

        <section className="glass-card admin-users-list-card">
          <div className="section-head-inline">
            <h3>Directory</h3>
            <span className="pill">{users.length} accounts</span>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-data-table admin-users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td className="muted">{u.email || '—'}</td>
                      <td>
                        <span className={`admin-role-pill admin-role-pill--${u.role}`}>{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
