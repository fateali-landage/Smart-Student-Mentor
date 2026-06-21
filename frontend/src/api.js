/**
 * api.js — SmartMentor API Client
 * ─────────────────────────────────
 * Environment-aware base URL with automatic JWT injection,
 * 401 auto-refresh flow, and graceful session expiry handling.
 */

// ── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// ── Authenticated Fetch ───────────────────────────────────────────────────────
/**
 * Drop-in replacement for `fetch` that automatically:
 *  1. Injects the Bearer token from localStorage
 *  2. Retries once after a 401 by attempting a token refresh
 *  3. Clears storage and redirects to /login on refresh failure
 *
 * @param {string} path - API path (e.g. '/api/users')
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<Response>}
 */
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // ── Auto-refresh on 401 ────────────────────────────────────────────────────
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      // Retry original request with new token
      const newToken = localStorage.getItem('access_token');
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      return fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
    } else {
      // Refresh failed — wipe session and redirect
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  return res;
}

// ── Token Refresh ─────────────────────────────────────────────────────────────
/**
 * Attempts to exchange the stored refresh_token for a new access_token.
 * Returns true on success, false on any failure.
 */
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ── Convenience helper for JSON responses ─────────────────────────────────────
/**
 * Wraps authFetch and automatically parses JSON.
 * Returns { data, error, status }.
 */
export async function apiJson(path, options = {}) {
  try {
    const res = await authFetch(path, options);
    const data = await res.json().catch(() => null);
    return { data, error: res.ok ? null : data?.message || 'Request failed', status: res.status };
  } catch (err) {
    return { data: null, error: err.message, status: 0 };
  }
}

export default BASE_URL;
