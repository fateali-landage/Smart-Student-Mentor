/**
 * TopNavigation.jsx — SmartMentor Premium Top Navigation Bar
 * ────────────────────────────────────────────────────────────
 * Features:
 *  - Glassmorphism header bar
 *  - Hamburger menu (mobile only)
 *  - Centered search bar (desktop)
 *  - Dark/light mode toggle (sun/moon icon)
 *  - Notification bell with unread badge + dropdown panel
 *    (mark individual or all as read, fetches via authFetch)
 *  - User avatar button with Profile/Logout dropdown
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, Sun, Moon, Menu, Check, X,
  User, LogOut, ChevronDown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../api';

// ── Utilities ─────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Notification icon color by type ──────────────────────────────────────────
const NOTIF_DOT = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TopNavigation({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Notifications state ───────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // ── User dropdown state ───────────────────────────────────────────────────
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await authFetch(`/api/notifications/${user.id}`);
      const json = await res.json().catch(() => []);
      setNotifications(Array.isArray(json) ? json.slice(0, 20) : []);
    } catch {
      /* ignore network errors */
    }
  }, [user?.id]);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Mark actions ──────────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      await authFetch(`/api/notifications/read-all/${user.id}`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const markOne = async (n) => {
    if (n.is_read) return;
    try {
      await authFetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    } catch { /* ignore */ }
  };

  const unread = notifications.filter((n) => !n.is_read).length;
  const recent = notifications.slice(0, 5);

  // ── User info ─────────────────────────────────────────────────────────────
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <header className="h-[72px] sticky top-0 z-30 w-full flex items-center justify-between px-4 md:px-6
      backdrop-blur-xl bg-white/80 dark:bg-gray-900/80
      border-b border-gray-100/80 dark:border-gray-800/80
      shadow-sm shadow-gray-900/[0.04]"
    >

      {/* ── Left: hamburger + search ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400
            dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <Menu size={22} />
        </button>

        {/* Desktop search */}
        <div className="hidden sm:flex items-center relative">
          <Search className="absolute left-3.5 text-gray-400 dark:text-gray-500 w-4 h-4 pointer-events-none" />
          <input
            type="search"
            placeholder="Search students, mentors, reports…"
            className="pl-10 pr-4 h-10 w-64 lg:w-80 xl:w-96 text-sm rounded-xl
              bg-gray-100 dark:bg-gray-800
              border border-transparent
              text-gray-800 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:bg-white dark:focus:bg-gray-750
              transition-all duration-200"
          />
        </div>
      </div>

      {/* ── Right: actions ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-gray-100
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-all duration-200"
        >
          {isDark
            ? <Sun size={20} className="text-amber-400" />
            : <Moon size={20} />
          }
        </button>

        {/* ── Notification bell ────────────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications((s) => !s); setShowUserMenu(false); }}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
            className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-gray-100
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                text-[10px] font-bold bg-red-500 text-white rounded-full
                border-2 border-white dark:border-gray-900
                flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96
              bg-white dark:bg-gray-800
              rounded-2xl shadow-2xl shadow-gray-900/15
              border border-gray-100 dark:border-gray-700
              overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold">
                      {unread} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Check size={11} strokeWidth={3} /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">All caught up!</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No notifications yet</p>
                  </div>
                ) : (
                  recent.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markOne(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700/50
                        hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors
                        ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread dot */}
                        <div className="flex-shrink-0 mt-1.5">
                          {!n.is_read
                            ? <span className={`block h-2 w-2 rounded-full ${NOTIF_DOT[n.type] || NOTIF_DOT.info}`} />
                            : <span className="block h-2 w-2 rounded-full bg-transparent" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 5 && (
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
                  <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    View all {notifications.length} notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User avatar + dropdown ───────────────────────────────────────── */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu((s) => !s); setShowNotifications(false); }}
            aria-label="User menu"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            {/* Avatar circle */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
              flex items-center justify-center text-white text-sm font-bold
              ring-2 ring-white dark:ring-gray-900 shadow-md shadow-indigo-500/20 flex-shrink-0">
              {initials}
            </div>
            {/* Name (desktop) */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate max-w-[100px]">
                {user?.name?.split(' ')[0] || 'User'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize leading-tight">
                {user?.role}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden md:block text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52
              bg-white dark:bg-gray-800
              rounded-2xl shadow-2xl shadow-gray-900/15
              border border-gray-100 dark:border-gray-700
              overflow-hidden z-50 py-1.5"
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              {/* Menu items */}
              <button
                onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <User size={15} className="text-gray-400" />
                View Profile
              </button>

              <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2 my-1" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
