/**
 * ProtectedRoute.jsx — SmartMentor Route Guard
 * ──────────────────────────────────────────────
 * Wraps any route that requires authentication and/or specific roles.
 *
 * Usage:
 *   <ProtectedRoute roles={['admin']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 *
 * Behaviors:
 *  - While loading auth state → shows spinner
 *  - Not authenticated → redirects to /login
 *  - Authenticated but wrong role → redirects to /{user.role}
 *  - Authenticated + correct role → renders children
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  // ── Loading state: auth hasn't resolved yet ───────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          {/* Animated spinner */}
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
            <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            Authenticating…
          </p>
        </div>
      </div>
    );
  }

  // ── Not authenticated: redirect to login ──────────────────────────────────
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ── Role check: redirect to the user's own home if not allowed ────────────
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // ── All checks passed: render protected content ───────────────────────────
  return children;
}
