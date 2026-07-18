import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Calendar, Shield, Mail, Phone } from 'lucide-react';
import { authFetch } from '../../api';
import { useToast } from '../../components/ui/Toast';

export default function MentorRequests() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null); // Tracks accepting/rejecting request id

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/mentor-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        showToast('Failed to load mentorship requests', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (rid, studentName) => {
    setActioningId(rid);
    try {
      const res = await authFetch(`/api/mentor-requests/${rid}/accept`, {
        method: 'PUT',
      });
      if (res.ok) {
        showToast(`Successfully accepted ${studentName} as your student!`, 'success');
        // Refresh list
        fetchRequests();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.message || 'Failed to accept request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error processing request', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (rid, studentName) => {
    setActioningId(rid);
    try {
      const res = await authFetch(`/api/mentor-requests/${rid}/reject`, {
        method: 'PUT',
      });
      if (res.ok) {
        showToast(`Declined request from ${studentName}.`, 'info');
        // Refresh list
        fetchRequests();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.message || 'Failed to reject request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error processing request', 'error');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Mentor Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process mentorship requests from students seeking placement guidance.</p>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12 flex flex-col items-center justify-center text-gray-400">
          <AlertCircle size={36} className="mb-2 text-gray-300" />
          <p className="text-base font-semibold">No pending mentorship requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map(req => {
            const studentSkills = Array.isArray(req.student_skills) 
              ? req.student_skills 
              : (req.student_skills ? req.student_skills.split(',').map(s => s.trim()) : []);

            return (
              <div key={req.id} className="card border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all duration-150">
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  {/* Student Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center font-bold text-2xl text-violet-600 dark:text-violet-400 shadow-sm flex-shrink-0">
                    {req.student_profile_pic ? (
                      <img src={req.student_profile_pic} alt={req.student_name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      req.student_name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{req.student_name}</h3>
                      <p className="text-xs text-violet-500 font-semibold capitalize mt-0.5">Student Applicant</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Mail size={13} /> {req.student_email}</span>
                      {req.student_phone && (
                        <span className="flex items-center gap-1"><Phone size={13} /> {req.student_phone}</span>
                      )}
                    </div>

                    {req.student_bio && (
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Biography</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">{req.student_bio}</p>
                      </div>
                    )}

                    {studentSkills.length > 0 && (
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {studentSkills.map(s => (
                            <span key={s} className="badge bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.message && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/30 dark:border-indigo-800/20 max-w-2xl mt-4">
                        <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Request Message</span>
                        <p className="text-sm text-gray-700 dark:text-indigo-200 italic leading-relaxed">
                          "{req.message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accept / Reject Buttons */}
                <div className="flex flex-row md:flex-col gap-2 justify-end items-end w-full md:w-44 flex-shrink-0 self-end md:self-center">
                  <button
                    disabled={actioningId !== null}
                    onClick={() => handleAccept(req.id, req.student_name)}
                    className="btn-primary w-full h-10 flex items-center justify-center gap-1.5 text-xs"
                  >
                    {actioningId === req.id ? (
                      <Loader2 className="animate-spin" size={13} />
                    ) : (
                      <>
                        <Check size={14} /> Accept Request
                      </>
                    )}
                  </button>
                  <button
                    disabled={actioningId !== null}
                    onClick={() => handleReject(req.id, req.student_name)}
                    className="btn-secondary w-full h-10 border-red-100 text-red-600 hover:bg-red-50/50 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <X size={14} /> Reject Request
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
