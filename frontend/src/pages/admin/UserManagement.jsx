import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, ToggleLeft, ToggleRight, Trash2, Edit,
  Shield, Check, UserPlus, FileDown, ArrowLeft, ArrowRight, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';
import Modal from '../../components/common/Modal';

const COLORS = ['#5A67D8', '#8B5CF6', '#F59E0B'];

export default function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'mentor' | 'admin'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Modals State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms State
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [assignedMentorId, setAssignedMentorId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchMentorsList();
  }, [currentPage, roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build query string
      let query = `/api/users?page=${currentPage}&limit=${limit}`;
      if (roleFilter !== 'all') query += `&role=${roleFilter}`;
      if (search) query += `&q=${encodeURIComponent(search)}`;

      const res = await authFetch(query);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data.data || []);
        // Calculate pagination if backend sends metadata
        setTotalPages(data.total_pages || Math.ceil((data.total_count || 1) / limit) || 1);
      } else {
        showToast("Failed to retrieve system users", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorsList = async () => {
    try {
      const res = await authFetch('/api/users?role=mentor&limit=100');
      if (res.ok) {
        const data = await res.json();
        setMentors(data.users || data.data || []);
      }
    } catch (err) {
      console.error("Error loading mentors list", err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      showToast("Please fill in all fields", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch('/api/users/add', {
        method: 'POST',
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        showToast("User account created successfully!", "success");
        setIsAddOpen(false);
        setAddForm({ name: '', email: '', password: '', role: 'student' });
        fetchUsers();
      } else {
        const errorData = await res.json();
        showToast(errorData.message || "Failed to create user", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error creating user account", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    try {
      const res = await authFetch(`/api/users/${userObj.id}/status`, {
        method: 'PUT'
      });
      if (res.ok) {
        showToast(`User status toggled!`, "success");
        fetchUsers();
      } else {
        showToast("Failed to modify user status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error modifying user status", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to soft delete this user account?")) return;
    try {
      const res = await authFetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("User soft deleted successfully", "success");
        fetchUsers();
      } else {
        showToast("Failed to delete user account", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error deleting user", "error");
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch('/api/assign-mentor', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedUser.id,
          mentor_id: assignedMentorId
        })
      });
      if (res.ok) {
        showToast("Mentor assigned successfully!", "success");
        setIsAssignOpen(false);
        setAssignedMentorId('');
        fetchUsers();
      } else {
        showToast("Failed to assign mentor", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (users.length === 0) return;
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Email,Role,Status,Created At\n";
    
    // Rows
    users.forEach(u => {
      csvContent += `${u.id},"${u.name}","${u.email}",${u.role},${u.is_active ? 'Active' : 'Inactive'},"${u.created_at || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartmentor_users_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file exported successfully!", "success");
  };

  // Compile role stats for Pie Chart
  const roleDistribution = () => {
    const counts = { student: 0, mentor: 0, admin: 0 };
    users.forEach(u => {
      if (counts[u.role] !== undefined) counts[u.role]++;
    });
    return [
      { name: 'Students', value: counts.student || 1 },
      { name: 'Mentors', value: counts.mentor || 0 },
      { name: 'Admins', value: counts.admin || 0 }
    ];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all student, mentor, and administrator accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV} 
            className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs"
            title="Export all users to CSV file"
          >
            <FileDown size={14} /> Export CSV
          </button>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus size={14} /> Add New User
          </button>
        </div>
      </div>

      {/* Role Distribution Chart and Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-2 flex flex-col justify-between border border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">User Directory Filter controls</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="input-field pl-9 text-xs py-2"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="input-field text-xs py-2"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="mentor">Mentors</option>
                <option value="admin">Administrators</option>
              </select>

              <div className="flex justify-end gap-2 items-center text-xs text-gray-400">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 rounded-lg disabled:opacity-40"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 rounded-lg disabled:opacity-40"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50 dark:border-gray-900/50 mt-4 text-center">
            <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-xl">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Users</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{users.filter(u => u.is_active).length}</h4>
            </div>
            <div className="p-3 bg-amber-50/30 dark:bg-amber-950/10 rounded-xl">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Suspended</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{users.filter(u => !u.is_active).length}</h4>
            </div>
            <div className="p-3 bg-purple-50/30 dark:bg-purple-950/10 rounded-xl">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Loaded</p>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</h4>
            </div>
          </div>
        </div>

        <div className="card h-48 md:h-auto flex flex-col justify-center items-center border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 self-start">Active Role Distribution</h3>
          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Users directory list */}
      <div className="card overflow-x-auto border border-gray-100 dark:border-gray-800 p-0">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-xs">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-900/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">No users found. Try modifying filters.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/30 dark:hover:bg-gray-900/20 transition-all">
                  <td className="p-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm capitalize shrink-0">
                      {u.name ? u.name[0] : '?'}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-4 font-medium text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="p-4">
                    <span className={`badge uppercase text-[10px] ${
                      u.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      u.role === 'mentor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4 text-right flex justify-end gap-1.5">
                    {/* Assign Mentor Button for students */}
                    {u.role === 'student' && (
                      <button
                        onClick={() => { setSelectedUser(u); setIsAssignOpen(true); }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-all"
                        title="Assign Mentor to Student"
                      >
                        <UserPlus size={15} />
                      </button>
                    )}

                    {/* Toggle Active Status */}
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`p-1.5 rounded-lg transition-all ${u.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'}`}
                      title={u.is_active ? 'Suspend Account' : 'Activate Account'}
                    >
                      {u.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                    </button>

                    {/* Soft Delete */}
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      title="Soft Delete Account"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New System User">
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-semibold">Full Name *</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="input-field text-sm"
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-semibold">Email Address *</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="input-field text-sm"
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-semibold">Password *</label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="input-field text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-semibold">Account Role *</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="input-field text-sm"
                required
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary text-xs">
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Mentor Modal */}
      {isAssignOpen && (
        <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title={`Assign Mentor: ${selectedUser?.name}`}>
          <form onSubmit={handleAssignMentor} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 font-semibold">Select Mentor *</label>
              <select
                value={assignedMentorId}
                onChange={(e) => setAssignedMentorId(e.target.value)}
                className="input-field text-sm"
                required
              >
                <option value="">Choose mentor...</option>
                {mentors.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => { setIsAssignOpen(false); setAssignedMentorId(''); }} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary text-xs">
                {submitting ? 'Assigning...' : 'Assign Mentor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
