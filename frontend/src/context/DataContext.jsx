/**
 * DataContext.jsx — SmartMentor Data Management Context
 * ────────────────────────────────────────────────────────
 * Role-aware data operations using authFetch (JWT-authenticated).
 * Uses targeted, on-demand fetching instead of loading everything globally.
 *
 * Exported API:
 *  data            — { users, goals, feedbacks, performance, sessions, notifications }
 *  refreshData     — manually re-fetch relevant data
 *  addUser, deleteUser, assignMentor
 *  addGoal, updateGoal, updateGoalProgress, deleteGoal
 *  addFeedback
 *  savePerformance
 *  requestMentor
 *  getSessions, getNotifications, markNotificationRead
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { authFetch } from '../api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

// ── Safe JSON parser ───────────────────────────────────────────────────────────
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [data, setData] = useState({
    users: [],
    goals: [],
    feedbacks: [],
    performance: [],
    sessions: [],
    notifications: [],
  });

  // ── Targeted fetch helpers ───────────────────────────────────────────────────

  /** Fetch user list — admin only */
  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await authFetch('/api/users');
      const json = await safeJson(res);
      setData((prev) => ({ ...prev, users: Array.isArray(json) ? json : [] }));
    } catch (err) {
      console.error('[DataContext] fetchUsers:', err);
    }
  }, [user?.role]);

  /** Fetch goals — student sees own; mentor/admin see all */
  const fetchGoals = useCallback(async () => {
    if (!user?.id) return;
    try {
      const path = user.role === 'student'
        ? `/api/goals?student_id=${user.id}`
        : '/api/goals';
      const res = await authFetch(path);
      const json = await safeJson(res);
      setData((prev) => ({ ...prev, goals: Array.isArray(json) ? json : [] }));
    } catch (err) {
      console.error('[DataContext] fetchGoals:', err);
    }
  }, [user?.id, user?.role]);

  /** Fetch feedbacks */
  const fetchFeedbacks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const path = user.role === 'student'
        ? `/api/feedbacks?student_id=${user.id}`
        : '/api/feedbacks';
      const res = await authFetch(path);
      const json = await safeJson(res);
      setData((prev) => ({ ...prev, feedbacks: Array.isArray(json) ? json : [] }));
    } catch (err) {
      console.error('[DataContext] fetchFeedbacks:', err);
    }
  }, [user?.id, user?.role]);

  /** Fetch performance data */
  const fetchPerformance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const path = user.role === 'student'
        ? `/api/reports/performance?student_id=${user.id}`
        : '/api/reports/performance';
      const res = await authFetch(path);
      const json = await safeJson(res);
      setData((prev) => ({ ...prev, performance: Array.isArray(json) ? json : [] }));
    } catch (err) {
      console.error('[DataContext] fetchPerformance:', err);
    }
  }, [user?.id, user?.role]);

  // ── refreshData — re-fetches data appropriate to the current user's role ────
  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    const fetches = [fetchGoals, fetchFeedbacks, fetchPerformance];
    if (user.role === 'admin') fetches.push(fetchUsers);
    await Promise.allSettled(fetches.map((fn) => fn()));
  }, [user, fetchGoals, fetchFeedbacks, fetchPerformance, fetchUsers]);

  // Initial load when user changes
  useEffect(() => {
    if (user?.id) refreshData();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Users ────────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const addUser = useCallback(async (userData) => {
    const res = await authFetch('/api/users/add', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: userData.password || '1234',
      }),
    });
    await fetchUsers();
    return safeJson(res);
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id) => {
    await authFetch(`/api/users/${id}`, { method: 'DELETE' });
    await fetchUsers();
  }, [fetchUsers]);

  const assignMentor = useCallback(async (studentId, mentorId, requestId = null) => {
    const res = await authFetch('/api/assign-mentor', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, mentor_id: mentorId, request_id: requestId }),
    });
    await refreshData();
    return safeJson(res);
  }, [refreshData]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Goals ─────────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const addGoal = useCallback(async (goal) => {
    const res = await authFetch('/api/goals', {
      method: 'POST',
      body: JSON.stringify({ student_id: goal.studentId || user?.id, title: goal.title }),
    });
    await fetchGoals();
    return safeJson(res);
  }, [fetchGoals, user?.id]);

  const updateGoal = useCallback(async (id, updates) => {
    const res = await authFetch(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    await fetchGoals();
    return safeJson(res);
  }, [fetchGoals]);

  const updateGoalProgress = useCallback(async (id, progress) => {
    const res = await authFetch(`/api/goals/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
    await fetchGoals();
    return safeJson(res);
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id) => {
    await authFetch(`/api/goals/${id}`, { method: 'DELETE' });
    await fetchGoals();
  }, [fetchGoals]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Feedback ──────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const addFeedback = useCallback(async (fb) => {
    const res = await authFetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        student_id: fb.studentId,
        mentor_id: fb.mentorId,
        feedback_text: fb.text,
        rating: fb.rating,
      }),
    });
    await fetchFeedbacks();
    return safeJson(res);
  }, [fetchFeedbacks]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Performance ───────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const savePerformance = useCallback(async (perf) => {
    const res = await authFetch('/api/performance', {
      method: 'POST',
      body: JSON.stringify(perf),
    });
    await fetchPerformance();
    return safeJson(res);
  }, [fetchPerformance]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Mentor Requests ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const requestMentor = useCallback(async ({ studentId, preferredSubject, message }) => {
    const res = await authFetch('/api/request-mentor', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId || user?.id,
        preferred_subject: preferredSubject,
        message,
      }),
    });
    return safeJson(res);
  }, [user?.id]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Sessions ──────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const getSessions = useCallback(async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.student_id) params.set('student_id', filters.student_id);
    if (filters.mentor_id) params.set('mentor_id', filters.mentor_id);
    if (filters.status) params.set('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await authFetch(`/api/sessions${query}`);
      const json = await safeJson(res);
      const sessions = Array.isArray(json) ? json : [];
      setData((prev) => ({ ...prev, sessions }));
      return sessions;
    } catch (err) {
      console.error('[DataContext] getSessions:', err);
      return [];
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Notifications ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const getNotifications = useCallback(async (userId) => {
    const id = userId || user?.id;
    if (!id) return [];
    try {
      const res = await authFetch(`/api/notifications/${id}`);
      const json = await safeJson(res);
      const notifications = Array.isArray(json) ? json : [];
      setData((prev) => ({ ...prev, notifications }));
      return notifications;
    } catch (err) {
      console.error('[DataContext] getNotifications:', err);
      return [];
    }
  }, [user?.id]);

  const markNotificationRead = useCallback(async (notifId) => {
    try {
      await authFetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notifId ? { ...n, is_read: true } : n
        ),
      }));
    } catch (err) {
      console.error('[DataContext] markNotificationRead:', err);
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────
  return (
    <DataContext.Provider
      value={{
        data,
        refreshData,
        // Users
        addUser,
        deleteUser,
        assignMentor,
        // Goals
        addGoal,
        updateGoal,
        updateGoalProgress,
        deleteGoal,
        // Feedback
        addFeedback,
        // Performance
        savePerformance,
        // Mentor Requests
        requestMentor,
        // Sessions
        getSessions,
        // Notifications
        getNotifications,
        markNotificationRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};

export default DataContext;
