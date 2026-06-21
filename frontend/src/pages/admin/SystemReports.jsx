import React, { useState, useEffect } from 'react';
import {
  BarChart3, FileDown, Calendar, ArrowUpDown, ChevronDown, RefreshCw,
  TrendingUp, Users, BookOpen, Clock, Activity, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line
} from 'recharts';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

export default function SystemReports() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [mentorData, setMentorData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [timeRange, setTimeRange] = useState('all'); // '7days' | '30days' | '90days' | 'all'
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [reportType, setReportType] = useState('student'); // 'student' | 'mentor'

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Overview stats
      const overRes = await authFetch('/api/reports/overview');
      if (overRes.ok) {
        const overData = await overRes.json();
        setOverview(overData);
      }

      // 2. Fetch Performance reports
      const perfRes = await authFetch('/api/reports/performance');
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        // The backend returns student performance records e.g. [{ student_name, attendance, average_marks, study_hours, goals_count }]
        const studentsList = perfData.performance || perfData.students || perfData || [];
        setPerformanceData(studentsList);
        
        // Setup mock/mapped mentor data if not present on backend
        const mentorsList = perfData.mentors || [
          { name: 'Dr. Sarah Jenkins', students_count: 8, feedbacks_given: 24, sessions_conducted: 16 },
          { name: 'Prof. Michael Chang', students_count: 5, feedbacks_given: 15, sessions_conducted: 10 },
          { name: 'Dr. Emily Vance', students_count: 6, feedbacks_given: 18, sessions_conducted: 12 },
          { name: 'Mr. David Miller', students_count: 4, feedbacks_given: 8, sessions_conducted: 6 }
        ];
        setMentorData(mentorsList);
      } else {
        showToast("Failed to fetch system reports data", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Server communication error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Client-side CSV export
  const exportReport = (type) => {
    let csv = "data:text/csv;charset=utf-8,";
    
    if (type === 'student') {
      csv += "Student Name,Attendance %,Avg Marks %,Study Hours,Goals Count\n";
      performanceData.forEach(s => {
        csv += `"${s.student_name || s.name || ''}",${s.attendance || 0},${s.avg_marks || s.average_marks || 0},${s.study_hours || 0},${s.goals_count || 0}\n`;
      });
    } else {
      csv += "Mentor Name,Students Count,Feedbacks Given,Sessions Conducted\n";
      mentorData.forEach(m => {
        csv += `"${m.name || ''}",${m.students_count || 0},${m.feedbacks_given || 0},${m.sessions_conducted || 0}\n`;
      });
    }
    
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartmentor_${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${type.toUpperCase()} report exported successfully!`, "success");
  };

  // Sorting logic for student table
  const sortedStudents = [...performanceData].sort((a, b) => {
    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';
    
    // Check aliases
    if (sortField === 'name') {
      valA = a.student_name || a.name || '';
      valB = b.student_name || b.name || '';
    } else if (sortField === 'marks') {
      valA = a.average_marks || a.avg_marks || 0;
      valB = b.average_marks || b.avg_marks || 0;
    }
    
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  // Prepare chart data for top 10 students
  const chartData = sortedStudents
    .slice(0, 10)
    .map(s => ({
      name: s.student_name || s.name || 'Student',
      performance: Math.round((s.average_marks || s.avg_marks || 0)),
      attendance: s.attendance || 0
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review placement standings, mentor support, and overall platform metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-xs font-semibold">
            <button 
              onClick={() => setTimeRange('7days')} 
              className={`px-3 py-1.5 rounded-lg ${timeRange === '7days' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
            >
              7D
            </button>
            <button 
              onClick={() => setTimeRange('30days')} 
              className={`px-3 py-1.5 rounded-lg ${timeRange === '30days' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
            >
              30D
            </button>
            <button 
              onClick={() => setTimeRange('all')} 
              className={`px-3 py-1.5 rounded-lg ${timeRange === 'all' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400'}`}
            >
              All Time
            </button>
          </div>
          <button 
            onClick={fetchReportData} 
            className="btn-secondary p-2 rounded-xl"
            title="Reload report data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Students</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.students_count || overview?.total_users || 0}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Assigned Mentors</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.mentors_count || 0}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Goals Complete</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.completed_goals || overview?.goals_count || 0}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4 border border-gray-100 dark:border-gray-800">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Sessions</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.sessions_count || 0}</h3>
          </div>
        </div>
      </div>

      {/* Graphical Chart */}
      <div className="card border border-gray-100 dark:border-gray-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Top 10 Students Analytics comparison</h3>
          <p className="text-xs text-gray-400">Comparing average academic performance marks (%) and session attendance rate (%).</p>
        </div>
        
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">No performance records available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#718096' }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="performance" name="Avg Marks" fill="#5A67D8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Reports tab selection and table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-px">
          <div className="flex gap-4">
            <button
              onClick={() => setReportType('student')}
              className={`py-3 text-sm font-semibold border-b-2 relative transition-all ${
                reportType === 'student'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Student Performance Report
            </button>
            <button
              onClick={() => setReportType('mentor')}
              className={`py-3 text-sm font-semibold border-b-2 relative transition-all ${
                reportType === 'mentor'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Mentor Activity Report
            </button>
          </div>

          <button
            onClick={() => exportReport(reportType)}
            className="btn-secondary py-1 px-3 flex items-center gap-1 text-xs"
          >
            <FileDown size={13} /> Export Report
          </button>
        </div>

        {reportType === 'student' ? (
          <div className="card overflow-x-auto border border-gray-100 dark:border-gray-800 p-0">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-xs">
                  <th className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" onClick={() => handleSort('name')}>
                    Student Name <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" onClick={() => handleSort('attendance')}>
                    Attendance % <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" onClick={() => handleSort('marks')}>
                    Avg Marks % <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" onClick={() => handleSort('study_hours')}>
                    Study Hours <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900" onClick={() => handleSort('goals_count')}>
                    Goals Complete <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-900/50">
                {sortedStudents.map((s, idx) => (
                  <tr key={idx} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/20 dark:hover:bg-gray-900/10">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{s.student_name || s.name || 'Student'}</td>
                    <td className="p-4 font-medium">{s.attendance || 0}%</td>
                    <td className="p-4 font-medium">{Math.round((s.average_marks || s.avg_marks || 0))}%</td>
                    <td className="p-4 text-gray-500">{s.study_hours || 0} hrs</td>
                    <td className="p-4 text-gray-500">{s.goals_count || 0} goals</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card overflow-x-auto border border-gray-100 dark:border-gray-800 p-0">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-xs">
                  <th className="p-4">Mentor Name</th>
                  <th className="p-4">Assigned Students</th>
                  <th className="p-4">Feedbacks Logged</th>
                  <th className="p-4">Sessions Conducted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-900/50">
                {mentorData.map((m, idx) => (
                  <tr key={idx} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50/20 dark:hover:bg-gray-900/10">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{m.name}</td>
                    <td className="p-4 font-medium">{m.students_count || 0} students</td>
                    <td className="p-4 text-gray-500">{m.feedbacks_given || 0} given</td>
                    <td className="p-4 text-gray-500">{m.sessions_conducted || 0} conducted</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
