import React, { useState } from 'react';
import { Camera, Mail, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || 'User Name');

  // Generate deterministic avatar background color based on email string
  const stringToColour = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour.substring(0, 7);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-primary font-bold text-2xl shadow-sm">
            {profileName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{profileName}</h1>
            <p className="text-sm md:text-base font-semibold text-primary capitalize flex items-center gap-2">
              <span className="badge bg-primary/10 text-primary">LEVEL 4</span>
              {user?.role || 'Guest'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">Cancel Updates</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                <input type="text" className="input-field h-12 bg-gray-50/50" value={profileName} onChange={e => setProfileName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" readOnly className="input-field h-12 bg-gray-100/50 text-gray-500 cursor-not-allowed" value={user?.email || ''} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Professional Bio</label>
                <textarea className="input-field min-h-[120px] bg-gray-50/50 resize-none py-3" defaultValue={`Passionate ${user?.role || 'member'} specializing in academic excellence. Currently seeking guidance.`}></textarea>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              Security & Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Current Password</label>
                  <a href="#" className="flex text-xs font-bold text-primary hover:text-indigo-700">Forgot Password?</a>
                </div>
                <input type="password" placeholder="••••••••" className="input-field h-12 bg-gray-50/50 w-full md:w-1/2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                <input type="password" placeholder="Minimum 8 characters" className="input-field h-12 bg-gray-50/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                <input type="password" placeholder="Re-enter password" className="input-field h-12 bg-gray-50/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
              </div>
              Preferences
            </h3>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Email Notifications</h4>
                  <p className="text-xs text-gray-500">Session reminders & updates</p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Activity Digest</h4>
                  <p className="text-xs text-gray-500">Weekly progress reports</p>
                </div>
                <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Mentorship Requests</h4>
                  <p className="text-xs text-gray-500">Instant app alerts</p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              
              <button className="btn-primary w-full h-12 mt-2">Save Changes</button>
              <button className="btn-secondary w-full h-12 bg-transparent shadow-none border-gray-200">Cancel Updates</button>
            </div>
          </div>

          <div className="card bg-primary text-white border-0 shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-4 opacity-10 transform translate-x-4 translate-y-4">
              <span className="text-8xl">✨</span>
            </div>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Curriculum Progress</p>
              <h2 className="text-4xl font-bold tracking-tight mb-4">84%</h2>
              
              <div className="w-full bg-white/20 rounded-full h-2 mb-6">
                <div className="bg-white h-2 rounded-full" style={{ width: '84%' }}></div>
              </div>

              <p className="text-sm text-white/90 italic">
                "Keep it up! You're on track to complete all major goals this semester."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
