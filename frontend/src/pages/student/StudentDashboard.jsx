import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, BookOpen, Clock, Target, TrendingUp, Star,
  Zap, Calendar, ChevronRight, Lightbulb, MessageSquare,
  CheckCircle2, AlertTriangle, BarChart3, Users, Sparkles,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../api';
import { useToast } from '../../components/ui/Toast';

// ----------- Skeleton -----------
function SkeletonCard({ h = 'h-24' }) {
  return (
    <div className={`card animate-pulse ${h}`}>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mb-2" />
      <div className="h-2 bg-gray-100 dark:bg-gray-600 rounded-full w-3/4" />
    </div>
  );
}

// ----------- Status Badge -----------
const statusBadge = (status) => {
  const map = {
    'not_started': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'overdue': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  const labels = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue' };
  return (
    <span className={`badge ${map[status] || map.not_started}`}>
      {labels[status] || status}
    </span>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [placementScore, setPlacementScore] = useState(null);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [perf, fb, gl, sess, rec, ps] = await Promise.allSettled([
        authFetch(`/api/performance/${user?.id}`),
        authFetch(`/api/feedback/${user?.id}`),
        authFetch('/api/goals'),
        authFetch('/api/sessions?status=approved&limit=3'),
        authFetch(`/api/recommendations/${user?.id}`),
        authFetch('/api/placement-score'),
      ]);
      if (perf.status === 'fulfilled') setPerformance(perf.value);
      if (fb.status === 'fulfilled') setFeedbacks(Array.isArray(fb.value) ? fb.value.slice(0, 3) : []);
      if (gl.status === 'fulfilled') setGoals(Array.isArray(gl.value) ? gl.value : []);
      if (sess.status === 'fulfilled') setSessions(Array.isArray(sess.value) ? sess.value.slice(0, 3) : []);
      if (rec.status === 'fulfilled') setRecommendations(Array.isArray(rec.value) ? rec.value : []);
      if (ps.status === 'fulfilled') setPlacementScore(ps.value);
    } catch (e) {
      showToast('Failed to load some dashboard data', 'warning');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const marks = Array.isArray(performance?.marks) ? performance.marks : [];
  const attendance = performance?.attendance ?? 0;
  const studyHours = performance?.study_hours ?? 0;
  const chartData = marks.map((m, i) => ({ name: m.subject || `#${i + 1}`, score: Number(m.score) || 0 }));

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  const overdueGoals = goals.filter(g => g.status === 'overdue').length;
  const recentGoals = goals.slice(0, 3);
  const placementPct = placementScore?.overall_score ?? 0;

  const statCards = [
    { label: 'Goals', value: `${completedGoals}/${goals.length}`, sub: `${inProgressGoals} in progress`, icon: <Target size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Attendance', value: `${attendance}%`, sub: attendance >= 75 ? 'On track' : 'Needs attention', icon: <CheckCircle2 size={20} />, color: attendance >= 75 ? 'text-emerald-500' : 'text-red-500', bg: attendance >= 75 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30' },
    { label: 'Study Hours', value: studyHours, sub: 'This week', icon: <Clock size={20} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Feedback', value: feedbacks.length, sub: 'Received', icon: <MessageSquare size={20} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: 'Placement Readiness', value: `${placementPct}%`, sub: placementPct >= 70 ? 'Excellent' : placementPct >= 40 ? 'Good' : 'Needs work', icon: <Award size={20} />, color: placementPct >= 70 ? 'text-emerald-500' : placementPct >= 40 ? 'text-amber-500' : 'text-red-500', bg: 'bg-sky-50 dark:bg-sky-900/30' },
  ];

  const quickActions = [
    { label: 'My Goals', to: '/student/goals', icon: <Target size={20} />, gradient: 'from-indigo-500 to-purple-600' },
    { label: 'Career Roadmap', to: '/student/roadmap', icon: <TrendingUp size={20} />, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Mock Interview', to: '/student/mock-interview', icon: <Zap size={20} />, gradient: 'from-orange-500 to-red-600' },
    { label: 'Portfolio', to: '/student/portfolio', icon: <BookOpen size={20} />, gradient: 'from-pink-500 to-rose-600' },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-700" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{Array(3).fill(0).map((_, i) => <SkeletonCard key={i} h="h-48" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMHY2aDZ2LTZoLTZ6bTEwIDEwdjZoNnYtNmgtNnptMC0xMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{today}</p>
            <h1 className="text-2xl md:text-3xl font-bold">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-white/80 text-sm mt-1">Here's your academic overview for today</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
              <p className="text-white/70 text-xs font-medium">Placement Score</p>
              <p className="text-2xl font-bold">{placementPct}%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-center">
              <p className="text-white/70 text-xs font-medium">Overdue Goals</p>
              <p className="text-2xl font-bold text-red-300">{overdueGoals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Goals + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <BarChart3 size={18} className="text-indigo-500" /> Performance by Subject
            </h3>
            <Link to="/student/goals" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">View All <ChevronRight size={12} /></Link>
          </div>
          <div className="h-[260px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: '#fff', stroke: '#6366F1' }} activeDot={{ r: 6, fill: '#6366F1' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <BookOpen className="text-gray-300 mb-2" size={36} />
                <p className="text-gray-400 text-sm">No marks recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Goals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <Target size={18} className="text-indigo-500" /> Recent Goals
            </h3>
            <Link to="/student/goals" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">All <ChevronRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {recentGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No goals yet</p>
                <Link to="/student/goals" className="text-xs text-indigo-500 mt-1 inline-block">Create your first goal →</Link>
              </div>
            ) : recentGoals.map(g => (
              <div key={g.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-1">{g.title}</p>
                  {statusBadge(g.status)}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${g.progress ?? 0}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{g.progress ?? 0}% complete</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback + Sessions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentor Feedback */}
        <div className="card">
          <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
            <MessageSquare size={18} className="text-purple-500" /> Mentor Feedback
          </h3>
          {feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No feedback received yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map(f => (
                <div key={f.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.mentor_name || 'Mentor'}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < (f.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{f.feedback_text}"</p>
                  {f.created_at && <p className="text-[10px] text-gray-400 mt-2">{new Date(f.created_at).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="card">
          <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
            <Calendar size={18} className="text-emerald-500" /> Upcoming Sessions
          </h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No upcoming sessions scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.title || 'Session'}</p>
                    <p className="text-xs text-gray-500">{s.mentor_name || 'Mentor'} · {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : 'TBD'}</p>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Approved</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
          <Sparkles size={18} className="text-amber-500" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link key={i} to={a.to} className={`group flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${a.gradient} text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{a.icon}</div>
              <span className="text-sm font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
            <Lightbulb size={18} className="text-amber-500" /> Personalized Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((r, i) => {
              const styles = {
                danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
                warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
              };
              return (
                <div key={i} className={`border rounded-xl p-4 ${styles[r.level] || styles.info}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{r.title}</p>
                      <p className="text-xs mt-1 opacity-90">{r.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
