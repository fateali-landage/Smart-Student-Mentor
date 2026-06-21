/**
 * Sidebar.jsx — SmartMentor Premium Sidebar Navigation
 * ───────────────────────────────────────────────────────
 * Features:
 *  - Gradient brand header with animated icon
 *  - Role-aware navigation (admin / mentor / student)
 *  - Active state: indigo pill with left accent border
 *  - Smooth hover transitions
 *  - Mobile slide-in with backdrop overlay
 *  - User info card at bottom with role badge + logout
 *  - All icons from lucide-react
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  Award,
  CheckCircle,
  Target,
  Map,
  Mic,
  Zap,
  Briefcase,
  TrendingUp,
  Trophy,
  Calendar,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Navigation config per role ─────────────────────────────────────────────────
function getLinks(role) {
  switch (role) {
    case 'admin':
      return [
        { name: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'System Reports', path: '/admin/reports', icon: BarChart3 },
        { name: 'Profile', path: '/profile', icon: User },
      ];

    case 'mentor':
      return [
        { name: 'Dashboard', path: '/mentor', icon: LayoutDashboard, end: true },
        { name: 'My Students', path: '/mentor/students', icon: Users },
        { name: 'Sessions', path: '/mentor/sessions', icon: Calendar },
        { name: 'Task Manager', path: '/mentor/tasks', icon: ClipboardList },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Profile', path: '/profile', icon: User },
      ];

    case 'student':
    default:
      return [
        { name: 'Dashboard', path: '/student', icon: LayoutDashboard, end: true },
        { name: 'Goals', path: '/student/goals', icon: Target },
        { name: 'Career Roadmap', path: '/student/roadmap', icon: Map },
        { name: 'Mock Interview', path: '/student/interview', icon: Mic },
        { name: 'Skills', path: '/student/skills', icon: Zap },
        { name: 'Portfolio', path: '/student/portfolio', icon: Briefcase },
        { name: 'Placement Score', path: '/student/placement', icon: TrendingUp },
        { name: 'Achievements', path: '/student/achievements', icon: Trophy },
        { name: 'Profile', path: '/profile', icon: User },
      ];
  }
}

// ── Role badge colors ──────────────────────────────────────────────────────────
const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  mentor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

// ── Sidebar Component ──────────────────────────────────────────────────────────
export default function Sidebar({ role, isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = getLinks(role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      {/* ── Mobile overlay backdrop ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ───────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-100 dark:border-gray-800
          shadow-xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Brand header ──────────────────────────────────────────────────── */}
        <div className="h-[72px] flex items-center px-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Gradient icon */}
            <div className="relative flex-shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BookOpen className="text-white" size={18} strokeWidth={2.5} />
              </div>
              {/* Decorative dot */}
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
            </div>

            <div>
              <div className="text-gray-900 dark:text-white font-bold text-[15px] leading-tight tracking-tight">
                SmartMentor
              </div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Academic Hub
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation links ─────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5" aria-label="Main navigation">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 pb-2">
            Navigation
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                   transition-all duration-150 select-none
                   ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active left accent */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                    )}

                    {/* Icon */}
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={`flex-shrink-0 transition-transform duration-150
                        ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110'}
                      `}
                    />

                    {/* Label */}
                    <span className="truncate">{link.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── User card + Logout ───────────────────────────────────────────── */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60">
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-indigo-500/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || user?.email || 'User'}
              </p>
              <span
                className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  ROLE_STYLES[role] || ROLE_STYLES.student
                }`}
              >
                <ShieldCheck size={9} strokeWidth={3} />
                {role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
              text-red-500 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-950/40
              transition-all duration-150 group"
          >
            <LogOut size={17} className="group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
