import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

export default function MentorAssignment() {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stdRes, mntRes] = await Promise.all([
        authFetch(`/api/admin/students?search=${studentSearch}`),
        authFetch(`/api/admin/mentors?search=${mentorSearch}`)
      ]);
      const stdData = await stdRes.json();
      const mntData = await mntRes.json();
      if (stdData.status === 'success') setStudents(stdData.students);
      if (mntData.status === 'success') setMentors(mntData.mentors);
    } catch (err) {
      showToast('Error loading assignments data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentSearch, mentorSearch]);

  const handleAssign = async (mentorId) => {
    if (!selectedStudent) return;
    const isReassign = selectedStudent.mentor_id != null;
    const endpoint = isReassign ? '/api/admin/reassign-mentor' : '/api/admin/assign-mentor';
    const method = isReassign ? 'PUT' : 'POST';

    try {
      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent.id, mentor_id: mentorId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message, 'success');
        fetchData(); // reload
        setSelectedStudent(null);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Error assigning mentor', 'error');
    }
  };

  const handleRemove = async () => {
    if (!selectedStudent || !selectedStudent.mentor_id) return;
    try {
      const res = await authFetch('/api/admin/remove-mentor', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent.id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message, 'success');
        fetchData();
        setSelectedStudent(null);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Error removing mentor', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentor Assignment</h1>
        <p className="text-sm text-gray-500">Assign or reassign mentors to students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel: Students */}
        <div className="card flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Students</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {students.map((s) => (
              <div 
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`p-3 rounded-lg cursor-pointer mb-2 border transition-colors flex items-center justify-between
                  ${selectedStudent?.id === s.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                `}
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{s.name}</h3>
                  <p className="text-xs text-gray-500">{s.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {s.mentor_id ? (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <UserCheck size={12} /> {s.mentor_name}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Mentors */}
        <div className="card flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              {selectedStudent ? `Assign to ${selectedStudent.name}` : 'Select a student first'}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search mentors..."
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                disabled={!selectedStudent}
                className="pl-9 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedStudent ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Select a student from the left panel to assign a mentor.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedStudent.mentor_id && (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">Current Mentor: {selectedStudent.mentor_name}</p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">Removing the mentor will leave the student unassigned.</p>
                    </div>
                    <button onClick={handleRemove} className="btn-secondary text-red-600 border-red-200 hover:bg-red-100">
                      Remove
                    </button>
                  </div>
                )}
                
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 mt-4">Available Mentors</h3>
                {mentors.map((m) => (
                  <div key={m.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{m.name}</h4>
                          <p className="text-xs text-gray-500">{m.designation || 'Mentor'}</p>
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            <p>Students: <span className="font-medium text-gray-900 dark:text-gray-300">{m.student_count}</span></p>
                            <p>Expertise: {m.expertise || 'General'}</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAssign(m.id)}
                        disabled={selectedStudent.mentor_id === m.id}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedStudent.mentor_id === m.id 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {selectedStudent.mentor_id === m.id ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
