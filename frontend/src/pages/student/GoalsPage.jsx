import React, { useState, useEffect, useCallback } from 'react';
import {
  Target, Plus, Search, Trash2, Edit3, CheckCircle, Clock,
  AlertTriangle, Circle, Filter, Calendar, TrendingUp, X, ChevronDown,
} from 'lucide-react';
import { authFetch } from '../../api';
import { useToast } from '../../components/ui/Toast';

const CATEGORIES = ['Academics', 'Career', 'Skills', 'Personal'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const FILTERS = ['All', 'Not Started', 'In Progress', 'Completed', 'Overdue'];

const priorityStyles = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const statusMap = {
  not_started: { label: 'Not Started', icon: <Circle size={13} />, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'In Progress', icon: <Clock size={13} />, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  completed: { label: 'Completed', icon: <CheckCircle size={13} />, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  overdue: { label: 'Overdue', icon: <AlertTriangle size={13} />, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

function daysLeft(due) {
  if (!due) return null;
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  return diff;
}

function computeStatus(goal) {
  const prog = goal.progress ?? 0;
  const due = goal.due_date || goal.deadline;
  if (prog >= 100) return 'completed';
  if (due && new Date(due) < new Date() && prog < 100) return 'overdue';
  if (prog > 0) return 'in_progress';
  return 'not_started';
}

const defaultForm = { title: '', description: '', category: 'Academics', priority: 'Medium', due_date: '' };

export default function GoalsPage() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [progressGoal, setProgressGoal] = useState(null);
  const [progressVal, setProgressVal] = useState(0);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authFetch('/api/goals');
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast(e.message || 'Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const enrichedGoals = goals.map(g => ({ ...g, status: computeStatus(g) }));

  const filtered = enrichedGoals.filter(g => {
    const matchFilter = filter === 'All' || g.status === filter.toLowerCase().replace(' ', '_');
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: enrichedGoals.length,
    completed: enrichedGoals.filter(g => g.status === 'completed').length,
    inProgress: enrichedGoals.filter(g => g.status === 'in_progress').length,
    overdue: enrichedGoals.filter(g => g.status === 'overdue').length,
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required', 'warning');
    setSaving(true);
    try {
      await authFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title: form.title, description: form.description, category: form.category, priority: form.priority.toLowerCase(), due_date: form.due_date }),
      });
      showToast('Goal created!', 'success');
      setShowAdd(false);
      setForm(defaultForm);
      fetchGoals();
    } catch (e) {
      showToast(e.message || 'Failed to create goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authFetch(`/api/goals/${showEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: form.title, description: form.description, category: form.category, priority: form.priority.toLowerCase(), due_date: form.due_date }),
      });
      showToast('Goal updated!', 'success');
      setShowEdit(null);
      fetchGoals();
    } catch (e) {
      showToast(e.message || 'Failed to update goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/goals/${id}`, { method: 'DELETE' });
      showToast('Goal deleted', 'success');
      setConfirmDelete(null);
      fetchGoals();
    } catch (e) {
      showToast(e.message || 'Failed to delete goal', 'error');
    }
  };

  const handleProgress = async (id, value) => {
    try {
      await authFetch(`/api/goals/${id}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ progress: value }),
      });
      showToast('Progress updated!', 'success');
      setProgressGoal(null);
      fetchGoals();
    } catch (e) {
      showToast(e.message || 'Failed to update progress', 'error');
    }
  };

  const openEdit = (g) => {
    setForm({ title: g.title, description: g.description || '', category: g.category || 'Academics', priority: g.priority ? (g.priority.charAt(0).toUpperCase() + g.priority.slice(1)) : 'Medium', due_date: g.due_date || g.deadline || '' });
    setShowEdit(g);
  };

  const GoalForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Title *</label>
        <input className="input-field" placeholder="e.g. Complete Data Structures course" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
        <textarea className="input-field min-h-[80px] resize-none" placeholder="Describe your goal..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
          <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Priority</label>
          <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Due Date</label>
        <input type="date" className="input-field" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={() => { setShowAdd(false); setShowEdit(null); }} className="btn-secondary flex-1">Cancel</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="text-indigo-500" size={26} /> My Goals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your academic and personal milestones</p>
        </div>
        <button onClick={() => { setForm(defaultForm); setShowAdd(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Goal
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((s, i) => (
          <div key={i} className={`card text-center ${s.bg} border-0`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search goals..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse h-52">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Target size={56} className="text-gray-200 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No goals found</h3>
          <p className="text-sm text-gray-400 mb-6">{search || filter !== 'All' ? 'Try adjusting your filters' : "Start by creating your first goal!"}</p>
          {filter === 'All' && !search && (
            <button onClick={() => { setForm(defaultForm); setShowAdd(true); }} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Create Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(g => {
            const st = statusMap[g.status] || statusMap.not_started;
            const days = daysLeft(g.due_date || g.deadline);
            return (
              <div key={g.id} className="card group hover:scale-[1.01] transition-transform">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{g.title}</h3>
                    {g.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{g.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-500 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(g)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {g.category && <span className="badge bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{g.category}</span>}
                  {g.priority && <span className={`badge ${priorityStyles[g.priority?.charAt(0).toUpperCase() + g.priority?.slice(1)] || priorityStyles.Medium}`}>{g.priority}</span>}
                  <span className={`badge flex items-center gap-1 ${st.cls}`}>{st.icon} {st.label}</span>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{g.progress ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${g.status === 'completed' ? 'bg-emerald-500' : g.status === 'overdue' ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} style={{ width: `${g.progress ?? 0}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {days !== null ? (
                    <p className={`text-xs font-medium flex items-center gap-1 ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                      <Calendar size={11} /> {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `${days}d left`}
                    </p>
                  ) : <span />}
                  <button onClick={() => { setProgressGoal(g); setProgressVal(g.progress ?? 0); }} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Update Progress</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><Plus size={18} className="text-indigo-500" /> Add Goal</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5"><GoalForm onSubmit={handleAdd} submitLabel="Create Goal" /></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2"><Edit3 size={18} className="text-indigo-500" /> Edit Goal</h2>
              <button onClick={() => setShowEdit(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5"><GoalForm onSubmit={handleEdit} submitLabel="Save Changes" /></div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Delete Goal?</h3>
              <p className="text-sm text-gray-500 mb-6">"{confirmDelete.title}" will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {progressGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Update Progress</h3>
              <button onClick={() => setProgressGoal(null)} className="text-gray-400"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{progressGoal.title}</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Progress</span>
                <span className="font-bold text-indigo-500 text-lg">{progressVal}%</span>
              </div>
              <input type="range" min="0" max="100" value={progressVal} onChange={e => setProgressVal(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>100%</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setProgressGoal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleProgress(progressGoal.id, progressVal)} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
