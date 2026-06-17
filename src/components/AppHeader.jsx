import BrandLogo from './BrandLogo';

export default function AppHeader({ subtitle, userEmail, onLogout }) {
  return (
    <header className="app-header-bar">
      <div className="app-header-inner">
        <div className="header-brand">
          <BrandLogo size="sm" compact />
          {subtitle && <span className="header-divider" />}
          {subtitle && <span className="header-page-title">{subtitle}</span>}
        </div>
        <div className="header-actions">
          <div className="user-pill">
            <span className="user-avatar">{userEmail?.[0]?.toUpperCase() || 'U'}</span>
            <span className="user-email">{userEmail}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
