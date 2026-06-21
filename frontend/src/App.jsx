import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemReports from './pages/admin/SystemReports';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';
import MyStudentsPage from './pages/mentor/MyStudentsPage';
import SessionManagement from './pages/mentor/SessionManagement';
import TaskManager from './pages/mentor/TaskManager';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import GoalsPage from './pages/student/GoalsPage';
import CareerRoadmap from './pages/student/CareerRoadmap';
import MockInterview from './pages/student/MockInterview';
import SkillAssessment from './pages/student/SkillAssessment';
import Portfolio from './pages/student/Portfolio';
import PlacementScore from './pages/student/PlacementScore';
import AchievementsPage from './pages/student/AchievementsPage';

// Shared Pages
import ReportsPage from './pages/shared/ReportsPage';
import ProfilePage from './pages/shared/ProfilePage';

const FallbackRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route element={<DashboardLayout />}>
                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
                  <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><SystemReports /></ProtectedRoute>} />

                  {/* Mentor Routes */}
                  <Route path="/mentor" element={<ProtectedRoute roles={['mentor']}><MentorDashboard /></ProtectedRoute>} />
                  <Route path="/mentor/students" element={<ProtectedRoute roles={['mentor']}><MyStudentsPage /></ProtectedRoute>} />
                  <Route path="/mentor/sessions" element={<ProtectedRoute roles={['mentor']}><SessionManagement /></ProtectedRoute>} />
                  <Route path="/mentor/tasks" element={<ProtectedRoute roles={['mentor']}><TaskManager /></ProtectedRoute>} />

                  {/* Student Routes */}
                  <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
                  <Route path="/student/goals" element={<ProtectedRoute roles={['student']}><GoalsPage /></ProtectedRoute>} />
                  <Route path="/student/roadmap" element={<ProtectedRoute roles={['student']}><CareerRoadmap /></ProtectedRoute>} />
                  <Route path="/student/interview" element={<ProtectedRoute roles={['student']}><MockInterview /></ProtectedRoute>} />
                  <Route path="/student/skills" element={<ProtectedRoute roles={['student']}><SkillAssessment /></ProtectedRoute>} />
                  <Route path="/student/portfolio" element={<ProtectedRoute roles={['student']}><Portfolio /></ProtectedRoute>} />
                  <Route path="/student/placement" element={<ProtectedRoute roles={['student']}><PlacementScore /></ProtectedRoute>} />
                  <Route path="/student/achievements" element={<ProtectedRoute roles={['student']}><AchievementsPage /></ProtectedRoute>} />

                  {/* Shared Routes */}
                  <Route path="/reports" element={<ProtectedRoute roles={['admin', 'mentor', 'student']}><ReportsPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute roles={['admin', 'mentor', 'student']}><ProfilePage /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<FallbackRoute />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

