import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, BookOpen, Clock, BarChart2, Star, CheckCircle,
  XCircle, Award, RotateCcw, ArrowRight, Brain, CheckCircle2
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

const SKILL_CATEGORIES = [
  { id: 'programming', name: 'Programming', difficulty: 'Medium', questionsCount: 5, desc: 'Assess logic, flow control, array methods, OOP concepts, and base algorithmic thinking.' },
  { id: 'webdev', name: 'Web Development', difficulty: 'Medium', questionsCount: 5, desc: 'HTML semantic layout, CSS flex/grid layout properties, state, lifecycle, React hooks, and APIs.' },
  { id: 'datascience', name: 'Data Science', difficulty: 'Hard', questionsCount: 5, desc: 'Basic stats, probability distributions, pandas operations, machine learning principles, and SQL.' },
  { id: 'devops', name: 'DevOps', difficulty: 'Hard', questionsCount: 5, desc: 'Docker virtualization container management, CI/CD integrations, shell scripts, and Linux basics.' },
  { id: 'softskills', name: 'Soft Skills', difficulty: 'Easy', questionsCount: 5, desc: 'Professional office communication, active customer listening, conflict negotiations, and teamwork.' },
  { id: 'math', name: 'Mathematics', difficulty: 'Hard', questionsCount: 5, desc: 'Matrix multiplication, basic calculus limits, linear equations, probability distributions, and logic.' }
];

