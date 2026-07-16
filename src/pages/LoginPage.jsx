import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { isHrUser } from '../firebase';
import BrandLogo from '../components/BrandLogo';
import { APP_NAME, APP_TAGLINE, COMPANY_NAME, PLATFORM_MODULES } from '../constants/brand';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = await login(email, password);
      navigate(isHrUser(credential.user) ? '/hr' : '/employee');
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
          <BrandLogo size="xl" onDark showWordmark />
          <p className="showcase-desc showcase-desc--lead">{APP_TAGLINE}</p>

          <div className="showcase-modules">
            {PLATFORM_MODULES.map((label) => (
              <span key={label} className="showcase-module showcase-module--live">
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-panel-glow login-panel-glow--one" aria-hidden />
        <div className="login-panel-glow login-panel-glow--two" aria-hidden />

        <div className="login-panel-inner">
          <div className="login-panel-top">
            <BrandLogo size="sm" showWordmark />
          </div>

          <div className="login-card">
            <div className="login-header">
              <span className="login-eyebrow">Secure sign in</span>
              <h1>Welcome back</h1>
              <p>Continue to {APP_NAME} with your work email and password.</p>
            </div>

            {error && <div className="alert alert-error login-alert" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group login-field">
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@genaixis.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group login-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
                {loading ? 'Signing in…' : `Sign in to ${APP_NAME}`}
              </button>
            </form>
          </div>

          <p className="login-footer">© {new Date().getFullYear()} {COMPANY_NAME}</p>
        </div>
      </main>
    </div>
  );
}
