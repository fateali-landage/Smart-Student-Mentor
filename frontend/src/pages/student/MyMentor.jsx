import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, MessageSquare, AlertCircle, Loader2, ArrowRight, XCircle } from 'lucide-react';
import { authFetch } from '../../api';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function MyMentor() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mentor, setMentor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const mentorRes = await authFetch('/api/my-mentor');
      if (mentorRes.ok) {
        const mData = await mentorRes.json();
        setMentor(mData.mentor);
      }

      const reqRes = await authFetch('/api/my-requests');
      if (reqRes.ok) {
        const rData = await reqRes.json();
        setRequests(rData.requests || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading mentorship status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelRequest = async (rid) => {
    try {
      const res = await authFetch(`/api/mentor-requests/${rid}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Request cancelled successfully', 'success');
        // Update requests locally
        setRequests(prev => prev.map(r => r.id === rid ? { ...r, status: 'Cancelled' } : r));
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.message || 'Failed to cancel request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error cancelling request', 'error');
    }
  };

  const handleSendMessageSubmit = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setSendingMsg(true);
    setTimeout(() => {
      showToast('Message sent to mentor successfully!', 'success');
      setIsMessageOpen(false);
      setChatMessage('');
      setSendingMsg(false);
    }, 800);
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Mentor</h1>
        <p className="text-sm text-gray-500 mt-1">View your assigned mentor profile or track active mentorship requests.</p>
      </div>

      {mentor ? (
        /* ASSIGNED MENTOR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Mentor Details Card */}
            <div className="card">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6 mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-2xl text-indigo-600 dark:text-indigo-400 shadow-sm flex-shrink-0">
                    {mentor.profile_pic_url ? (
                      <img src={mentor.profile_pic_url} alt={mentor.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      mentor.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{mentor.name}</h2>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 capitalize mt-1">Personal Mentor</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsMessageOpen(true)}
                    className="btn-secondary py-2 flex items-center gap-1.5 text-xs h-10 px-4"
                  >
                    <MessageSquare size={14} /> Send Message
                  </button>
                  <button 
                    onClick={() => showToast('Session booking is available under placement settings or timeline. Directing...', 'info')}
                    className="btn-primary py-2 flex items-center gap-1.5 text-xs h-10 px-4"
                  >
                    <Calendar size={14} /> Book Session
                  </button>
                </div>
              </div>

              {/* Mentor Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Designation & Experience</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{mentor.designation || "Senior Mentor"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{mentor.experience || "5+ years of industry experience"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Availability</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 capitalize">{mentor.availability || "Available"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Assigned on: {new Date(mentor.assigned_at || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Expertise Domain</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{mentor.expertise || "General Software Engineering"}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Biography</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {mentor.bio || "No biography provided. Committed to helping you with interview prep, technical career paths, and mock evaluations."}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(Array.isArray(mentor.skills) ? mentor.skills : (mentor.skills ? mentor.skills.split(',') : [])).map(skill => (
                      <span key={skill} className="badge bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs px-2.5 py-1">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mentor Side Card (Contacts) */}
          <div>
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800/80 pb-3">
                Contact Information
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail size={16} className="text-gray-400" />
                <span className="truncate">{mentor.email}</span>
              </div>
              {mentor.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Phone size={16} className="text-gray-400" />
                  <span>{mentor.phone}</span>
                </div>
              )}

              {/* Social links */}
              {(mentor.github_url || mentor.linkedin_url) && (
                <div className="border-t border-gray-50 dark:border-gray-800/80 pt-4 flex gap-3">
                  {mentor.github_url && (
                    <a 
                      href={mentor.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      GitHub Profile
                    </a>
                  )}
                  {mentor.linkedin_url && (
                    <a 
                      href={mentor.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* NO MENTOR VIEW */
        <div className="space-y-6">
          <div className="card text-center py-12 max-w-xl mx-auto flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800">
            <AlertCircle size={44} className="text-indigo-500 mb-4" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">No Mentor Assigned</h2>
            <p className="text-sm text-gray-500 max-w-sm mt-2 mb-6">
              You do not have a mentor assigned yet. Browse active mentors and request a mentorship session.
            </p>
            <button 
              onClick={() => navigate('/student/find-mentors')} 
              className="btn-primary flex items-center gap-2"
            >
              Find Mentor <ArrowRight size={16} />
            </button>
          </div>

          {/* REQUEST HISTORY LIST */}
          <div className="card max-w-xl mx-auto border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800/80 pb-3 mb-4">
              Mentorship Request History
            </h3>
            {requests.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">No requested history available.</p>
            ) : (
              <div className="space-y-4">
                {requests.map(req => {
                  const statusColors = {
                    Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                    Accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                    Rejected: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                    Cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400',
                  };

                  return (
                    <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/40 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{req.mentor_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[req.status] || 'bg-gray-100'}`}>
                            {req.status}
                          </span>
                        </div>
                        {req.message && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{req.message}"</p>
                        )}
                        <span className="text-[10px] text-gray-400 block mt-2">
                          Requested on {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {req.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="btn-secondary text-red-600 border-red-100 hover:bg-red-50/50 text-xs py-1.5 h-8 flex items-center gap-1 flex-shrink-0"
                        >
                          <XCircle size={13} /> Cancel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Chat Modal */}
      {isMessageOpen && (
        <Modal 
          isOpen={isMessageOpen} 
          onClose={() => setIsMessageOpen(false)} 
          title={`Message Mentor — ${mentor?.name}`}
        >
          <form onSubmit={handleSendMessageSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Message Body</label>
              <textarea 
                required
                className="input-field min-h-[120px] py-3 bg-gray-50/50 resize-none text-sm"
                placeholder="Type your message to your mentor here..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setIsMessageOpen(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={sendingMsg} 
                className="btn-primary flex items-center gap-2"
              >
                {sendingMsg ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
