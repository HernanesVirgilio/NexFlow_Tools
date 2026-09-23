import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

/**
 * Frontend boundary for the Admin area.
 *
 * This is UX, not the security boundary — hiding the route just avoids
 * flashing admin UI at a user who can't use it. The real authority is the
 * backend (`requireAuth` + `requireRole(Role.ADMIN)` on every /api/admin/*
 * route, see backend/src/middleware/auth.ts) — it re-checks on every request
 * no matter what this guard decides.
 */
export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}
