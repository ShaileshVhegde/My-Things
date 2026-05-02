import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import HomeTrackLogo from '../components/HomeTrackLogo';

const API = 'http://localhost:5000/api/auth';

const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

// ─── Forgot Password modal ────────────────────────────────────────────────────
// Steps: 'email' → 'otp' → 'reset' → done (navigates to dashboard)

function ForgotPasswordModal({ onClose }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [step, setStep]           = useState('email');   // 'email' | 'otp' | 'reset'
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState('');

  // Step 1 — request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/forgot-password`, { email: email.trim() });
      setSuccess('');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/verify-reset-otp`, { email: email.trim(), otp: otp.trim() });
      setResetToken(res.data.resetToken);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3a — reset password then go to dashboard
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/reset-password`, { resetToken, newPassword });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3b — skip password reset, just log in via a quick /me check won't work
  // We need the user to go back to login; OR we can store a "verified email" flag
  // and log them in directly using the resetToken to fetch their identity.
  const handleSkip = async () => {
    // Use the resetToken to exchange for a full auth token via reset-password
    // with a no-op; simpler: just close modal and let them log in normally.
    // But better UX: we can call reset-password with their CURRENT password — we don't
    // know it. So the cleanest skip is: close + show a success toast.
    onClose();
    navigate('/login');
  };

  const stepLabel = { email: '1 of 3', otp: '2 of 3', reset: '3 of 3' }[step];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-sm bg-bgSurface border border-borderBase rounded-2xl shadow-2xl p-6 z-10"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-bold text-textPrimary text-lg">Forgot Password</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-bgElevated transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-textMuted mb-5">{stepLabel}</p>

        {/* Progress bar */}
        <div className="w-full h-1 bg-borderBase rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: step === 'email' ? '33%' : step === 'otp' ? '66%' : '100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <motion.form
              key="email-step"
              onSubmit={handleRequestOtp}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div>
                <p className="text-sm text-textSecondary mb-4">
                  Enter the email address linked to your account and we'll send a reset code.
                </p>
                <label className="block text-sm font-medium text-textSecondary mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bgElevated border border-borderBase rounded-xl pl-9 pr-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex justify-center items-center text-sm"
              >
                {loading ? <span className="animate-pulse">Sending code…</span> : 'Send Reset Code'}
              </button>
            </motion.form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <motion.form
              key="otp-step"
              onSubmit={handleVerifyOtp}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-sm text-textSecondary">
                We sent a 6-digit code to <strong className="text-textPrimary">{email}</strong>.
              </p>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1.5">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary text-center tracking-[0.6em] font-mono text-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex justify-center items-center text-sm"
              >
                {loading ? <span className="animate-pulse">Verifying…</span> : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full text-textSecondary text-sm hover:text-textPrimary transition-colors"
              >
                ← Change email
              </button>
            </motion.form>
          )}

          {/* ── Step 3: Set new password ── */}
          {step === 'reset' && (
            <motion.div
              key="reset-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Success indicator */}
              <div className="flex items-center gap-2 mb-4 text-success">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Identity verified!</span>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1.5">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      autoFocus
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-bgElevated border border-borderBase rounded-xl pl-9 pr-10 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-bgElevated border border-borderBase rounded-xl pl-9 pr-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex justify-center items-center text-sm"
                >
                  {loading ? <span className="animate-pulse">Updating…</span> : 'Update Password & Sign In'}
                </button>
              </form>

              {/* Skip option */}
              <button
                type="button"
                onClick={handleSkip}
                className="w-full mt-3 text-textMuted text-sm hover:text-textSecondary transition-colors py-2"
              >
                Skip for now — I'll update it later
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.post(`${API}/google`, { access_token: codeResponse.access_token });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'Google login failed');
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/login`, formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="min-h-screen bg-bgBase flex flex-col pb-8"
        variants={slideInLeft}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-bgElevated transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2 font-display font-bold text-lg text-textPrimary">
            <HomeTrackLogo size={36} animated={false} />
            <span>My Things</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-md bg-bgSurface p-6 sm:p-8 rounded-2xl border border-borderBase shadow-xl">
            <h2 className="text-2xl font-display font-bold text-textPrimary mb-2">Welcome Back</h2>
            <p className="text-textSecondary mb-8 text-sm">Sign in to your account</p>

            <div className="space-y-3 mb-6">
              <button onClick={() => loginWithGoogle()} className="w-full flex items-center justify-center gap-3 bg-bgElevated border border-borderBase hover:bg-borderBase text-textPrimary py-3 rounded-xl font-semibold transition-colors">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>
              <button disabled className="w-full flex items-center justify-center gap-3 bg-bgElevated border border-borderBase opacity-70 cursor-not-allowed text-textPrimary py-3 rounded-xl font-semibold transition-colors">
                <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
                Facebook (Coming soon)
              </button>
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-borderBase" />
              <span className="flex-shrink-0 mx-4 text-textMuted text-sm">or</span>
              <div className="flex-grow border-t border-borderBase" />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-sm font-medium">{error}</div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-textSecondary">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-primary text-xs font-semibold hover:text-primaryHover transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primaryHover text-white py-3.5 rounded-xl font-semibold mt-4 transition-all disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? <span className="animate-pulse">Signing in…</span> : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-textSecondary">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-primary font-semibold hover:text-primaryHover">
                Sign Up
              </button>
            </p>
          </div>
        </main>
      </motion.div>

      {/* Forgot Password modal */}
      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>
    </>
  );
}
