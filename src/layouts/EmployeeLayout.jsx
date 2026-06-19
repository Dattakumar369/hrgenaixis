import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

const NAV = [
  { to: '/employee', end: true, label: 'Onboarding', icon: '◎' },
  { to: '/employee/payslips', label: 'My Payslips', icon: '₹' },
];

export default function EmployeeLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <BrandLogo size="sm" compact />
          <span className="sidebar-portal-tag">Employee Portal</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">{user.email?.[0]?.toUpperCase() || 'E'}</span>
            <span className="sidebar-user-email">{user.email}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="portal-main">
        <Outlet />
      </div>
    </div>
  );
}
