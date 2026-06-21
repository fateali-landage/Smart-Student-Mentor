import React, { useState, useEffect } from 'react';
import {
  Map, Code2, Globe, Shield, BarChart2, Palette,
  CheckCircle2, Circle, ChevronRight, Award,
  ArrowRight, BookOpen, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PATHS = [
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    icon: <Code2 size={28} />,
    gradient: 'from-indigo-500 to-purple-600',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    description: 'Build complete web apps from frontend to backend. Master React, Node.js, databases, and cloud deployment.',
    tags: ['React', 'Node.js', 'Databases', 'DevOps'],
    milestones: [
      { title: 'Web Fundamentals', desc: 'HTML5, CSS3, Flexbox, Grid, Responsive Design', skills: ['HTML', 'CSS', 'Responsive Design'] },
      { title: 'JavaScript Mastery', desc: 'ES6+, async/await, DOM manipulation, APIs', skills: ['JavaScript', 'ES6+', 'REST APIs'] },
      { title: 'React & Modern Frontend', desc: 'Components, hooks, state management, React Router', skills: ['React', 'Redux', 'React Router'] },
      { title: 'Backend with Node.js', desc: 'Express.js, REST APIs, middleware, authentication', skills: ['Node.js', 'Express', 'JWT'] },
      { title: 'Databases', desc: 'SQL (PostgreSQL), NoSQL (MongoDB), ORM tools', skills: ['PostgreSQL', 'MongoDB', 'Prisma'] },
      { title: 'Version Control & Tools', desc: 'Git, GitHub, CI/CD pipelines, Docker basics', skills: ['Git', 'GitHub', 'Docker'] },
      { title: 'Cloud & Deployment', desc: 'AWS/GCP basics, Vercel, Heroku, Nginx', skills: ['AWS', 'Vercel', 'Linux'] },
      { title: 'Portfolio Project', desc: 'Build and deploy a full-stack application end-to-end', skills: ['System Design', 'Documentation'] },
    ],
    resources: [
      { title: 'The Odin Project', url: 'https://www.theodinproject.com' },
      { title: 'Full Stack Open', url: 'https://fullstackopen.com' },
      { title: 'CS50 Web', url: 'https://cs50.harvard.edu/web' },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    icon: <Globe size={28} />,
    gradient: 'from-pink-500 to-rose-600',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/30',
    description: 'Craft pixel-perfect, interactive user interfaces. Specialize in React, animations, and UX best practices.',
    tags: ['HTML/CSS', 'JavaScript', 'React', 'UX'],
    milestones: [
      { title: 'HTML & CSS Mastery', desc: 'Semantic HTML, advanced CSS, animations', skills: ['HTML5', 'CSS3', 'SASS'] },
      { title: 'JavaScript Deep Dive', desc: 'Core JS concepts, data structures, algorithms', skills: ['JavaScript', 'TypeScript'] },
      { title: 'React Ecosystem', desc: 'Hooks, context, performance optimization', skills: ['React', 'Next.js', 'Vite'] },
      { title: 'UI Frameworks', desc: 'Tailwind CSS, Material UI, component libraries', skills: ['TailwindCSS', 'Material UI'] },
      { title: 'Animations & Interactions', desc: 'Framer Motion, GSAP, CSS transitions', skills: ['Framer Motion', 'GSAP'] },
      { title: 'Testing & Accessibility', desc: 'Jest, React Testing Library, WCAG standards', skills: ['Jest', 'Accessibility'] },
      { title: 'Performance & Optimization', desc: 'Core Web Vitals, lazy loading, caching', skills: ['Web Performance', 'SEO'] },
      { title: 'Portfolio & Showcase', desc: 'Build an impressive frontend portfolio', skills: ['Portfolio', 'Design'] },
    ],
    resources: [
      { title: 'Frontend Masters', url: 'https://frontendmasters.com' },
      { title: 'CSS Tricks', url: 'https://css-tricks.com' },
      { title: 'JavaScript.info', url: 'https://javascript.info' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    icon: <Code2 size={28} />,
    gradient: 'from-emerald-500 to-teal-600',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    description: 'Build scalable server-side systems. Master APIs, databases, system design, and cloud infrastructure.',
    tags: ['Python/Node', 'APIs', 'Databases', 'System Design'],
    milestones: [
      { title: 'Backend Language', desc: 'Python (Django/FastAPI) or Node.js (Express)', skills: ['Python', 'Flask', 'FastAPI'] },
      { title: 'REST & GraphQL APIs', desc: 'Design and build robust APIs, versioning', skills: ['REST', 'GraphQL', 'OpenAPI'] },
      { title: 'Database Design', desc: 'Normalization, indexing, query optimization', skills: ['PostgreSQL', 'MySQL', 'Redis'] },
      { title: 'Authentication & Security', desc: 'JWT, OAuth, HTTPS, SQL injection prevention', skills: ['JWT', 'OAuth', 'Security'] },
      { title: 'Message Queues', desc: 'RabbitMQ, Kafka, async task processing', skills: ['Celery', 'Redis Queue'] },
      { title: 'System Design', desc: 'Scalability, load balancing, caching strategies', skills: ['Microservices', 'Load Balancing'] },
      { title: 'DevOps Basics', desc: 'Docker, CI/CD, monitoring, logging', skills: ['Docker', 'GitHub Actions', 'Prometheus'] },
      { title: 'Capstone API Project', desc: 'Build a production-grade backend service', skills: ['Architecture', 'Documentation'] },
    ],
    resources: [
      { title: 'Django Documentation', url: 'https://docs.djangoproject.com' },
      { title: 'Node Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices' },
      { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
    ],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    icon: <Shield size={28} />,
    gradient: 'from-red-500 to-orange-600',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/30',
    description: 'Protect digital assets and systems. Learn ethical hacking, SIEM tools, threat analysis, and cloud security.',
    tags: ['Networking', 'Ethical Hacking', 'SIEM', 'Cloud Security'],
    milestones: [
      { title: 'Networking Fundamentals', desc: 'TCP/IP, DNS, HTTP, firewalls, VPNs', skills: ['TCP/IP', 'DNS', 'Wireshark'] },
      { title: 'Linux & Command Line', desc: 'Linux administration, bash scripting, permissions', skills: ['Linux', 'Bash', 'CLI'] },
      { title: 'Security Concepts', desc: 'CIA triad, threat modeling, vulnerability assessment', skills: ['Risk Assessment', 'CVE'] },
      { title: 'Ethical Hacking', desc: 'Penetration testing, Metasploit, Burp Suite', skills: ['Kali Linux', 'Metasploit', 'Burp Suite'] },
      { title: 'SIEM & Monitoring', desc: 'Splunk, ELK stack, incident response', skills: ['Splunk', 'ELK', 'SIEM'] },
      { title: 'Web Application Security', desc: 'OWASP Top 10, XSS, CSRF, SQL injection', skills: ['OWASP', 'Web Pentesting'] },
      { title: 'Cloud Security', desc: 'AWS/Azure security, IAM, zero-trust', skills: ['AWS Security', 'IAM', 'Zero Trust'] },
      { title: 'Certification Prep', desc: 'CompTIA Security+, CEH study path', skills: ['Security+', 'CEH'] },
    ],
    resources: [
      { title: 'TryHackMe', url: 'https://tryhackme.com' },
      { title: 'Hack The Box', url: 'https://hackthebox.com' },
      { title: 'OWASP', url: 'https://owasp.org' },
    ],
  },
  {
    id: 'dataanalyst',
    title: 'Data Analyst',
    icon: <BarChart2 size={28} />,
    gradient: 'from-blue-500 to-cyan-600',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    description: 'Turn raw data into actionable insights. Master Python, SQL, visualization, and machine learning basics.',
    tags: ['Python', 'SQL', 'Data Visualization', 'ML basics'],
    milestones: [
      { title: 'Python for Data', desc: 'NumPy, Pandas, data manipulation', skills: ['Python', 'Pandas', 'NumPy'] },
      { title: 'SQL & Databases', desc: 'Advanced queries, joins, window functions', skills: ['SQL', 'PostgreSQL', 'BigQuery'] },
      { title: 'Data Visualization', desc: 'Matplotlib, Seaborn, Plotly, Tableau', skills: ['Matplotlib', 'Tableau', 'Power BI'] },
      { title: 'Statistics', desc: 'Descriptive stats, hypothesis testing, distributions', skills: ['Statistics', 'Probability'] },
      { title: 'Exploratory Data Analysis', desc: 'Data cleaning, feature engineering, EDA', skills: ['EDA', 'Data Cleaning'] },
      { title: 'ML Basics', desc: 'Scikit-learn, regression, classification, clustering', skills: ['Scikit-learn', 'ML Models'] },
      { title: 'Business Intelligence', desc: 'Dashboards, KPIs, storytelling with data', skills: ['BI Tools', 'Data Storytelling'] },
      { title: 'Capstone Analysis Project', desc: 'Analyze a real-world dataset and present insights', skills: ['Presentation', 'Reporting'] },
    ],
    resources: [
      { title: 'Kaggle', url: 'https://kaggle.com' },
      { title: 'Mode Analytics SQL', url: 'https://mode.com/sql-tutorial' },
      { title: 'Data School', url: 'https://www.dataschool.io' },
    ],
  },
  {
    id: 'uiux',
    title: 'UI/UX Designer',
    icon: <Palette size={28} />,
    gradient: 'from-violet-500 to-purple-600',
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    description: 'Create beautiful, user-centered digital experiences. Master Figma, design thinking, and usability principles.',
    tags: ['Design Thinking', 'Figma', 'Prototyping', 'User Research'],
    milestones: [
      { title: 'Design Fundamentals', desc: 'Typography, color theory, visual hierarchy, grids', skills: ['Typography', 'Color Theory', 'Layout'] },
      { title: 'UX Principles', desc: 'User research, personas, journey maps, empathy', skills: ['User Research', 'Personas', 'Empathy'] },
      { title: 'Figma Mastery', desc: 'Components, auto-layout, design systems, prototypes', skills: ['Figma', 'Design Systems'] },
      { title: 'Wireframing & Prototyping', desc: 'Lo-fi and hi-fi wireframes, clickable prototypes', skills: ['Wireframing', 'Prototyping'] },
      { title: 'Usability Testing', desc: 'User interviews, A/B testing, heuristic evaluation', skills: ['Usability Testing', 'A/B Testing'] },
      { title: 'Interaction Design', desc: 'Micro-animations, motion design, transitions', skills: ['Interaction Design', 'Animation'] },
      { title: 'Design Systems', desc: 'Build reusable component libraries and style guides', skills: ['Design Tokens', 'Storybook'] },
      { title: 'Portfolio & Case Studies', desc: 'Document your design process with compelling case studies', skills: ['Case Studies', 'Presentation'] },
    ],
    resources: [
      { title: 'Nielsen Norman Group', url: 'https://nngroup.com' },
      { title: 'Figma Community', url: 'https://figma.com/community' },
      { title: 'Laws of UX', url: 'https://lawsofux.com' },
    ],
  },
];

export default function CareerRoadmap() {
  const { user } = useAuth();
  const storageKey = `roadmap_progress_${user?.id || 'guest'}`;
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(progress)); }, [progress, storageKey]);

  const toggleMilestone = (pathId, idx) => {
    const key = `${pathId}_${idx}`;
    setProgress(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPathProgress = (pathId, milestones) => {
    const completed = milestones.filter((_, i) => progress[`${pathId}_${i}`]).length;
    return { completed, total: milestones.length, pct: Math.round((completed / milestones.length) * 100) };
  };

  if (selected) {
    const path = PATHS.find(p => p.id === selected);
    const prog = getPathProgress(path.id, path.milestones);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <ChevronRight size={16} className="rotate-180" /> Back to Career Paths
        </button>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${path.gradient} p-6 text-white shadow-lg`}>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">{path.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{path.title}</h1>
              <p className="text-white/80 text-sm mt-1">{path.description}</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/80">{prog.completed} / {prog.total} milestones completed</span>
              <span className="font-bold text-xl">{prog.pct}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div className="h-3 bg-white rounded-full transition-all duration-700" style={{ width: `${prog.pct}%` }} />
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-4">
            {path.milestones.map((m, i) => {
              const done = !!progress[`${path.id}_${i}`];
              return (
                <div key={i} className="relative flex gap-4">
                  <button onClick={() => toggleMilestone(path.id, i)} className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 hover:border-indigo-400'}`}>
                    {done ? <CheckCircle2 size={20} /> : <span>{i + 1}</span>}
                  </button>
                  <div className={`card flex-1 ${done ? 'opacity-75' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-gray-900 dark:text-white ${done ? 'line-through opacity-60' : ''}`}>{m.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {m.skills.map(s => <span key={s} className={`badge ${path.bg} ${path.color}`}>{s}</span>)}
                        </div>
                      </div>
                      {done && <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex-shrink-0">✓ Done</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><BookOpen size={18} className={path.color} /> Recommended Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {path.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                <ExternalLink size={16} className="text-gray-400 group-hover:text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Map size={26} className="text-indigo-500" /> Career Roadmap
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a career path and track your learning journey milestone by milestone</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {PATHS.map(path => {
          const prog = getPathProgress(path.id, path.milestones);
          const isStarted = prog.completed > 0;
          return (
            <div key={path.id} className="card group hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer" onClick={() => setSelected(path.id)}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${path.gradient} text-white flex items-center justify-center shadow-lg`}>{path.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{path.title}</h3>
                  <p className="text-xs text-gray-500">{path.milestones.length} milestones</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{path.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {path.tags.map(t => <span key={t} className={`badge ${path.bg} ${path.color}`}>{t}</span>)}
              </div>
              {isStarted && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{prog.completed}/{prog.total} done</span><span className="font-semibold">{prog.pct}%</span></div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${path.gradient} transition-all duration-500`} style={{ width: `${prog.pct}%` }} />
                  </div>
                </div>
              )}
              <button className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r ${path.gradient} text-white hover:opacity-90 transition-all shadow-md`}>
                {isStarted ? 'Continue Path' : 'Select This Path'} <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
