import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, CheckCircle2, ChevronRight, AlertCircle,
  HelpCircle, RefreshCw, BarChart3, Star, Target, Zap
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

export default function PlacementScore() {
  const { showToast } = useToast();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radarData, setRadarData] = useState([]);
  const [isCalculated, setIsCalculated] = useState(false);

  useEffect(() => {
    fetchPlacementScore();
  }, []);

  const fetchPlacementScore = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/placement-score');
      if (res.ok) {
        const data = await res.json();
        setScoreData(data);

        // Prep data for Radar Chart
        const breakdown = data.breakdown || {};
        const formattedRadar = [
          { subject: 'Goals Complete', A: breakdown.goals_score ?? 60, B: 100 },
          { subject: 'Attendance', A: breakdown.attendance_score ?? 80, B: 100 },
          { subject: 'Portfolio Strength', A: breakdown.portfolio_score ?? 40, B: 100 },
          { subject: 'Skill Assessments', A: breakdown.skills_score ?? 50, B: 100 },
          { subject: 'Mock Interviews', A: breakdown.interview_score ?? 70, B: 100 },
          { subject: 'Study Commitment', A: breakdown.study_score ?? 75, B: 100 }
        ];
        setRadarData(formattedRadar);
        setIsCalculated(true);
      } else {
        showToast("Failed to fetch placement readiness metrics", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server error calculating placement scores", "error");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return { text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900', ring: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
    if (score >= 40) return { text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900', ring: '#F59E0B', bg: 'bg-yellow-50 dark:bg-yellow-950/20' };
    return { text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900', ring: '#EF4444', bg: 'bg-red-50 dark:bg-red-950/20' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const score = scoreData?.placement_score ?? 0;
  const colors = getScoreColor(score);
  
  // Circular ring variables
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placement Score</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Evaluate and optimize your career placement metrics</p>
          </div>
        </div>
        <button 
          onClick={fetchPlacementScore} 
          className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs"
        >
          <RefreshCw size={14} /> Recalculate Score
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main circular score card */}
        <div className="card flex flex-col items-center justify-center text-center p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Placement Readiness Index</h3>
          
          <div className="relative flex items-center justify-center w-48 h-48 mb-4">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle
                stroke="#E2E8F0"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="dark:stroke-gray-800"
              />
              <circle
                stroke={colors.ring}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{score}%</span>
              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Ready</p>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
            {score >= 70 ? '🎉 Highly Placement Ready' : score >= 40 ? '⚠️ Average Placement Readiness' : '🚨 Critical Optimization Required'}
          </div>
        </div>

        {/* Radar analysis card */}
        <div className="card md:col-span-2 flex flex-col justify-between border border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Capabilities Profile</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Dimensions mapping based on backend calculations and academic stats.</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {isCalculated && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#718096', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#A0AEC0', fontSize: 9 }} />
                  <Radar name="My Profile" dataKey="A" stroke="#5A67D8" fill="#8B5CF6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={18} className="text-gray-400" /> Dimension Breakdown
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {radarData.map((dimension, i) => {
            const val = dimension.A;
            const dimColor = getScoreColor(val);
            return (
              <div key={i} className="card p-4 border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold dark:text-gray-400">{dimension.subject}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{val}%</span>
                  <span className={`badge py-0.5 px-2 text-[10px] ${dimColor.bg} ${dimColor.text}`}>
                    {val >= 70 ? 'Strong' : val >= 40 ? 'Moderate' : 'Weak'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: dimColor.ring }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations & Action list */}
      <div className="card space-y-4 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap size={18} className="text-amber-500" /> Actionable Placement Optimization Tasks
        </h3>
        
        {scoreData?.recommendations && scoreData.recommendations.length > 0 ? (
          <div className="space-y-3">
            {scoreData.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl text-sm border border-gray-50 dark:border-gray-900">
                <AlertCircle className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{rec.title || "Optimization Recommendation"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{rec.description || rec}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 p-3 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl text-sm border border-emerald-100/50 dark:border-emerald-900/20">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">Excellent Standing!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Your profile indices meet all optimal standards. Keep practicing interview quizzes and finalizing goals.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
