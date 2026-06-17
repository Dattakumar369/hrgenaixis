import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginHR, loginEmployee } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginType === 'hr') {
        await loginHR(email, password);
        navigate('/hr');
      } else {
        await loginEmployee(email, password);
        navigate('/employee');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-showcase">
        <div className="showcase-content">
          <BrandLogo size="xl" onDark />
          <h2 className="showcase-title">Employee Onboarding Portal</h2>
          <p className="showcase-desc">
            A secure workspace for Genaixis team members to complete onboarding and for HR to review submissions.
          </p>
          <div className="showcase-stats">
            <div className="showcase-stat">
              <span className="stat-num">01</span>
              <span className="stat-label">Upload documents</span>
            </div>
            <div className="showcase-stat">
              <span className="stat-num">02</span>
              <span className="stat-label">HR verification</span>
            </div>
            <div className="showcase-stat">
              <span className="stat-num">03</span>
              <span className="stat-label">Join Genaixis</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-card">
          <div className="login-mobile-logo">
            <BrandLogo size="md" />
          </div>

          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Sign in to your Genaixis account</p>
          </div>

          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={loginType === 'employee'}
              className={`login-tab ${loginType === 'employee' ? 'active' : ''}`}
              onClick={() => { setLoginType('employee'); setError(''); }}
            >
              Employee
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginType === 'hr'}
              className={`login-tab ${loginType === 'hr' ? 'active' : ''}`}
              onClick={() => { setLoginType('hr'); setError(''); }}
            >
              HR Admin
            </button>
          </div>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginType === 'hr' ? 'hr@genaixis.com' : 'you@genaixis.com'}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="login-hint">
            {loginType === 'hr'
              ? 'HR credentials are provided by your administrator.'
              : 'Use the email and password shared by Genaixis HR after your invite.'}
          </p>
        </div>

        <p className="login-footer">© {new Date().getFullYear()} Genaixis Pvt Ltd</p>
      </main>
    </div>
  );
}