const QUESTIONS_BANK = {
  programming: [
    { q: "What will `console.log(typeof [])` output in JavaScript?", options: ["'array'", "'object'", "'list'", "'undefined'"], answer: 1, exp: "In JavaScript, arrays are structural object types, so typeof returns 'object'." },
    { q: "What is the key principle of Object-Oriented Programming (OOP) that restricts direct access to objects' state?", options: ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"], answer: 2, exp: "Encapsulation wraps state data and behavior methods together, restricting public direct access." },
    { q: "Which data structure operates on a First-In-First-Out (FIFO) access basis?", options: ["Stack", "Queue", "Binary Tree", "Heap"], answer: 1, exp: "Queues process tasks on a FIFO basis, whereas Stacks use LIFO (Last-In-First-Out)." },
    { q: "What is the time complexity of looking up a value in a hash map in average cases?", options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"], answer: 0, exp: "Hash maps use hashing indexes to access elements in O(1) constant time on average." },
    { q: "Which sort algorithm uses divide-and-conquer and has worst-case complexity of O(N^2)?", options: ["Merge Sort", "Quick Sort", "Bubble Sort", "Insertion Sort"], answer: 1, exp: "Quick Sort uses divide-and-conquer. Its average is O(N log N) but worst-case is O(N^2) if pivot selection is poor." }
  ],
  webdev: [
    { q: "What is the correct HTML5 element for playing audio files?", options: ["<sound>", "<audio>", "<music>", "<play>"], answer: 1, exp: "The <audio> tag is standard HTML5 for embedding sound or audio streams." },
    { q: "Which CSS property governs flexbox item wrapping?", options: ["flex-wrap", "wrap-items", "display-wrap", "flex-direction"], answer: 0, exp: "flex-wrap determines whether flex items wrap onto multiple lines if container limits are reached." },
    { q: "What is the purpose of React `useCallback` Hook?", options: ["To execute HTTP fetch requests", "To cache the calculated return value of a pure function", "To memoize a callback function instance between renders", "To update the state variable directly"], answer: 2, exp: "useCallback caches function definitions to prevent unnecessary child rerenders when callbacks change." },
    { q: "What does SEO stand for?", options: ["System Engine Operation", "Search Engine Optimization", "Secure Entity Ownership", "Social Engagement Origin"], answer: 1, exp: "Search Engine Optimization (SEO) represents techniques to maximize website visibility in search engines." },
    { q: "Which HTTP header is commonly used to transfer bearer authorization tokens?", options: ["Content-Type", "Accept", "Authorization", "Access-Control-Allow-Origin"], answer: 2, exp: "The Authorization header (e.g. Authorization: Bearer <token>) is standard for sending authentication tokens." }
  ],
  datascience: [
    { q: "Which SQL clause is used to filter group rows after aggregations?", options: ["WHERE", "HAVING", "GROUP FILTER", "LIMIT"], answer: 1, exp: "HAVING filters aggregated group rows (used with GROUP BY), whereas WHERE filters records before aggregation." },
    { q: "In stats, what value is exactly in the middle of a sorted list of data?", options: ["Mean", "Median", "Mode", "Variance"], answer: 1, exp: "The median splits a sorted dataset into equal upper and lower halves." },
    { q: "What is the main objective of unsupervised machine learning clustering?", options: ["To predict continuous numerical values", "To classify records into pre-labeled classes", "To group unlabeled data based on structural similarity", "To train neural networks through human feedback"], answer: 2, exp: "Clustering groups unlabeled data points based on feature similarity without preset training labels." },
    { q: "What is overfitting in machine learning models?", options: ["When a model performs poorly on both training and test datasets", "When a model memorizes training noise and fails to generalize to unseen test data", "When a model runs too slowly on GPUs", "When a model has too few training parameters"], answer: 1, exp: "Overfitting occurs when a model is overly complex, capturing training noise and failing to generalize on test datasets." },
    { q: "What does the R-squared metric measure in linear regression models?", options: ["The training speed of the regression model", "The proportion of variance in the dependent variable explained by the features", "The count of outlier records in data", "The absolute error range of predictions"], answer: 1, exp: "R-squared (coefficient of determination) measures the proportion of variance explained by model input variables." }
  ],
  devops: [
    { q: "What is Docker?", options: ["A language compiler utility", "A lightweight OS virtualization container engine", "A security firewall manager", "An automated code generator tool"], answer: 1, exp: "Docker package applications and their dependencies into container instances for isolated running." },
    { q: "Which tool is commonly used to build CI/CD automation pipelines?", options: ["React", "PostgreSQL", "GitHub Actions", "Docker Desktop"], answer: 2, exp: "GitHub Actions, Jenkins, GitLab CI are standard automation tools for building build-test-deploy pipelines." },
    { q: "What does the command `chmod 755 filename` do in Linux?", options: ["Deletes filename", "Sets write permissions for everyone", "Gives read/write/execute to owner, read/execute to group and others", "Hides the file from standard directories"], answer: 2, exp: "755 translates to rwxr-xr-x: owner has all rights (7), group and others have read and execute (5)." },
    { q: "What is Infrastructure as Code (IaC)?", options: ["Writing code directly in server terminals", "Managing and provisioning server resources using machine-readable definition files", "Writing code without compiler validation", "Automating HTML markup generations"], answer: 1, exp: "IaC tools like Terraform, CloudFormation manage server infrastructures programmatically via version-controlled config files." },
    { q: "What is a reverse proxy?", options: ["A backup server that duplicates data files", "A service that forwards client requests to backend destination servers", "An encryption algorithm for local storage", "A software component that blocks outgoing internet access"], answer: 1, exp: "Reverse proxies (like Nginx) receive requests from clients and route them to internal backend service APIs." }
  ],
  softskills: [
    { q: "What is active listening?", options: ["Drafting an email while another person is speaking", "Paying complete attention, clarifying details, reflecting, and responding constructively", "Agreeing immediately without questioning anything", "Interrupting to express your opinion quickly"], answer: 1, exp: "Active listening involves processing what is said, confirming understanding, and reflecting before answering." },
    { q: "What is the best way to handle a professional conflict with a coworker?", options: ["Complain publicly to all other coworkers", "Speak with them privately to discuss the root issue calmly and identify solutions", "Refuse to work on tasks they are involved in", "Email senior leadership immediately without warning"], answer: 1, exp: "Resolving differences directly and privately shows teamwork capabilities, maturity, and respect." },
    { q: "Which skill is most critical for explaining complex technical architectures to non-technical stakeholders?", options: ["Coding proficiency", "Code refactoring speed", "Translation & communication simplification", "Database optimization theory"], answer: 2, exp: "Translating complex jargon into simple, business-value concepts is key to bridging communication gaps." },
    { q: "What does the STAR method stand for in behavioral interviews?", options: ["System, Task, Application, Review", "Situation, Task, Action, Result", "Salary, Time, Agreement, Retention", "Scope, Test, Analyze, Repeat"], answer: 1, exp: "STAR (Situation, Task, Action, Result) is the industry standard for structure-based behavioral answers." },
    { q: "What shows strong accountability in team roles?", options: ["Blaming external factors when deadlines are missed", "Admitting mistakes early and proactively working to solve them", "Working alone and refusing assistance", "Taking credit for other people's deliverables"], answer: 1, exp: "Accountability means taking responsibility for both successes and failures, admitting errors, and fixing them." }
  ],
  math: [
    { q: "What is the derivative of x^2 with respect to x?", options: ["x", "2x", "2", "x^3 / 3"], answer: 1, exp: "By the calculus power rule, d/dx (x^n) = n * x^(n-1), so d/dx (x^2) = 2x." },
    { q: "What is the value of 5! (factorial of 5)?", options: ["15", "60", "120", "240"], answer: 2, exp: "5! = 5 * 4 * 3 * 2 * 1 = 120." },
    { q: "If A and B are independent events, with P(A) = 0.5 and P(B) = 0.4, what is P(A and B)?", options: ["0.9", "0.1", "0.2", "0.5"], answer: 2, exp: "For independent events, P(A and B) = P(A) * P(B) = 0.5 * 0.4 = 0.2." },
    { q: "Which matrix dimensions can be multiplied with a 3x2 matrix?", options: ["A 3x2 matrix", "A 2x4 matrix", "A 4x2 matrix", "A 1x3 matrix"], answer: 1, exp: "To multiply matrix A (MxN) and B (OxP), N must equal O. A 3x2 matrix requires a 2xP matrix, so 2x4 is valid." },
    { q: "What is log base 2 of 32?", options: ["4", "5", "6", "16"], answer: 1, exp: "Since 2^5 = 32, log_2(32) = 5." }
  ]
};

export default function SkillAssessment() {
  const { showToast } = useToast();
  const [step, setStep] = useState('select'); // 'select' | 'quiz' | 'result'
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds per question
  const [assessmentScores, setAssessmentScores] = useState({});

  // Load scores on mount
  useEffect(() => {
    const scores = {};
    SKILL_CATEGORIES.forEach(cat => {
      const saved = localStorage.getItem(`skill_score_${cat.id}`);
      if (saved) {
        scores[cat.id] = parseInt(saved);
      } else {
        scores[cat.id] = 0; // Default
      }
    });
    setAssessmentScores(scores);
  }, []);

  // Timer logic
  useEffect(() => {
    if (step !== 'quiz') return;
    if (timeLeft <= 0) {
      handleNext(true); // Auto submit on timeout
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft, currentIdx]);

  const handleStart = (catId) => {
    setActiveCategory(catId);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setUserAnswers([]);
    setScore(0);
    setTimeLeft(90);
    setStep('quiz');
  };

  const handleOptionSelect = (idx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
  };

  const handleNext = (isTimeUp = false) => {
    const questions = QUESTIONS_BANK[activeCategory];
    const curQ = questions[currentIdx];
    const finalAns = isTimeUp ? -1 : selectedOpt;
    const isCorrect = finalAns === curQ.answer;

    const updatedAnswers = [...userAnswers, {
      question: curQ.q,
      options: curQ.options,
      correctAnswer: curQ.answer,
      selectedAnswer: finalAns,
      isCorrect,
      explanation: curQ.exp
    }];
    setUserAnswers(updatedAnswers);

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setTimeLeft(90);
    } else {
      // Completed assessment
      setStep('result');
      const finalPercentage = Math.round((newScore / questions.length) * 100);
      saveScore(activeCategory, finalPercentage);
      checkAchievements(newScore, questions.length);
    }
  };

  const saveScore = (catId, finalPct) => {
    const previous = assessmentScores[catId] || 0;
    // Store only if score is improved
    const highest = Math.max(previous, finalPct);
    localStorage.setItem(`skill_score_${catId}`, highest.toString());

    // Record history of progress
    const historyKey = `skill_history_${catId}`;
    const historyList = JSON.parse(localStorage.getItem(historyKey) || '[]');
    historyList.push({ date: new Date().toLocaleDateString(), score: finalPct });
    localStorage.setItem(historyKey, JSON.stringify(historyList.slice(-10))); // keep last 10

    setAssessmentScores(prev => ({ ...prev, [catId]: highest }));
  };

  const checkAchievements = async (finalScore, totalQ) => {
    const pct = (finalScore / totalQ) * 100;
    if (pct >= 90) {
      showToast(`Excellent! You scored ${pct}% in the assessment!`, 'success');
      try {
        const res = await authFetch('/api/achievements/check', {
          method: 'POST',
          body: JSON.stringify({ trigger: 'top_performer' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.unlocked && data.unlocked.length > 0) {
            data.unlocked.forEach(badge => {
              showToast(`🏆 Badge Unlocked: ${badge.title}!`, 'success');
            });
          }
        }
      } catch (err) {
        console.error("Achievement check failed", err);
      }
    } else if (pct >= 60) {
      showToast(`Well done! You scored ${pct}%!`, 'success');
    } else {
      showToast(`Assessment finished with score ${pct}%. Keep practicing!`, 'info');
    }
  };

  const getLevelBadge = (pct) => {
    if (pct >= 80) return { label: 'Expert', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' };
    if (pct >= 60) return { label: 'Advanced', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' };
    if (pct >= 40) return { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400' };
    return { label: 'Beginner', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  };

  // Convert scores for charts
  const chartData = SKILL_CATEGORIES.map(cat => ({
    subject: cat.name,
    score: assessmentScores[cat.id] || 0,
    fullMark: 100
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Brain className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skill Assessment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Validate your capabilities across core software domains</p>
          </div>
        </div>
      </div>

      {step === 'select' && (
        <div className="space-y-8">
          {/* Chart Section */}
          <div className="card grid md:grid-cols-2 gap-8 items-center border border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Capabilities Profile</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your highest assessed proficiency levels plotted across categories. Take assessments below to populate your profile graph.
              </p>
              <div className="space-y-3 pl-2">
                {SKILL_CATEGORIES.map(cat => {
                  const val = assessmentScores[cat.id] || 0;
                  const lvl = getLevelBadge(val);
                  return (
                    <div key={cat.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{val}%</span>
                        <span className={`badge text-xs px-2 py-0.5 ${lvl.color}`}>{lvl.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#718096', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#A0AEC0', fontSize: 10 }} />
                  <Radar name="My Skills" dataKey="score" stroke="#5A67D8" fill="#8B5CF6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {SKILL_CATEGORIES.map((cat) => {
              const currentScore = assessmentScores[cat.id] || 0;
              const lvl = getLevelBadge(currentScore);
              return (
                <div key={cat.id} className="card hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                      <span className={`badge ${
                        cat.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        cat.difficulty === 'Medium' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                        'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {cat.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cat.desc}</p>

                    {currentScore > 0 && (
                      <div className="flex items-center justify-between text-xs border-t border-gray-50 dark:border-gray-900 pt-3">
                        <span className="text-gray-400">Personal High:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{currentScore}%</span>
                          <span className={`badge py-0.5 px-2 ${lvl.color}`}>{lvl.label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleStart(cat.id)} 
                    className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                  >
                    {currentScore > 0 ? 'Retake Assessment' : 'Start Assessment'} <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 'quiz' && (
        <div className="space-y-6">
          {/* Progress & Timer */}
          <div className="card space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span>{SKILL_CATEGORIES.find(c => c.id === activeCategory)?.name} Quiz — {currentIdx + 1} of {QUESTIONS_BANK[activeCategory].length}</span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono">
                <Clock size={16} /> {timeLeft}s Left
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(currentIdx / QUESTIONS_BANK[activeCategory].length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Box */}
          <div className="card space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {QUESTIONS_BANK[activeCategory][currentIdx].q}
            </h2>

            <div className="grid gap-3">
              {QUESTIONS_BANK[activeCategory][currentIdx].options.map((option, optIdx) => {
                let borderStyle = 'border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30';
                let icon = null;

                if (selectedOpt !== null) {
                  if (optIdx === QUESTIONS_BANK[activeCategory][currentIdx].answer) {
                    borderStyle = 'border-emerald-500 bg-emerald-50/20 text-emerald-800 dark:text-emerald-400';
                    icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />;
                  } else if (selectedOpt === optIdx) {
                    borderStyle = 'border-red-500 bg-red-50/20 text-red-800 dark:text-red-400';
                    icon = <XCircle className="text-red-500 shrink-0" size={18} />;
                  } else {
                    borderStyle = 'border-gray-100 dark:border-gray-800 opacity-60';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionSelect(optIdx)}
                    disabled={selectedOpt !== null}
                    className={`flex items-center justify-between p-4 border rounded-xl text-left font-medium text-sm transition-all ${borderStyle}`}
                  >
                    <span>{option}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {selectedOpt !== null && (
              <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl space-y-2 animate-fade-in">
                <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Star size={14} /> Validation Explanation
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {QUESTIONS_BANK[activeCategory][currentIdx].exp}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => handleNext(false)}
                disabled={selectedOpt === null}
                className="btn-primary flex items-center gap-2"
              >
                {currentIdx + 1 === QUESTIONS_BANK[activeCategory].length ? 'Finish Assessment' : 'Next Question'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          {/* Overview */}
          {(() => {
            const finalPct = Math.round((score / QUESTIONS_BANK[activeCategory].length) * 100);
            const lvl = getLevelBadge(finalPct);
            return (
              <div className="card text-center p-8 space-y-6 border border-gray-100 dark:border-gray-800">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full mx-auto w-fit">
                  <Award className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment Finalized</h2>
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Proficiency Rating Achieved</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white flex justify-center items-center gap-2">
                    <span className={`badge px-4 py-1.5 text-lg ${lvl.color}`}>{lvl.label}</span>
                  </h3>
                </div>

                <div className="max-w-xs mx-auto border border-gray-100 dark:border-gray-900 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Your Score</p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {score} <span className="text-lg text-gray-400 font-medium">/ {QUESTIONS_BANK[activeCategory].length}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">({finalPct}% Score)</p>
                </div>

                <div className="flex justify-center gap-3">
                  <button onClick={() => handleStart(activeCategory)} className="btn-primary flex items-center gap-2">
                    <RotateCcw size={16} /> Retake Quiz
                  </button>
                  <button onClick={() => setStep('select')} className="btn-secondary">
                    View My Profiles
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Review answers */}
          <div className="card space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-gray-400" /> Assessment Feedback Review
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {userAnswers.map((ans, idx) => (
                <div key={idx} className={`py-6 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">
                      {idx + 1}. {ans.question}
                    </h4>
                    <span className={`badge shrink-0 ${ans.isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}>
                      {ans.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="grid gap-1.5 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Your Choice:</span>{' '}
                      {ans.selectedAnswer === -1 ? (
                        <span className="text-red-500 italic">No Answer / Timeout</span>
                      ) : (
                        ans.options[ans.selectedAnswer]
                      )}
                    </p>
                    {!ans.isCorrect && (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">Answer:</span> {ans.options[ans.correctAnswer]}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-700 dark:text-gray-300">Explanation:</span> {ans.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
