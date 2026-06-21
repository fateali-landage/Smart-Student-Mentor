import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, KeyRound, Mail, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
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
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter new password
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleEmailStep = (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your registered email address.', 'warning');
      return;
    }
    // Move to step 2 — actual reset happens on step 2
    setStep(2);
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast('Please fill in both password fields.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setDone(true);
        showToast('Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        showToast(data.message || 'Reset failed. Please check your email and try again.', 'error');
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
        <p className="text-gray-500 text-center text-sm">Account Recovery</p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-md relative z-10 p-8 rounded-3xl border shadow-xl bg-white dark:bg-gray-800">
        {/* Step Indicators */}
        <div className="flex items-center gap-2 mb-7">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Reset!</h2>
            <p className="text-sm text-gray-500">Redirecting you to login...</p>
          </div>
        ) : step === 1 ? (
          <>
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your email to continue</p>
            </div>

            <form onSubmit={handleEmailStep} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Account Email</label>
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

              <button type="submit" className="btn-primary w-full h-12 font-semibold flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h2>
              <p className="text-sm text-gray-500 mt-1">Create a strong password for <span className="text-indigo-600 font-semibold">{email}</span></p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-12 pr-12 h-12"
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-field pl-12 pr-12 h-12 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-400' : ''}`}
                    placeholder="Re-enter new password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="btn-secondary flex-1 h-12 font-semibold">
                  ← Back
                </button>
                <button type="submit" disabled={isLoading}
                  className="btn-primary flex-1 h-12 font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</> : 'Reset Password →'}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Back to Login</Link>
        </p>
      </div>

      <div className="absolute bottom-6 text-xs text-gray-400 z-10">🔒 Secured System</div>
    </div>
  );
}
