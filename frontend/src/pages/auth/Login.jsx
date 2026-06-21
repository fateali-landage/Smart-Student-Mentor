import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, KeyRound, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import BASE_URL from '../../api';

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(`/${user.role}`);
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Please enter your email and password.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        // Support both token formats
        const accessToken = data.access_token || data.token || null;
        const refreshToken = data.refresh_token || null;

        login(data.user, accessToken, refreshToken);

        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        showToast(`Welcome back, ${data.user?.name || 'User'}! 👋`, 'success');
        navigate(`/${data.user?.role || 'student'}`);
      } else {
        showToast(data.message || 'Invalid email or password. Please try again.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Cannot reach server. Check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill remembered email
  useEffect(() => {
    const saved = localStorage.getItem('remembered_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
                autoComplete="email"
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
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 font-semibold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-12 font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>

      <div className="absolute bottom-6 text-xs text-gray-400 z-10">🔒 Secured with JWT Authentication</div>
    </div>
  );
}