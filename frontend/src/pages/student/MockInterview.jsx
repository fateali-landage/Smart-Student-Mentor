import React, { useState, useEffect } from 'react';
import {
  Briefcase, MessageSquare, Code, Timer, AlertCircle, CheckCircle2,
  XCircle, Award, RotateCcw, ArrowRight, BookOpen, Clock, History
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { authFetch } from '../../api';

const QUESTIONS_BANK = {
  technical: [
    {
      q: "What is the primary purpose of React Virtual DOM?",
      options: [
        "To directly manipulate the browser HTML layout",
        "To synchronize a lightweight memory representation of the UI with the real DOM",
        "To enforce rigid CSS styles on components",
        "To automatically fetch REST API data"
      ],
      answer: 1,
      explanation: "The Virtual DOM is a programming concept where an ideal, or 'virtual', representation of a UI is kept in memory and synced with the 'real' DOM by a library such as ReactDOM (a process called reconciliation)."
    },
    {
      q: "Which of the following is true about JavaScript Closures?",
      options: [
        "Closures allow functions to execute asynchronously on separate CPU cores",
        "A closure is created every time a variable is declared globally",
        "A closure is the combination of a function bundled together with references to its surrounding state",
        "Closures force a function to automatically release its memory scope"
      ],
      answer: 2,
      explanation: "A closure gives you access to an outer function's scope from an inner function. In JavaScript, closures are created every time a function is created, at function creation time."
    },
    {
      q: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
      options: [
        "O(1)",
        "O(N)",
        "O(N log N)",
        "O(log N)"
      ],
      answer: 3,
      explanation: "For a balanced Binary Search Tree, the height is proportional to log N. In the worst case, searching takes time proportional to the height, which yields O(log N) operations."
    },
    {
      q: "Which HTTP status code represents a successful resource creation?",
      options: [
        "200 OK",
        "201 Created",
        "304 Not Modified",
        "400 Bad Request"
      ],
      answer: 1,
      explanation: "201 Created is the standard HTTP status code returned when a POST request successfully creates a new resource on the server."
    },
    {
      q: "What does the 'super' keyword do in a class constructor?",
      options: [
        "It stops the execution of the parent constructor",
        "It initializes a local private constructor",
        "It calls the constructor of the parent class",
        "It compiles the class into clean machine code"
      ],
      answer: 2,
      explanation: "The super keyword is used to call the constructor of the parent class and access the parent class's properties and methods."
    }
  ],
  hr: [
    {
      q: "How should you structure your response to behavioral interview questions?",
      options: [
        "Speak about your salary requirements and standard working conditions",
        "Use the STAR method: Situation, Task, Action, Result",
        "Keep details vague so the interviewer doesn't ask follow-up questions",
        "Blame your team members for any project failures that occurred"
      ],
      answer: 1,
      explanation: "The STAR method (Situation, Task, Action, Result) is a structured manner of responding to a behavioral-based interview question by discussing the specific situation, task, action, and result of the situation."
    },
    {
      q: "An interviewer asks: 'Tell me about a time you failed.' What is the best approach?",
      options: [
        "State that you have never failed and have a perfect track record",
        "Tell a story about a failure caused entirely by someone else's mistake",
        "Describe a genuine failure, explain what you learned, and show how you improved since then",
        "Explain a failure and mention that you decided to give up on that area completely"
      ],
      answer: 2,
      explanation: "Interviewers look for self-awareness, accountability, and resilience. Admitting a mistake and highlighting what you learned from it shows maturity and growth."
    },
    {
      q: "What is the best way to answer the question: 'What is your greatest weakness?'",
      options: [
        "Mention a cliché 'fake' weakness like 'I work too hard' or 'I am a perfectionist'",
        "List a series of critical technical skills that you lack for the current job role",
        "Discuss a real, non-critical weakness that you are actively working to improve",
        "State that you do not have any weaknesses worth mentioning"
      ],
      answer: 2,
      explanation: "The best approach is to share a real weakness that is not essential for the job, followed by the specific steps you are taking to overcome or improve upon it."
    },
    {
      q: "If you have a conflict with a team member during a project, what should you do first?",
      options: [
        "Immediately report them to senior management or HR",
        "Speak with them privately to discuss the issue calmly and seek a compromise",
        "Stop talking to them and complete all the work by yourself",
        "Post about the conflict on social media to get public feedback"
      ],
      answer: 1,
      explanation: "Resolving conflicts privately and professionally is a key interpersonal skill. It shows leadership and emotional intelligence to address issues constructively before escalating them."
    },
    {
      q: "Why do employers ask: 'Where do you see yourself in 5 years?'",
      options: [
        "To check if you plan to retire early",
        "To test if you have memorized their company timeline",
        "To understand your career alignment, growth aspirations, and longevity with the company",
        "To confirm you will never ask for a salary increment"
      ],
      answer: 2,
      explanation: "Employers ask this to see if you have realistic career goals, ambition, and if the position fits into your long-term plans, indicating you are likely to stay with the company."
    }
  ],
  communication: [
    {
      q: "Which word best completes the sentence: 'The team's presentation was ____ and clear.'",
      options: [
        "verbose",
        "concise",
        "ambiguous",
        "redundant"
      ],
      answer: 1,
      explanation: "'Concise' means giving a lot of information clearly and in a few words; brief but comprehensive. This matches 'clear' perfectly."
    },
    {
      q: "What is the most professional email greeting for a recruiter you haven't met before?",
      options: [
        "Hey there recruiter,",
        "Dear hiring manager,",
        "Dear [Name] / Hiring Team,",
        "Yo, what's up!"
      ],
      answer: 2,
      explanation: "Using 'Dear [Name] / Hiring Team' strikes the perfect balance of professional respect and accuracy when reaching out to business contacts."
    },
    {
      q: "In professional verbal communication, what does 'active listening' involve?",
      options: [
        "Formulating your next argument while the other person is still speaking",
        "Interrupting regularly to show you are highly engaged",
        "Paying full attention, clarifying understanding, reflecting, and responding thoughtfully",
        "Nodding quickly without processing what is being spoken"
      ],
      answer: 2,
      explanation: "Active listening requires fully concentrating, understanding, responding, and then remembering what is being said. It builds trust and clarity."
    },
    {
      q: "Which phrase is best suited to disagree professionally in a group meeting?",
      options: [
        "That idea is completely wrong and won't work",
        "I understand your perspective, but I have a different viewpoint because...",
        "I guess you don't know what you are talking about",
        "Let's vote to throw that proposal out immediately"
      ],
      answer: 1,
      explanation: "Expressing disagreement with empathy and reasoning ('I understand your perspective, but...') fosters collaborative discussion without creating defensiveness."
    },
    {
      q: "What is the primary objective of a 'follow-up email' after an interview?",
      options: [
        "To demand a final hiring decision immediately",
        "To ask if they liked your resume styling",
        "To express appreciation, reiterate interest, and briefly highlight key qualifications",
        "To list additional salary demands you forgot to mention"
      ],
      answer: 2,
      explanation: "A follow-up email should thank the interviewer for their time, reinforce your enthusiasm for the position, and keep you top-of-mind."
    }
  ]
};

export default function MockInterview() {
  const { showToast } = useToast();
  const [mode, setMode] = useState(null); // 'technical' | 'hr' | 'communication' | null
  const [step, setStep] = useState('select'); // 'select' | 'quiz' | 'result'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes (120s) per question
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem('interview_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (step !== 'quiz') return;
    if (timeLeft <= 0) {
      handleNextQuestion(true); // Auto-submit when time runs out
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft, currentIdx]);

  const handleStart = (selectedMode) => {
    setMode(selectedMode);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setUserAnswers([]);
    setScore(0);
    setTimeLeft(120);
    setStep('quiz');
  };

  const handleOptionSelect = (optIdx) => {
    if (selectedOpt !== null) return; // Answer already locked in
    setSelectedOpt(optIdx);
  };

  const handleNextQuestion = (isTimeUp = false) => {
    const questions = QUESTIONS_BANK[mode];
    const currentQ = questions[currentIdx];
    const finalAns = isTimeUp ? -1 : selectedOpt;
    const isCorrect = finalAns === currentQ.answer;

    const updatedAnswers = [...userAnswers, {
      question: currentQ.q,
      options: currentQ.options,
      correctAnswer: currentQ.answer,
      selectedAnswer: finalAns,
      isCorrect,
      explanation: currentQ.explanation
    }];
    setUserAnswers(updatedAnswers);

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setTimeLeft(120);
    } else {
      // Completed last question
      setStep('result');
      saveToHistory(mode, newScore, questions.length);
      checkAchievements(newScore, questions.length);
    }
  };

  const saveToHistory = (modeName, finalScore, totalQ) => {
    const percentage = Math.round((finalScore / totalQ) * 100);
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      mode: modeName.toUpperCase(),
      score: `${finalScore}/${totalQ}`,
      percentage
    };
    const updatedHistory = [newEntry, ...history].slice(0, 5); // Keep last 5
    setHistory(updatedHistory);
    localStorage.setItem('interview_history', JSON.stringify(updatedHistory));
  };

  const checkAchievements = async (finalScore, totalQ) => {
    const pct = (finalScore / totalQ) * 100;
    if (pct >= 80) {
      showToast(`Excellent! You scored ${pct}% in the mock interview!`, 'success');
      try {
        const res = await authFetch('/api/achievements/check', {
          method: 'POST',
          body: JSON.stringify({ trigger: 'interview_ready' })
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
    } else if (pct >= 50) {
      showToast(`Good job! You scored ${pct}%! Keep practicing.`, 'info');
    } else {
      showToast(`You scored ${pct}%. Keep revising the concept details!`, 'warning');
    }
  };

  const getGradeInfo = (scored, total) => {
    const pct = (scored / total) * 100;
    if (pct >= 80) return { title: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
    if (pct >= 60) return { title: 'Good', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' };
    if (pct >= 40) return { title: 'Average', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/20' };
    return { title: 'Needs Improvement', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Briefcase className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mock Interview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Assess your placement readiness and practice questions</p>
          </div>
        </div>
      </div>

      {step === 'select' && (
        <div className="space-y-8">
          {/* Mode selections */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 w-fit mb-4">
                  <Code size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Technical Interview</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Test your engineering knowledge on React, JavaScript, system architectures, and data structures.
                </p>
              </div>
              <button onClick={() => handleStart('technical')} className="btn-primary w-full flex items-center justify-center gap-2">
                Start Technical <ArrowRight size={16} />
              </button>
            </div>

            <div className="card hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400 w-fit mb-4">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">HR & Behavioral</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Master STAR answers, conflict resolution, strengths/weaknesses discussions, and team scenarios.
                </p>
              </div>
              <button onClick={() => handleStart('hr')} className="btn-primary w-full flex items-center justify-center gap-2">
                Start HR Session <ArrowRight size={16} />
              </button>
            </div>

            <div className="card hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl text-cyan-600 dark:text-cyan-400 w-fit mb-4">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Communication</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Refine your professional vocabulary, email drafting etiquettes, and active listing cues.
                </p>
              </div>
              <button onClick={() => handleStart('communication')} className="btn-primary w-full flex items-center justify-center gap-2">
                Start Communication <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* History */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History size={18} className="text-gray-400" /> Recent Session History
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No interview sessions attempted yet. Choose a mode above to begin.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold uppercase text-xs">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Mode</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Percentage</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => {
                      const passed = h.percentage >= 80;
                      return (
                        <tr key={h.id} className="border-b border-gray-50 dark:border-gray-900/50 text-gray-700 dark:text-gray-300">
                          <td className="py-3">{h.date}</td>
                          <td className="py-3 font-semibold">{h.mode}</td>
                          <td className="py-3">{h.score}</td>
                          <td className="py-3">{h.percentage}%</td>
                          <td className="py-3">
                            <span className={`badge ${passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                              {passed ? 'Cleared' : 'Completed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'quiz' && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="card space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className="capitalize">{mode} Mode — Question {currentIdx + 1} of {QUESTIONS_BANK[mode].length}</span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono">
                <Timer size={16} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentIdx) / QUESTIONS_BANK[mode].length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="card space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {QUESTIONS_BANK[mode][currentIdx].q}
            </h2>

            <div className="grid gap-3">
              {QUESTIONS_BANK[mode][currentIdx].options.map((option, optIdx) => {
                let borderStyle = 'border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/30';
                let icon = null;

                if (selectedOpt !== null) {
                  if (optIdx === QUESTIONS_BANK[mode][currentIdx].answer) {
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
                  <AlertCircle size={14} /> Concept Detail / Explanation
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {QUESTIONS_BANK[mode][currentIdx].explanation}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => handleNextQuestion(false)}
                disabled={selectedOpt === null}
                className="btn-primary flex items-center gap-2"
              >
                {currentIdx + 1 === QUESTIONS_BANK[mode].length ? 'Finish Interview' : 'Next Question'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          {/* Result card */}
          {(() => {
            const grade = getGradeInfo(score, QUESTIONS_BANK[mode].length);
            return (
              <div className="card text-center p-8 space-y-6 border border-gray-100 dark:border-gray-800">
                <div className={`p-4 rounded-full mx-auto w-fit ${grade.bg}`}>
                  <Award className={`w-16 h-16 ${grade.color}`} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Complete!</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    {mode} Interview Grade
                  </p>
                  <h3 className={`text-3xl font-extrabold ${grade.color}`}>{grade.title}</h3>
                </div>

                <div className="max-w-xs mx-auto border border-gray-100 dark:border-gray-900 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Your Score</p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {score} <span className="text-lg text-gray-400 font-medium">/ {QUESTIONS_BANK[mode].length}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">({Math.round((score / QUESTIONS_BANK[mode].length) * 100)}% Accuracy)</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => handleStart(mode)} className="btn-primary flex items-center gap-2">
                    <RotateCcw size={16} /> Retake Interview
                  </button>
                  <button onClick={() => setStep('select')} className="btn-secondary">
                    Try Different Mode
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Question Review */}
          <div className="card space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-gray-400" /> Answer Key & Review
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
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

                  <div className="grid gap-2 text-sm pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Your Answer:</span>{' '}
                      {ans.selectedAnswer === -1 ? (
                        <span className="text-red-500 italic">Time Expired / No Answer</span>
                      ) : (
                        ans.options[ans.selectedAnswer]
                      )}
                    </p>
                    {!ans.isCorrect && (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        <span className="font-semibold">Correct Answer:</span> {ans.options[ans.correctAnswer]}
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
