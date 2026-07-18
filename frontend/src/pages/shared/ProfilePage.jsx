import React, { useState, useEffect } from 'react';
import { Camera, Mail, Briefcase, Phone, Lock, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../api';
import { useToast } from '../../components/ui/Toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile forms state
  const [profile, setProfile] = useState({ name: '', bio: '', phone: '' });
  const [originalProfile, setOriginalProfile] = useState({ name: '', bio: '', phone: '' });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    pref_email_notifications: true,
    pref_activity_digest: false,
    pref_mentorship_requests: true,
  });

  const [togglingPref, setTogglingPref] = useState(null); // Tracks active toggle key

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          const u = data.user || data;
          const profData = {
            name: u.name || '',
            bio: u.bio || '',
            phone: u.phone || '',
          };
          setProfile(profData);
          setOriginalProfile(profData);
          setPreferences({
            pref_email_notifications: u.pref_email_notifications ?? true,
            pref_activity_digest: u.pref_activity_digest ?? false,
            pref_mentorship_requests: u.pref_mentorship_requests ?? true,
          });
        } else {
          showToast('Failed to load profile details', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server not reachable', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Check if profile form is dirty
  const isDirty = 
    profile.name !== originalProfile.name ||
    profile.bio !== originalProfile.bio ||
    profile.phone !== originalProfile.phone;

  // Handle personal information save
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      showToast('Full name is required', 'warning');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user || { ...user, ...profile };
        updateUser(updatedUser);
        setOriginalProfile(profile);
        showToast('Profile updated successfully!', 'success');
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.message || 'Failed to save changes', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Cancel profile updates
  const handleCancelProfile = () => {
    setProfile(originalProfile);
    showToast('Updates discarded', 'info');
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.old_password || !passwordForm.new_password) {
      showToast('Please fill out all password fields', 'warning');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await authFetch('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });
      if (res.ok) {
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        showToast('Password updated successfully!', 'success');
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Toggle Preference Helper with Rollback
  const handleTogglePreference = async (key) => {
    const previousValue = preferences[key];
    const newValue = !previousValue;

    // 1. Update UI immediately
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    setTogglingPref(key);

    // 2. Persist to API
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ [key]: newValue }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          updateUser(data.user);
        }
        showToast('Preferences auto-saved!', 'success');
      } else {
        // Rollback
        setPreferences(prev => ({ ...prev, [key]: previousValue }));
        showToast('Failed to save preference', 'error');
      }
    } catch (err) {
      console.error(err);
      // Rollback
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      showToast('Network error saving preferences', 'error');
    } finally {
      setTogglingPref(null);
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
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl shadow-sm">
            {profile.name ? profile.name.charAt(0).toUpperCase() : user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{profile.name || user?.name}</h1>
            <p className="text-sm md:text-base font-semibold text-indigo-600 dark:text-indigo-400 capitalize flex items-center gap-2 mt-0.5">
              <span className="badge bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">LEVEL 4</span>
              {user?.role || 'Guest'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCancelProfile} 
            disabled={!isDirty || savingProfile} 
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel Updates
          </button>
          <button 
            onClick={handleSaveProfile} 
            disabled={!isDirty || savingProfile} 
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile ? (
              <>
                <Loader2 className="animate-spin" size={14} /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg">
                <Briefcase size={18} />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="input-field h-12 bg-gray-50/50" 
                  value={profile.name} 
                  onChange={e => setProfile({ ...profile, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  readOnly 
                  className="input-field h-12 bg-gray-100/50 text-gray-500 cursor-not-allowed" 
                  value={user?.email || ''} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                <input 
                  type="text" 
                  className="input-field h-12 bg-gray-50/50" 
                  placeholder="e.g. +1 555-0199"
                  value={profile.phone} 
                  onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Professional Bio</label>
                <textarea 
                  className="input-field min-h-[120px] bg-gray-50/50 resize-none py-3" 
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Security & Password Card */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-lg">
                <Lock size={18} />
              </div>
              Security & Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required
                    className="input-field h-12 bg-gray-50/50 w-full md:w-1/2" 
                    value={passwordForm.old_password}
                    onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Minimum 6 characters" 
                    required
                    className="input-field h-12 bg-gray-50/50" 
                    value={passwordForm.new_password}
                    onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="Re-enter new password" 
                    required
                    className="input-field h-12 bg-gray-50/50" 
                    value={passwordForm.confirm_password}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={changingPassword}
                className="btn-primary h-12 px-6 flex items-center gap-2 disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Preferences & Progress Column */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-lg">
                <Settings size={18} />
              </div>
              Preferences
            </h3>
            
            <div className="space-y-6">
              {/* Email Notifications Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Email Notifications</h4>
                  <p className="text-xs text-gray-500">Session reminders & updates</p>
                </div>
                <button
                  type="button"
                  disabled={togglingPref === 'pref_email_notifications'}
                  onClick={() => handleTogglePreference('pref_email_notifications')}
                  className={`w-10 h-6 rounded-full relative transition-colors ${preferences.pref_email_notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'} ${togglingPref === 'pref_email_notifications' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${preferences.pref_email_notifications ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              {/* Activity Digest Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Activity Digest</h4>
                  <p className="text-xs text-gray-500">Weekly progress reports</p>
                </div>
                <button
                  type="button"
                  disabled={togglingPref === 'pref_activity_digest'}
                  onClick={() => handleTogglePreference('pref_activity_digest')}
                  className={`w-10 h-6 rounded-full relative transition-colors ${preferences.pref_activity_digest ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'} ${togglingPref === 'pref_activity_digest' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${preferences.pref_activity_digest ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Mentorship Requests Switch */}
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Mentorship Requests</h4>
                  <p className="text-xs text-gray-500">Instant app alerts</p>
                </div>
                <button
                  type="button"
                  disabled={togglingPref === 'pref_mentorship_requests'}
                  onClick={() => handleTogglePreference('pref_mentorship_requests')}
                  className={`w-10 h-6 rounded-full relative transition-colors ${preferences.pref_mentorship_requests ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'} ${togglingPref === 'pref_mentorship_requests' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${preferences.pref_mentorship_requests ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* Curriculum Progress Card */}
          <div className="card bg-indigo-600 text-white border-0 shadow-lg shadow-indigo-600/20 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-4 opacity-10 transform translate-x-4 translate-y-4">
              <span className="text-8xl">✨</span>
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Curriculum Progress</p>
              <h2 className="text-4xl font-bold tracking-tight mb-4">84%</h2>
              
              <div className="w-full bg-white/20 rounded-full h-2 mb-6">
                <div className="bg-white h-2 rounded-full" style={{ width: '84%' }}></div>
              </div>

              <p className="text-sm text-indigo-100 italic">
                "Keep it up! You're on track to complete all major goals this semester."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
