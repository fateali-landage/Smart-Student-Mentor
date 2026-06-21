/**
 * AuthContext.jsx — SmartMentor Authentication Context
 * ───────────────────────────────────────────────────────
 * Provides JWT-aware auth state management with:
 *  - localStorage persistence (user, access_token, refresh_token)
 *  - Session restoration on mount
 *  - updateUser for profile edits
 *  - isAuthenticated convenience boolean
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on mount ──────────────────────────────
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const accessToken = localStorage.getItem('access_token');

      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
      } else if (storedUser) {
        // Legacy: user stored but no JWT (pre-upgrade sessions)
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to restore session:', err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  /**
   * Call after a successful /api/login response.
   * @param {Object} userData - user object (id, name, email, role, etc.)
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  const login = useCallback((userData, accessToken, refreshToken) => {
    if (!userData) return false;

    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));

    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

    return true;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.clear(); // Wipe all tokens and user data
  }, []);

  // ── Update user (e.g., after profile edit) ──────────────────────────────────
  /**
   * Merge updated fields into the current user without requiring re-login.
   * @param {Object} updates - Partial user fields to merge
   */
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(merged));
      return merged;
    });
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
