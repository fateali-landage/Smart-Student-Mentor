import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, UserCheck, Users, BookOpen } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../../components/common/Modal';
import { authFetch } from '../../api';

export default function AdminDashboard() {
  const { data, addUser, deleteUser, assignMentor } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: 'student', email: '', password: '' });

  const [pending, setPending] = useState([]);
  const [assignments, setAssignments] = useState({}); // requestId -> mentorId

  const loadPending = useCallback(async () => {
    try {
      const res = await authFetch('/api/pending-requests');
      const json = await res.json();
      setPending(Array.isArray(json) ? json : []);
    } catch {
      setPending([]);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending, data.users]);

  const students = data.users.filter((u) => u.role === 'student');
  const mentors = data.users.filter((u) => u.role === 'mentor');
  const filteredUsers = data.users.filter(
    (u) => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
      addUser(newUser);
      setIsModalOpen(false);
      setNewUser({ name: '', role: 'student', email: '', password: '' });
    }
  };

  const handleAssign = async (req) => {
    const mentorId = assignments[req.id];
    if (!mentorId) return;
    await assignMentor(req.student_id, Number(mentorId), req.id);
    loadPending();
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Real-time metrics for your mentorship ecosystem.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 self-start md:self-auto">
          <Plus size={18} /> New User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-500"><Users size={22} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Students</p>
            <h3 className="text-2xl font-bold">{students.length}</h3>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-500"><UserCheck size={22} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Mentors</p>
            <h3 className="text-2xl font-bold">{mentors.length}</h3>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600"><BookOpen size={22} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-2xl font-bold">{pending.length}</h3>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><BookOpen size={22} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Goals</p>
            <h3 className="text-2xl font-bold">{data.goals.length}</h3>
          </div>
        </div>
      </div>

      {/* Pending mentor requests */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Pending Mentor Requests</h3>
        {pending.length === 0 ? (
          <p className="text-sm italic text-gray-500">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Subject</th>
                  <th className="text-left py-2">Message</th>
                  <th className="text-left py-2">Assign Mentor</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((req) => (
                  <tr key={req.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <p className="font-bold">{req.student_name}</p>
                      <p className="text-xs text-gray-400">{req.student_email}</p>
                    </td>
                    <td className="py-3">{req.preferred_subject}</td>
                    <td className="py-3 text-gray-500 max-w-xs truncate">{req.message || '—'}</td>
                    <td className="py-3">
                      <select
                        className="input-field !h-9 !py-1 text-sm"
                        value={assignments[req.id] || ''}
                        onChange={(e) => setAssignments({ ...assignments, [req.id]: e.target.value })}
                      >
                        <option value="">Select mentor</option>
                        {mentors.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleAssign(req)}
                        disabled={!assignments[req.id]}
                        className="btn-primary !h-9 !py-1 text-sm disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User directory */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold">User Directory</h3>
          <input
            type="text"
            placeholder="Search users..."
            className="input-field md:w-72"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Mentor</th>
                <th className="text-left py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-3">
                    <p className="font-bold">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="py-3 capitalize">{u.role}</td>
                  <td className="py-3">
                    {u.role === 'student' ? (
                      <select
                        className="input-field !h-9 !py-1 text-sm"
                        value={u.mentor_id || ''}
                        onChange={(e) => assignMentor(u.id, Number(e.target.value))}
                      >
                        <option value="">Unassigned</option>
                        {mentors.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    ) : u.role === 'mentor' ? (
                      <span className="text-xs text-gray-500">
                        {students.filter((s) => s.mentor_id === u.id).length} student(s)
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3">
                    <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-semibold">
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="4" className="py-6 text-center text-sm text-gray-500 italic">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add User">
        <form onSubmit={handleAddUser} className="space-y-4">
          <input required placeholder="Name" className="input-field" value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="input-field" value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input type="password" placeholder="Password (default: 1234)" className="input-field" value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <select className="input-field" value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
