import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, KeyRound, Mail, User, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import BASE_URL from '../../api';

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
  const textColors = ['', 'text-red-500', 'text-yellow-500', 'text-blue-500', 'text-emerald-500'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !role) {
      showToast('Please fill out all fields.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        // If backend returns tokens on register, store them
        const accessToken = data.access_token || data.token || null;
        const refreshToken = data.refresh_token || null;

        if (data.user) {
          login(data.user, accessToken, refreshToken);
          showToast('Account created! Welcome to SmartMentor 🎉', 'success');
          navigate(`/${data.user.role}`);
        } else {
          showToast('Registration successful! Please log in.', 'success');
          navigate('/login');
        }
      } else {
        showToast(data.message || 'Registration failed. Try a different email.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Cannot reach server. Check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900 p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20 z-0" />
      <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-purple-300/20 rounded-full blur-3xl z-0" />

      {/* Logo */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center mb-8">
        <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
          <BookOpen className="text-white w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">SmartMentor</h1>
        <p className="text-gray-500 text-center text-sm">Empowering academic excellence</p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-md relative z-10 p-8 rounded-3xl border shadow-xl bg-white dark:bg-gray-800">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
          <p className="text-sm text-gray-500 mt-1">Join the SmartMentor ecosystem</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* NAME */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-12 h-12"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-12 h-12"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12 pr-12 h-12"
                placeholder="Create a strong password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${confirmPassword && password === confirmPassword ? 'text-emerald-500' : 'text-gray-400'}`} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input-field pl-12 pr-12 h-12 ${confirmPassword && password !== confirmPassword ? 'border-red-400 focus:ring-red-400/40' : ''}`}
                placeholder="Re-enter your password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          {/* ROLE — no Administrator */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'mentor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 px-4 rounded-xl font-semibold capitalize border-2 transition-all ${
                    role === r
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  {r === 'student' ? '🎓 Student' : '👨‍🏫 Mentor'}
                </button>
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-12 font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account →'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="absolute bottom-6 text-xs text-gray-400 z-10">🔒 Your data is secure with us</div>
    </div>
  );
}
