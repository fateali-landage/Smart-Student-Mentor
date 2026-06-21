import React, { useState, useEffect } from 'react';
import { Trophy, Shield, Lock, Award, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

const BADGES_CONFIG = [
  {
    key: 'first_goal',
    title: 'First Milestone',
    description: 'Complete your first placement or academic goal',
    xp: 100,
    emoji: '🚀',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    key: 'five_goals',
    title: 'Goal Setter',
    description: 'Complete 5 goals inside your study dashboard',
    xp: 250,
    emoji: '🎯',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    key: 'ten_goals',
    title: 'Goal Master',
    description: 'Complete 10 goals inside your study dashboard',
    xp: 500,
    emoji: '👑',
    gradient: 'from-amber-400 to-orange-500'
  },
  {
    key: 'active_learner',
    title: 'Active Learner',
    description: 'Accumulate 20+ study hours in a performance log',
    xp: 200,
    emoji: '🔥',
    gradient: 'from-emerald-400 to-teal-500'
  },
  {
    key: 'top_performer',
    title: 'Top Performer',
    description: 'Achieve an average score of 90%+ in skill assessments',
    xp: 400,
    emoji: '⚡',
    gradient: 'from-cyan-400 to-blue-500'
  },
  {
    key: 'interview_ready',
    title: 'Interview Ready',
    description: 'Score 80%+ accuracy in any mock interview mode',
    xp: 300,
    emoji: '🎓',
    gradient: 'from-rose-500 to-purple-600'
  }
];

export default function AchievementsPage() {
  const { showToast } = useToast();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/achievements');
      if (res.ok) {
        const data = await res.json();
        // data should be an array of achievement objects from backend DB e.g. [{badge_key, earned_at, ...}]
        const list = data.achievements || data || [];
        setEarnedBadges(list);

        // Calculate XP
        let totalXp = 0;
        list.forEach(eb => {
          const conf = BADGES_CONFIG.find(bc => bc.key === eb.badge_key);
          if (conf) {
            totalXp += conf.xp;
          }
        });
        setXp(totalXp);
      } else {
        showToast("Failed to fetch achievements", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error loading achievements", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNow = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/achievements/check', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.unlocked && data.unlocked.length > 0) {
          showToast(`🏆 Congratulations! You unlocked ${data.unlocked.length} new badge(s)!`, "success");
        } else {
          showToast("No new badges unlocked. Continue updating goals and mock interviews to trigger checks!", "info");
        }
        fetchAchievements();
      } else {
        showToast("Error checking achievements status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const earnedKeys = earnedBadges.map(eb => eb.badge_key);
  const totalAvailable = BADGES_CONFIG.length;
  const totalEarned = earnedBadges.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Trophy className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements & Badges</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unlock credentials and placement achievements</p>
          </div>
        </div>
        <button 
          onClick={handleCheckNow} 
          className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-xs"
        >
          <Sparkles size={14} /> Scan for Badges
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center justify-between border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Badges Earned</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {totalEarned} <span className="text-sm text-gray-400 font-semibold">/ {totalAvailable}</span>
            </h2>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Trophy size={28} />
          </div>
        </div>

        <div className="card flex items-center justify-between border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total XP Points</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {xp} <span className="text-sm text-gray-400 font-semibold">XP</span>
            </h2>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
            <Sparkles size={28} />
          </div>
        </div>

        <div className="card flex items-center justify-between border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Completion Rate</p>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {Math.round((totalEarned / totalAvailable) * 100)}%
            </h2>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
            <Shield size={28} />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {BADGES_CONFIG.map((badge) => {
          const isEarned = earnedKeys.includes(badge.key);
          const earnedInfo = earnedBadges.find(eb => eb.badge_key === badge.key);
          const earnedDate = earnedInfo?.earned_at ? new Date(earnedInfo.earned_at).toLocaleDateString() : null;

          return (
            <div 
              key={badge.key} 
              className={`card relative overflow-hidden transition-all duration-300 border ${
                isEarned 
                  ? 'border-indigo-100 dark:border-indigo-950/40 bg-white dark:bg-gray-900 shadow-md shadow-indigo-50 dark:shadow-none' 
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 opacity-70'
              }`}
            >
              <div className="flex gap-4 items-start relative">
                {/* Badge Icon */}
                <div className={`w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-3xl shadow-md ${
                  isEarned ? 'animate-pulse' : 'grayscale contrast-50'
                }`}>
                  {badge.emoji}
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{badge.title}</h3>
                    <span className={`badge shrink-0 text-[10px] ${
                      isEarned 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' 
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                    }`}>
                      +{badge.xp} XP
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {badge.description}
                  </p>

                  {isEarned ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      <Calendar size={12} /> Unlocked on {earnedDate || 'Just Now'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold pt-1">
                      <Lock size={12} /> Locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
