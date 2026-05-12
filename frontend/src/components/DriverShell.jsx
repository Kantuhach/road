import { NavLink } from 'react-router-dom';
import { IconCar, IconClipboard, IconLogout } from './Icons';

export default function DriverShell({ user, onLogout, children }) {
  return (
    <div className="driver-app-shell">
      <aside className="driver-sidebar">
        <div className="driver-sidebar-brand">
          <span className="driver-brand-mark svg-icon-wrap">
            <IconCar />
          </span>
          <div>
            <div className="driver-brand-title">Ndola Roads</div>
            <div className="driver-brand-sub">Live safety map</div>
          </div>
        </div>

        <nav className="driver-sidebar-nav">
          <NavLink end className={({ isActive }) => `driver-nav-link${isActive ? ' active' : ''}`} to="/dashboard">
            <IconCar /> Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `driver-nav-link${isActive ? ' active' : ''}`} to="/report">
            <IconClipboard /> Report incident
          </NavLink>
        </nav>

        <div className="driver-sidebar-footer">
          <div className="driver-user-chip">{user?.username}</div>
          <button type="button" className="btn btn-ghost driver-signout" onClick={onLogout}>
            <span className="svg-icon-wrap">
              <IconLogout />
            </span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="driver-main">{children}</div>
    </div>
  );
}
