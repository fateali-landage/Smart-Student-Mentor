import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, Clock, CheckCircle2, AlertCircle, FileText,
  User, Send, MessageSquare, ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';
import Modal from '../../components/common/Modal';

export default function TaskManager() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isMentor = user?.role === 'mentor' || user?.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]); // Mentor only
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter Tab
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'assigned' | 'submitted' | 'reviewed' | 'approved'

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Forms State
  const [createForm, setCreateForm] = useState({
    student_id: '',
    title: '',
    description: '',
    resource_url: '',
    due_date: ''
  });
  const [submissionText, setSubmissionText] = useState('');
  const [reviewForm, setReviewForm] = useState({
    feedback: '',
    status: 'approved' // 'approved' | 'reviewed'
  });

  useEffect(() => {
    fetchTasks();
    if (isMentor) {
      fetchStudents();
    }
  }, [isMentor]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || data || []);
      } else {
        showToast("Failed to fetch task list", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error retrieving tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await authFetch('/api/my-students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || data || []);
      }
    } catch (err) {
      console.error("Error loading students list", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.student_id || !createForm.title || !createForm.due_date) {
      showToast("Please fill in all required fields", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      if (res.ok) {
        showToast("Task assigned successfully!", "success");
        setIsCreateOpen(false);
        setCreateForm({ student_id: '', title: '', description: '', resource_url: '', due_date: '' });
        fetchTasks();
      } else {
        showToast("Failed to create task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error creating task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText) {
      showToast("Submission text cannot be empty", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/tasks/${selectedTask.id}/submit`, {
        method: 'PUT',
        body: JSON.stringify({ submission_text: submissionText })
      });
      if (res.ok) {
        showToast("Task submission uploaded successfully!", "success");
        setIsSubmitOpen(false);
        setSubmissionText('');
        fetchTasks();
      } else {
        showToast("Failed to submit task", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMentorReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/tasks/${selectedTask.id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewForm)
      });
      if (res.ok) {
        showToast("Submission reviewed and updated!", "success");
        setIsReviewOpen(false);
        setReviewForm({ feedback: '', status: 'approved' });
        fetchTasks();
      } else {
        showToast("Failed to submit review", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status, dueDate) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'assigned';
    if (isOverdue) return <span className="badge bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">Overdue</span>;

    switch (status) {
      case 'assigned':
        return <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Assigned</span>;
      case 'submitted':
        return <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">Submitted</span>;
      case 'reviewed':
        return <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">Reviewed</span>;
      case 'approved':
        return <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Approved</span>;
      default:
        return null;
    }
  };

  const filteredTasks = tasks.filter(t => activeTab === 'all' || t.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Summary counts
  const totalCount = tasks.length;
  const pendingReview = tasks.filter(t => t.status === 'submitted').length;
  const completedCount = tasks.filter(t => t.status === 'approved' || t.status === 'reviewed').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <ClipboardList className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isMentor ? 'Assign and review student tasks' : 'Track and submit your assigned deliverables'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchTasks} className="btn-secondary p-2 rounded-xl" title="Refresh task list">
            <RefreshCw size={15} />
          </button>
          {isMentor && (
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus size={14} /> Assign New Task
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pending Action</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{pendingReview}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 gap-4">
        {['all', 'assigned', 'submitted', 'reviewed', 'approved'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-semibold capitalize border-b-2 relative transition-all ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks List Grid */}
      {filteredTasks.length === 0 ? (
        <div className="card text-center py-12 border border-gray-100 dark:border-gray-800">
          <ClipboardList className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={40} />
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-base">No tasks found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No tasks correspond to the selected filter tab.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status === 'assigned';
            return (
              <div 
                key={task.id} 
                className={`card flex flex-col justify-between border transition-all ${
                  isOverdue 
                    ? 'border-red-200 dark:border-red-950/40 bg-red-50/10' 
                    : 'border-gray-50 dark:border-gray-900/50 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">{task.title}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <User size={12} /> {isMentor ? `Assigned to student: ${task.student_name || task.student_email || 'Student'}` : `Assigned by Mentor`}
                      </p>
                    </div>
                    {getStatusBadge(task.status, task.due_date)}
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 font-semibold pt-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                    {task.resource_url && (
                      <a href={task.resource_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Attached Resource
                      </a>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-50 dark:border-gray-900 pt-3 mt-4 flex justify-end gap-2">
                  {/* Student Submission Options */}
                  {!isMentor && task.status === 'assigned' && (
                    <button 
                      onClick={() => { setSelectedTask(task); setIsSubmitOpen(true); }}
                      className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                    >
                      <Send size={12} /> Submit Work
                    </button>
                  )}

                  {/* Mentor Grading Options */}
                  {isMentor && task.status === 'submitted' && (
                    <button 
                      onClick={() => { setSelectedTask(task); setIsReviewOpen(true); }}
                      className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                    >
                      <Eye size={12} /> Grade / Review
                    </button>
                  )}

                  {/* Feedback display */}
                  {task.feedback && (
                    <div className="w-full bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <MessageSquare size={11} /> Mentor Feedback:
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">{task.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Task Modal (Mentor) */}
      {isCreateOpen && (
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Assign New Task">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Target Student *</label>
              <select
                value={createForm.student_id}
                onChange={(e) => setCreateForm({ ...createForm, student_id: e.target.value })}
                className="input-field text-sm"
                required
              >
                <option value="">Select a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Task Title *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="input-field text-sm"
                placeholder="e.g. Implement bcrypt hashing in API"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="input-field min-h-[80px] text-sm"
                placeholder="Provide instructions, expectations, and milestones..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Resource URL (GitHub, Docs, etc.)</label>
              <input
                type="url"
                value={createForm.resource_url}
                onChange={(e) => setCreateForm({ ...createForm, resource_url: e.target.value })}
                className="input-field text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Due Date *</label>
              <input
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                className="input-field text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary text-xs">
                {submitting ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Submit Work Modal */}
      {isSubmitOpen && (
        <Modal isOpen={isSubmitOpen} onClose={() => setIsSubmitOpen(false)} title={`Submit: ${selectedTask?.title}`}>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Submission Details *</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="input-field min-h-[120px] text-sm"
                placeholder="Describe your solution, paste github links, explain implementation details..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setIsSubmitOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary text-xs">
                {submitting ? 'Submitting...' : 'Upload Submission'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mentor Grade/Review Modal */}
      {isReviewOpen && (
        <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title={`Review: ${selectedTask?.title}`}>
          <div className="space-y-3 mb-4 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Student Submission Text</p>
              <p className="text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">{selectedTask?.submission_text}</p>
            </div>
          </div>

          <form onSubmit={handleMentorReview} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Status *</label>
              <select
                value={reviewForm.status}
                onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                className="input-field text-sm"
                required
              >
                <option value="approved">Approve & Complete</option>
                <option value="reviewed">Reviewed (Needs Revisions)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Feedback / Comments *</label>
              <textarea
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                className="input-field min-h-[100px] text-sm"
                placeholder="Provide constructive feedback, suggestions, score guidelines..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setIsReviewOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary text-xs">
                {submitting ? 'Saving Review...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
