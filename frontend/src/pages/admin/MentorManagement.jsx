import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Shield, X, Check, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';
import Modal from '../../components/common/Modal';

export default function MentorManagement() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMentor, setEditMentor] = useState(null);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/mentors?search=${search}`);
      const data = await res.json();
      if (data.status === 'success') {
        setMentors(data.mentors);
      }
    } catch (err) {
      showToast('Error loading mentors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentor Management</h1>
          <p className="text-sm text-gray-500">Add, edit, and manage mentors in the system.</p>
        </div>
        <button 
          onClick={() => { setEditMentor(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Mentor
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search mentors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Designation</th>
                <th className="px-6 py-4 font-medium">Students</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">Loading mentors...</td>
                </tr>
              ) : mentors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No mentors found.</td>
                </tr>
              ) : mentors.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{m.name}</td>
                  <td className="px-6 py-4 text-gray-500">{m.email}</td>
                  <td className="px-6 py-4 text-gray-500">{m.designation || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{m.student_count || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.is_active ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
