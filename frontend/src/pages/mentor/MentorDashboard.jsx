import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, MessageSquare, Flag, CheckCircle2, Calendar, TrendingUp,
  Download, Star, Activity, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

const COLORS = ['#5A67D8', '#8B5CF6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</h3>
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const { user } = useAuth();
  const { data, addFeedback, addGoal } = useData();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [goalTitle, setGoalTitle] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await authFetch(`/api/my-students/${user.id}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load students.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const avgScore = (marks) => {
    if (!Array.isArray(marks) || marks.length === 0) return null;
    return Math.round(marks.reduce((a, m) => a + (Number(m.score) || 0), 0) / marks.length);
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { showToast('Please select a student.', 'warning'); return; }
    if (!feedbackText.trim()) { showToast('Feedback text cannot be empty.', 'warning'); return; }
    setSubmittingFeedback(true);
    try {
      await addFeedback({
        studentId: Number(selectedStudent),
        mentorId: user?.id,
        text: feedbackText,
        rating: Number(feedbackRating),
      });
      setFeedbackText(''); setFeedbackRating(5);
      showToast('Feedback submitted successfully! ✅', 'success');
    } catch {
      showToast('Failed to submit feedback.', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { showToast('Please select a student.', 'warning'); return; }
    if (!goalTitle.trim()) { showToast('Goal title cannot be empty.', 'warning'); return; }
    setSubmittingGoal(true);
    try {
      await addGoal({ studentId: Number(selectedStudent), title: goalTitle });
      setGoalTitle('');
      showToast('Goal assigned successfully! 🎯', 'success');
    } catch {
      showToast('Failed to assign goal.', 'error');
    } finally {
      setSubmittingGoal(false);
    }
  };

  // Chart data
  const chartData = students.slice(0, 8).map((s) => ({
    name: s.name?.split(' ')[0] || 'Student',
    avgScore: avgScore(s.marks) ?? 0,
    attendance: Number(s.attendance) || 0,
  }));

  // Stats
  const myFeedbacks = (data.feedbacks || []).filter((f) => f.mentor_id === user?.id || f.mentor_name === user?.name);
  const myGoals = (data.goals || []).filter((g) => students.some((s) => s.id === g.student_id));

  // Activity feed
  const recentActivity = [
    ...myFeedbacks.slice(0, 3).map((f) => ({
      type: 'feedback', icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
      text: `Gave feedback to a student`, time: f.created_at || 'recently',
    })),
    ...myGoals.slice(0, 2).map((g) => ({
      type: 'goal', icon: <Flag className="w-4 h-4 text-purple-500" />,
      text: `Assigned goal: ${g.title}`, time: g.created_at || 'recently',
    })),
  ].slice(0, 5);

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-1">Mentor Portal</span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Mentor'} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            You are guiding <span className="font-semibold text-indigo-600">{students.length}</span> student{students.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2 self-start" onClick={() => window.print()}>
          <Download size={15} /> Export
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} className="text-blue-500" />} label="Total Students" value={students.length} color="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard icon={<Calendar size={20} className="text-purple-500" />} label="Active Sessions" value="—" color="bg-purple-50 dark:bg-purple-900/20" />
        <StatCard icon={<MessageSquare size={20} className="text-emerald-500" />} label="Feedback Given" value={myFeedbacks.length} color="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard icon={<Flag size={20} className="text-orange-500" />} label="Goals Assigned" value={myGoals.length} color="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      {/* Student Progress Table */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> Student Progress Overview
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-10">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">No students assigned yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 font-semibold">Student</th>
                  <th className="text-left py-3 font-semibold">Attendance</th>
                  <th className="text-left py-3 font-semibold">Avg Score</th>
                  <th className="text-left py-3 font-semibold">Study Hours</th>
                  <th className="text-left py-3 font-semibold">Goals</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const avg = avgScore(s.marks);
                  const studentGoals = (data.goals || []).filter((g) => g.student_id === s.id);
                  return (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center">
                            {s.name?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.attendance || 0}%` }} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{s.attendance ?? '—'}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`font-semibold ${avg >= 75 ? 'text-emerald-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {avg ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{s.study_hours ?? '—'} hrs</td>
                      <td className="py-3">
                        <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {studentGoals.length} goal{studentGoals.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" /> Student Performance Comparison
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="avgScore" name="Avg Score" radius={[6, 6, 0, 0]} barSize={28}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No performance data yet</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{a.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Feedback */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Quick Feedback
          </h2>
          <p className="text-sm text-gray-500 mb-4">Submit feedback for a student.</p>
          <form onSubmit={handleAddFeedback} className="space-y-3">
            <select required value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-field">
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea required className="input-field min-h-[100px] resize-none" placeholder="How did they do today?"
              value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <select className="input-field" value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
            <button type="submit" disabled={submittingFeedback} className="btn-primary w-full disabled:opacity-70">
              {submittingFeedback ? 'Submitting...' : 'Send Feedback ✉️'}
            </button>
          </form>
        </div>

        {/* Assign Goal */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Flag className="w-5 h-5 text-purple-500" /> Assign Academic Goal
          </h2>
          <p className="text-sm text-gray-500 mb-4">Define a learning target for your student.</p>
          <form onSubmit={handleAddGoal} className="space-y-3">
            <select required value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-field">
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input required type="text" className="input-field" placeholder="e.g. Complete Data Structures module"
              value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                💡 Be specific! Clear goals help students stay on track.
              </p>
            </div>
            <button type="submit" disabled={submittingGoal} className="btn-primary w-full disabled:opacity-70">
              {submittingGoal ? 'Assigning...' : 'Publish Goal 🎯'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
