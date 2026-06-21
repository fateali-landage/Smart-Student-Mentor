import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Clock, CheckCircle2, XCircle, FileText, Plus,
  AlertCircle, User, Timer, List, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/common/Modal';
import { authFetch } from '../../api';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</h3>
      </div>
    </div>
  );
}

function countdown(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return 'Now / Past';
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `in ${days}d ${hrs}h`;
  if (hrs > 0) return `in ${hrs}h ${mins}m`;
  return `in ${mins}m`;
}

export default function SessionManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [view, setView] = useState('list');

  const [notesModal, setNotesModal] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [viewNotes, setViewNotes] = useState(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/sessions');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load sessions.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const doAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      const res = await authFetch(`/api/sessions/${id}/${action}`, { method: 'PUT' });
      const data = await res.json();
      if (data.status === 'success' || res.ok) {
        showToast(`Session ${action}d successfully.`, 'success');
        loadSessions();
      } else {
        showToast(data.message || `Failed to ${action} session.`, 'error');
      }
    } catch {
      showToast(`Error performing action: ${action}.`, 'error');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const saveNotes = async (e) => {
    e.preventDefault();
    if (!notesText.trim()) { showToast('Notes cannot be empty.', 'warning'); return; }
    setSavingNotes(true);
    try {
      const res = await authFetch(`/api/sessions/${notesModal.id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes: notesText }),
      });
      const data = await res.json();
      if (data.status === 'success' || res.ok) {
        showToast('Notes saved successfully!', 'success');
        setNotesModal(null); setNotesText('');
        loadSessions();
      } else {
        showToast(data.message || 'Failed to save notes.', 'error');
      }
    } catch {
      showToast('Error saving notes.', 'error');
    } finally { setSavingNotes(false); }
  };

  const pending = sessions.filter((s) => s.status === 'pending');
  const approved = sessions.filter((s) => s.status === 'approved');
  const completed = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">Mentor Portal</span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student session requests and track progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'btn-secondary'}`}>
            <List size={15} /> List
          </button>
          <button onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${view === 'calendar' ? 'bg-indigo-600 text-white shadow-sm' : 'btn-secondary'}`}>
            <Calendar size={15} /> Calendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={20} className="text-indigo-500" />} label="Total" value={sessions.length} color="bg-indigo-50 dark:bg-indigo-900/20" />
        <StatCard icon={<AlertCircle size={20} className="text-yellow-500" />} label="Pending" value={pending.length} color="bg-yellow-50 dark:bg-yellow-900/20" />
        <StatCard icon={<CheckCircle2 size={20} className="text-emerald-500" />} label="Approved" value={approved.length} color="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard icon={<Timer size={20} className="text-blue-500" />} label="Completed" value={completed.length} color="bg-blue-50 dark:bg-blue-900/20" />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-gray-500">Loading sessions...</span>
        </div>
      ) : (
        <>
          {/* PENDING */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" /> Pending Requests
              {pending.length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">{pending.length}</span>
              )}
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">No pending session requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((sess) => (
                  <div key={sess.id} className="p-4 border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {sess.student_name?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{sess.student_name || 'Student'}</p>
                        <span className={`badge ${STATUS_STYLES.pending} text-xs`}>Pending</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{sess.title || 'Session Request'}</h3>
                    {sess.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{sess.description}</p>}
                    {sess.proposed_time && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Clock size={12} /> {new Date(sess.proposed_time).toLocaleString()}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => doAction(sess.id, 'approve')} disabled={!!actionLoading[sess.id]}
                        className="flex-1 btn-primary !py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                        <CheckCircle2 size={14} />
                        {actionLoading[sess.id] === 'approve' ? 'Approving...' : 'Approve'}
                      </button>
                      <button onClick={() => doAction(sess.id, 'reject')} disabled={!!actionLoading[sess.id]}
                        className="flex-1 bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                        <XCircle size={14} />
                        {actionLoading[sess.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Upcoming Sessions
            </h2>
            {approved.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">No upcoming sessions.</p>
            ) : (
              <div className="space-y-3">
                {approved.map((sess) => (
                  <div key={sess.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {sess.student_name?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{sess.title || 'Session'}</p>
                        <p className="text-xs text-gray-500">{sess.student_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {sess.proposed_time && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Scheduled</p>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{new Date(sess.proposed_time).toLocaleDateString()}</p>
                          <p className="text-xs text-emerald-600 font-semibold">{countdown(sess.proposed_time)}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { setNotesModal(sess); setNotesText(sess.notes || ''); }}
                          className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1">
                          <FileText size={12} /> Notes
                        </button>
                        <button onClick={() => doAction(sess.id, 'complete')} disabled={!!actionLoading[sess.id]}
                          className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1 disabled:opacity-60">
                          <CheckCircle2 size={12} />
                          {actionLoading[sess.id] === 'complete' ? '...' : 'Complete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETED */}
          {completed.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-500" /> Past Sessions
              </h2>
              <div className="space-y-2">
                {completed.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">
                        {sess.student_name?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{sess.title || 'Session'}</p>
                        <p className="text-xs text-gray-400">{sess.student_name} • {sess.proposed_time ? new Date(sess.proposed_time).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_STYLES.completed}`}>Completed</span>
                      {sess.notes && (
                        <button onClick={() => setViewNotes(sess)} className="text-gray-400 hover:text-indigo-600 transition-colors p-1">
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Notes Modal */}
      <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title={`Session Notes — ${notesModal?.title || ''}`}>
        <form onSubmit={saveNotes} className="space-y-4">
          <p className="text-sm text-gray-500">Add notes for your session with <strong>{notesModal?.student_name}</strong>.</p>
          <textarea className="input-field min-h-[140px] resize-none" placeholder="What was covered? Key takeaways?"
            value={notesText} onChange={(e) => setNotesText(e.target.value)} />
          <button type="submit" disabled={savingNotes} className="btn-primary w-full disabled:opacity-50">
            {savingNotes ? 'Saving...' : 'Save Notes 📝'}
          </button>
        </form>
      </Modal>

      {/* View Notes Modal */}
      <Modal isOpen={!!viewNotes} onClose={() => setViewNotes(null)} title={`Notes — ${viewNotes?.title || ''}`}>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Session with <strong>{viewNotes?.student_name}</strong></p>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewNotes?.notes || 'No notes recorded.'}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
