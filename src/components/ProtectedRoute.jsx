import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading…</p>
    </div>
  );
}

export function ProtectedRoute({ role }) {
  const { user, loading, isHR, isEmployee } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (role === 'hr' && !isHR) return <Navigate to="/employee" replace />;
  if (role === 'employee' && !isEmployee) return <Navigate to="/hr" replace />;

  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading, isHR } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={isHR ? '/hr' : '/employee'} replace />;

  return <Outlet />;
}
