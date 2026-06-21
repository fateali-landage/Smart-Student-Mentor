import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, MessageSquare, Mail, Search, Download, Flag, X,
  ChevronDown, ChevronUp, BookOpen, Star, Target
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/common/Modal';
import { authFetch } from '../../api';

function exportCSV(students) {
  const rows = [
    ['Name', 'Email', 'Attendance (%)', 'Avg Score', 'Study Hours', 'Goals'],
    ...students.map((s) => {
      const avg = s.marks?.length
        ? Math.round(s.marks.reduce((a, m) => a + Number(m.score || 0), 0) / s.marks.length)
        : '—';
      return [s.name, s.email, s.attendance ?? '—', avg, s.study_hours ?? '—', s.goals?.length ?? 0];
    }),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'my_students.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function MyStudentsPage() {
  const { user } = useAuth();
  const { data, addFeedback, addGoal } = useData();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Feedback modal
  const [feedbackModal, setFeedbackModal] = useState(null); // student obj
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFb, setSubmittingFb] = useState(false);

  // Goal modal
  const [goalModal, setGoalModal] = useState(null); // student obj
  const [goalTitle, setGoalTitle] = useState('');
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await authFetch(`/api/my-students/${user.id}`);
      const json = await res.json();
      setStudents(Array.isArray(json) ? json : []);
    } catch {
      showToast('Failed to load students.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const avgScore = (marks) => {
    if (!Array.isArray(marks) || marks.length === 0) return null;
    return Math.round(marks.reduce((a, m) => a + (Number(m.score) || 0), 0) / marks.length);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) { showToast('Feedback cannot be empty.', 'warning'); return; }
    setSubmittingFb(true);
    try {
      await addFeedback({ studentId: feedbackModal.id, mentorId: user.id, text: feedbackText, rating: Number(feedbackRating) });
      setFeedbackModal(null); setFeedbackText(''); setFeedbackRating(5);
      showToast(`Feedback sent to ${feedbackModal.name} ✅`, 'success');
    } catch {
      showToast('Failed to submit feedback.', 'error');
    } finally { setSubmittingFb(false); }
  };

  const submitGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) { showToast('Goal title cannot be empty.', 'warning'); return; }
    setSubmittingGoal(true);
    try {
      await addGoal({ studentId: goalModal.id, title: goalTitle });
      setGoalModal(null); setGoalTitle('');
      showToast(`Goal assigned to ${goalModal.name} 🎯`, 'success');
    } catch {
      showToast('Failed to assign goal.', 'error');
    } finally { setSubmittingGoal(false); }
  };

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStudentGoals = (sid) => (data.goals || []).filter((g) => g.student_id === sid);
  const getStudentFeedbacks = (sid) => (data.feedbacks || []).filter((f) => f.student_id === sid && (f.mentor_id === user?.id || f.mentor_name === user?.name));

  const getPerformanceChart = (marks) => {
    if (!Array.isArray(marks) || marks.length === 0) return [];
    return marks.map((m, i) => ({ name: m.subject || `Test ${i + 1}`, score: Number(m.score) || 0 }));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} assigned to your mentorship
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportCSV(students)} className="btn-secondary flex items-center gap-2">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-12 h-11"
          placeholder="Search students by name or email..."
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Students */}
      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-gray-500">Loading students...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500 font-medium">{search ? 'No students match your search.' : 'No students assigned yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const avg = avgScore(s.marks);
            const goals = getStudentGoals(s.id);
            const feedbacks = getStudentFeedbacks(s.id);
            const isExpanded = expandedId === s.id;
            const perfChart = getPerformanceChart(s.marks);

            return (
              <div key={s.id} className="card transition-all">
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                      {s.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{s.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail size={11} /> {s.email}
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-center px-3 py-1.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Attendance</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{s.attendance ?? '—'}%</p>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Avg Score</p>
                      <p className={`text-base font-bold ${avg >= 75 ? 'text-emerald-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{avg ?? '—'}</p>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Study Hrs</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{s.study_hours ?? '—'}</p>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Goals</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{goals.length}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setFeedbackModal(s); setFeedbackText(''); setFeedbackRating(5); }}
                      className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1">
                      <MessageSquare size={13} /> Feedback
                    </button>
                    <button onClick={() => { setGoalModal(s); setGoalTitle(''); }}
                      className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1">
                      <Flag size={13} /> Goal
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="text-gray-400 hover:text-gray-600 p-1">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Goals */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-500" /> Goals ({goals.length})
                      </h4>
                      {goals.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No goals assigned.</p>
                      ) : (
                        <div className="space-y-2">
                          {goals.map((g) => (
                            <div key={g.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.title}</p>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Progress</span><span>{g.progress ?? 0}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${g.progress || 0}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Feedbacks */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" /> Feedbacks ({feedbacks.length})
                      </h4>
                      {feedbacks.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No feedbacks given yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {feedbacks.slice(0, 3).map((f, i) => (
                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{f.feedback_text}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: f.rating || 0 }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Performance Chart */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-500" /> Performance
                      </h4>
                      {perfChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={120}>
                          <LineChart data={perfChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                            <Line type="monotone" dataKey="score" stroke="#5A67D8" strokeWidth={2} dot={{ fill: '#5A67D8', r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-28 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                          <p className="text-xs text-gray-400 italic">No marks recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      <Modal isOpen={!!feedbackModal} onClose={() => setFeedbackModal(null)} title={`Feedback for ${feedbackModal?.name || ''}`}>
        <form onSubmit={submitFeedback} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Feedback</label>
            <textarea required className="input-field min-h-[120px] resize-none"
              placeholder="Share your observations..." value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Rating</label>
            <select className="input-field" value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <button type="submit" disabled={submittingFb} className="btn-primary w-full disabled:opacity-50">
            {submittingFb ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Modal>

      {/* Goal Modal */}
      <Modal isOpen={!!goalModal} onClose={() => setGoalModal(null)} title={`Assign Goal to ${goalModal?.name || ''}`}>
        <form onSubmit={submitGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Goal Title</label>
            <input required type="text" className="input-field"
              placeholder="e.g. Complete Chapter 5 exercises" value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)} />
          </div>
          <button type="submit" disabled={submittingGoal} className="btn-primary w-full disabled:opacity-50">
            {submittingGoal ? 'Assigning...' : 'Assign Goal 🎯'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
