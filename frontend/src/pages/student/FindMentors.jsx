import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Check, AlertCircle, Loader2, Star, Users, MessageSquare } from 'lucide-react';
import { authFetch } from '../../api';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function FindMentors() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minRating, setMinRating] = useState(0);

  // Request Modal State
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasMentor, setHasMentor] = useState(false);

  // Detail Modal State
  const [viewingMentor, setViewingMentor] = useState(null);

  // Fetch mentors & student profile
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if student already has a mentor
        const userRes = await authFetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          const u = userData.user || userData;
          if (u.mentor_id) {
            setHasMentor(true);
          }
        }

        const res = await authFetch('/api/mentors');
        if (res.ok) {
          const data = await res.json();
          setMentors(data.mentors || []);
        } else {
          showToast('Failed to load mentors list', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error fetching mentors', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequestClick = (mentor) => {
    if (hasMentor) {
      showToast('You already have an assigned mentor!', 'warning');
      return;
    }
    setSelectedMentor(mentor);
    setMessage('');
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/mentor-requests', {
        method: 'POST',
        body: JSON.stringify({
          mentor_id: selectedMentor.id,
          message,
        }),
      });

      const data = await res.json();
      if (res.status === 201) {
        showToast(`Request sent to ${selectedMentor.name}!`, 'success');
        setSelectedMentor(null);
      } else {
        showToast(data.message || 'Failed to submit request', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error submitting request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract all unique skills across all mentors for filters
  const allSkills = Array.from(
    new Set(
      mentors.flatMap(m => 
        Array.isArray(m.skills) ? m.skills : (m.skills ? m.skills.split(',').map(s => s.trim()) : [])
      )
    )
  ).sort();

  // Filter Logic
  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
      (m.bio && m.bio.toLowerCase().includes(search.toLowerCase()));

    const mSkills = Array.isArray(m.skills) ? m.skills : (m.skills ? m.skills.split(',').map(s => s.trim()) : []);
    const matchesSkill = !selectedSkill || mSkills.some(s => s.toLowerCase() === selectedSkill.toLowerCase());

    const matchesRating = Number(m.average_rating || 0) >= minRating;

    return matchesSearch && matchesSkill && matchesRating;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-8">
      {/* Banner / Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Find Mentors</h1>
          <p className="text-sm text-gray-500 mt-1">Submit guidance requests to academic and technical mentors.</p>
        </div>
        {hasMentor && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800 text-sm font-medium">
            <Check size={16} /> Already Assigned to a Mentor
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or keyword..." 
            className="input-field pl-10 h-11" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Skill Filter */}
        <div>
          <select 
            className="input-field h-11"
            value={selectedSkill}
            onChange={e => setSelectedSkill(e.target.value)}
          >
            <option value="">All Skills / Domains</option>
            {allSkills.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Min Rating */}
        <div>
          <select 
            className="input-field h-11"
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
          >
            <option value="0">All Ratings</option>
            <option value="4">4.0+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Grid of Mentors */}
      {filteredMentors.length === 0 ? (
        <div className="card text-center py-12 flex flex-col items-center justify-center text-gray-400">
          <AlertCircle size={36} className="mb-2 text-gray-300" />
          <p className="text-base font-semibold">No mentors match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map(mentor => {
            const mSkills = Array.isArray(mentor.skills) 
              ? mentor.skills 
              : (mentor.skills ? mentor.skills.split(',').map(s => s.trim()) : []);

            return (
              <div key={mentor.id} className="card flex flex-col justify-between hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-800">
                <div>
                  {/* Card Header Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                      <Star size={12} fill="currentColor" /> {mentor.average_rating || '5.0'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                      <Users size={12} /> {mentor.student_count} Students
                    </span>
                  </div>

                  {/* Profile Pic + Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-400 shadow-sm flex-shrink-0">
                      {mentor.profile_pic_url ? (
                        <img src={mentor.profile_pic_url} alt={mentor.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        mentor.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{mentor.name}</h3>
                      <p className="text-xs text-indigo-500 font-semibold mt-0.5 capitalize">Academic Mentor</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                    {mentor.bio || "No biography provided. Committed to helping students achieve placement, roadmap guidelines, and skill updates."}
                  </p>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {mSkills.slice(0, 3).map(skill => (
                      <span key={skill} className="badge bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5">
                        {skill}
                      </span>
                    ))}
                    {mSkills.length > 3 && (
                      <span className="badge bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 font-bold">
                        +{mSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 border-t border-gray-50 dark:border-gray-800/60 pt-4">
                  <button 
                    onClick={() => setViewingMentor(mentor)}
                    className="btn-secondary py-2 flex-1 text-xs"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleRequestClick(mentor)}
                    disabled={hasMentor}
                    className="btn-primary py-2 flex-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Request Mentorship
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {selectedMentor && (
        <Modal 
          isOpen={!!selectedMentor} 
          onClose={() => setSelectedMentor(null)} 
          title={`Request Mentorship — ${selectedMentor.name}`}
        >
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed mb-1">
              <strong>Tip:</strong> Introduce yourself and summarize your placement goals or target tech stack so your mentor knows how best to support you.
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Personal Message</label>
              <textarea 
                className="input-field min-h-[120px] py-3 bg-gray-50/50 resize-none text-sm"
                placeholder="e.g. Hi! I'm hoping to study system designs and full-stack React projects with you..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setSelectedMentor(null)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Submitting...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mentor Profile Detail Modal */}
      {viewingMentor && (
        <Modal
          isOpen={!!viewingMentor}
          onClose={() => setViewingMentor(null)}
          title="Mentor Profile Details"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center font-bold text-xl text-indigo-600 shadow-sm flex-shrink-0">
                {viewingMentor.profile_pic_url ? (
                  <img src={viewingMentor.profile_pic_url} alt={viewingMentor.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  viewingMentor.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{viewingMentor.name}</h3>
                <p className="text-sm text-indigo-500 font-semibold capitalize mt-0.5">Academic Mentor</p>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Star size={12} fill="currentColor" /> {viewingMentor.average_rating || '5.0'} Rating
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                    <Users size={12} /> {viewingMentor.student_count} Assigned Students
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Biography</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {viewingMentor.bio || "No biography provided. This mentor is committed to steering student goals, career path mapping, mock interview preparations, and placement curriculum."}
              </p>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Skills & Expertise</h4>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(Array.isArray(viewingMentor.skills) ? viewingMentor.skills : (viewingMentor.skills ? viewingMentor.skills.split(',') : [])).map(skill => (
                  <span key={skill} className="badge bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs px-2.5 py-1">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {viewingMentor.phone && (
              <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Contact Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{viewingMentor.phone}</p>
              </div>
            )}

            <div className="flex justify-end border-t border-gray-100 dark:border-gray-800/80 pt-4">
              <button 
                onClick={() => setViewingMentor(null)} 
                className="btn-secondary w-28"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
