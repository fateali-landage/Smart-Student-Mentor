import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Clock, Award } from 'lucide-react';
import { useData } from '../../context/DataContext';
import BASE_URL from '../../api';

export default function ReportsPage() {
  const { data } = useData();
  const [perfRows, setPerfRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/api/reports/performance`)
      .then((r) => r.json())
      .then((rows) => { if (!cancelled) setPerfRows(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setPerfRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Aggregate average score per subject across all students
  const subjectAvg = (() => {
    const totals = {};
    const counts = {};
    perfRows.forEach((row) => {
      const marks = Array.isArray(row.marks) ? row.marks : [];
      marks.forEach((m) => {
        if (!m || !m.subject) return;
        totals[m.subject] = (totals[m.subject] || 0) + (Number(m.score) || 0);
        counts[m.subject] = (counts[m.subject] || 0) + 1;
      });
    });
    return Object.keys(totals).map((subject) => ({
      name: subject,
      'Average Score': Math.round(totals[subject] / counts[subject]),
    }));
  })();

  const totalStudents = perfRows.length;
  const avgAttendance = totalStudents
    ? Math.round(perfRows.reduce((a, r) => a + (Number(r.attendance) || 0), 0) / totalStudents)
    : 0;
  const totalHours = perfRows.reduce((a, r) => a + (Number(r.study_hours) || 0), 0);
  const feedbackCount = (data.feedbacks || []).length;
  const latestFeedback = (data.feedbacks || [])[0];

  return (
    <div className="w-full space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1 block">Performance Overview</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
            Average performance across all students, attendance, and recent feedback.
          </p>
        </div>
        <button className="btn-primary self-start md:self-auto flex items-center gap-2 h-12 px-6" onClick={() => window.print()}>
          ↓ Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Average Score by Subject</h3>
              <p className="text-xs text-gray-500 font-medium">Across {totalStudents} student{totalStudents === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="w-full h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
            ) : subjectAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAvg}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="Average Score" fill="#5A67D8" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-gray-500 italic text-sm">No marks recorded yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Attendance Tracking</h3>
            <p className="text-xs text-gray-500 font-medium">Average across all students</p>
          </div>
          <div className="relative flex justify-center items-center my-6">
            <div className="w-44 h-44 rounded-full border-[12px] border-emerald-500 flex justify-center items-center relative z-10 bg-white dark:bg-gray-800">
              <div className="text-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{avgAttendance}%</span>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Average</span>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500">
            {totalStudents} student{totalStudents === 1 ? '' : 's'} reporting
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card flex items-start gap-4 p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex justify-center items-center text-primary flex-shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recent Mentor Feedback</p>
            {latestFeedback ? (
              <>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">"{latestFeedback.feedback_text}"</p>
                <p className="text-xs font-bold text-primary mt-2">— {latestFeedback.mentor_name || 'Mentor'}</p>
              </>
            ) : (
              <p className="text-sm italic text-gray-500">No feedback yet</p>
            )}
            <p className="text-[10px] text-gray-400 mt-2">{feedbackCount} total feedback{feedbackCount === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="card flex items-start gap-4 p-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex justify-center items-center text-emerald-500 flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Study Hours</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours}</p>
            <p className="text-xs text-gray-500 mt-1">Logged across all students</p>
          </div>
        </div>

        <div className="card flex items-start gap-4 p-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex justify-center items-center text-purple-500 flex-shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Top Subjects</p>
            <div className="flex flex-wrap gap-2">
              {subjectAvg
                .slice()
                .sort((a, b) => b['Average Score'] - a['Average Score'])
                .slice(0, 4)
                .map((s) => (
                  <span key={s.name} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                    {s.name} · {s['Average Score']}
                  </span>
                ))}
              {subjectAvg.length === 0 && (
                <span className="text-xs italic text-gray-400">No subjects tracked yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
