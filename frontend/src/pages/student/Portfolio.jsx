import React, { useState, useEffect } from 'react';
import {
  Briefcase, Award, Code2, Link, Plus, Trash2, Edit3, Save,
  Globe, FileText, Phone, User, Check, AlertCircle, Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';
import Modal from '../../components/common/Modal';

export default function Portfolio() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState({
    bio: '',
    phone: '',
    github_url: '',
    linkedin_url: '',
    skills: [],
    interests: []
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'certifications' | 'skills'

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemType, setItemType] = useState('project'); // 'project' | 'certification' | 'skill'

  // Add Item Form State
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    url: '',
    tech_stack: ''
  });
  const [addingItem, setAddingItem] = useState(false);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    bio: '',
    phone: '',
    github_url: '',
    linkedin_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user profile
      const profRes = await authFetch('/api/users/me');
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData.user || profData);
        setProfileForm({
          bio: profData.user?.bio || profData.bio || '',
          phone: profData.user?.phone || profData.phone || '',
          github_url: profData.user?.github_url || profData.github_url || '',
          linkedin_url: profData.user?.linkedin_url || profData.linkedin_url || ''
        });
      }

      // 2. Fetch portfolio items
      const itemsRes = await authFetch('/api/portfolio');
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || itemsData || []);
      }
    } catch (err) {
      console.error("Error loading portfolio data", err);
      showToast("Failed to load portfolio details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, ...profileForm }));
        if (updateUser) {
          updateUser(data.user || { ...user, ...profileForm });
        }
        showToast("Profile information updated successfully!", "success");
        setIsEditProfileOpen(false);
      } else {
        showToast("Failed to save profile changes", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddItemSave = async (e) => {
    e.preventDefault();
    if (!itemForm.title) {
      showToast("Title is required", "warning");
      return;
    }
    setAddingItem(true);
    try {
      // Format tech stack as array if project
      const body = {
        type: itemType,
        title: itemForm.title,
        description: itemForm.description,
        url: itemForm.url,
        tech_stack: itemForm.tech_stack ? itemForm.tech_stack.split(',').map(s => s.trim()) : []
      };

      const res = await authFetch('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`${itemType.toUpperCase()} item added!`, "success");
        setIsAddItemOpen(false);
        // Reset form
        setItemForm({ title: '', description: '', url: '', tech_stack: '' });
        // Refresh items list
        fetchData();
      } else {
        showToast("Failed to add portfolio item", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await authFetch(`/api/portfolio/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        showToast("Portfolio item deleted", "success");
      } else {
        showToast("Failed to delete portfolio item", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error deleting item", "error");
    }
  };

  // Filter items by active tab
  const filteredItems = items.filter(item => item.type === activeTab.slice(0, -1) || item.type === activeTab); // Handles singular/plural mapping

  // Base64 file upload helper
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Resume size must be under 2MB", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await authFetch('/api/users/me', {
          method: 'PUT',
          body: JSON.stringify({ resume_data: base64Data }) // backend-supported profile pic / bio / phone fields
        });
        if (res.ok) {
          showToast("Resume uploaded successfully!", "success");
        } else {
          showToast("Failed to upload resume", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Resume upload failed", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Info Header */}
      <div className="card relative overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
        <div className="relative pt-12 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-md border-4 border-white dark:border-gray-800 flex items-center justify-center font-bold text-3xl text-indigo-600 dark:text-indigo-400 capitalize">
            {profile.name ? profile.name[0] : user?.name?.[0] || '?'}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name || user?.name}</h1>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{profile.role || user?.role}</p>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs"
              >
                <Edit3 size={14} /> Edit Profile Info
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              {profile.bio || "No biography provided. Add details about your placements goals, experience levels, and technology preferences!"}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
              {profile.phone && (
                <span className="flex items-center gap-1"><Phone size={13} /> {profile.phone}</span>
              )}
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg> GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-px">
        <div className="flex gap-4">
          {['projects', 'certifications', 'skills'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-semibold relative capitalize transition-all border-b-2 ${
                activeTab === tab 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <label className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs cursor-pointer">
            <Upload size={14} /> Upload Resume
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
          </label>

          <button 
            onClick={() => {
              setItemType(activeTab.slice(0, -1)); // map projects -> project, etc.
              setIsAddItemOpen(true);
            }}
            className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add {activeTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {filteredItems.length === 0 ? (
        <div className="card text-center py-12 border border-gray-100 dark:border-gray-800">
          <Briefcase className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={40} />
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-base">No items found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1">
            Click the Add button above to create and list items in your platform portfolio.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="card hover:shadow-md transition-all border border-gray-50 dark:border-gray-900 flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {activeTab === 'projects' && <Code2 className="text-indigo-600" size={16} />}
                    {activeTab === 'certifications' && <Award className="text-purple-600" size={16} />}
                    {activeTab === 'skills' && <Check className="text-emerald-600" size={16} />}
                    {item.title}
                  </h3>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                    title="Delete item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                    {item.description}
                  </p>
                )}

                {/* Tech Stack for Projects */}
                {activeTab === 'projects' && item.tech_stack && item.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tech_stack.map((tech, i) => (
                      <span key={i} className="badge text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {item.url && (
                <div className="border-t border-gray-50 dark:border-gray-900 pt-3 mt-4">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 w-fit"
                  >
                    <Link size={13} /> View Resource URL
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit Profile Details">
          <form onSubmit={handleEditProfileSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Biography</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="input-field min-h-[100px] text-sm"
                placeholder="Introduce yourself, write about your goals, stack interests, achievements..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Phone number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="input-field text-sm"
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">GitHub Profile URL</label>
              <input
                type="url"
                value={profileForm.github_url}
                onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                className="input-field text-sm"
                placeholder="https://github.com/username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">LinkedIn Profile URL</label>
              <input
                type="url"
                value={profileForm.linkedin_url}
                onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                className="input-field text-sm"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={savingProfile} className="btn-primary text-xs">
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Portfolio Item Modal */}
      {isAddItemOpen && (
        <Modal 
          isOpen={isAddItemOpen} 
          onClose={() => setIsAddItemOpen(false)} 
          title={`Add New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
        >
          <form onSubmit={handleAddItemSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Title / Name</label>
              <input
                type="text"
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                className="input-field text-sm"
                placeholder={`e.g. ${itemType === 'project' ? 'SmartMentor web app' : itemType === 'certification' ? 'AWS Developer Associate' : 'Python Programming'}`}
                required
              />
            </div>

            {itemType !== 'skill' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="input-field min-h-[80px] text-sm"
                  placeholder="Provide details about features, learning, objectives..."
                />
              </div>
            )}

            {itemType === 'project' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  value={itemForm.tech_stack}
                  onChange={(e) => setItemForm({ ...itemForm, tech_stack: e.target.value })}
                  className="input-field text-sm"
                  placeholder="React, Express, Node.js, Postgres"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {itemType === 'project' ? 'GitHub / Deployment URL' : itemType === 'certification' ? 'Credential / Verify URL' : 'Verification Link (optional)'}
              </label>
              <input
                type="url"
                value={itemForm.url}
                onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                className="input-field text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setIsAddItemOpen(false)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" disabled={addingItem} className="btn-primary text-xs">
                {addingItem ? 'Adding...' : 'Add Portfolio Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
