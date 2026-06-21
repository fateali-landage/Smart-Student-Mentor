/**
 * DashboardLayout.jsx — SmartMentor Dashboard Shell
 * ────────────────────────────────────────────────────
 * Wraps all authenticated pages with Sidebar + TopNavigation.
 * Auth guard is handled by ProtectedRoute; this layout
 * just composes the shell.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const role = user?.role || 'student';

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top navigation bar */}
        <TopNavigation onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scroll-smooth
          bg-gray-50/80 dark:bg-gray-950
          px-4 md:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
