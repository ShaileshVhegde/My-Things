import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
  transition: { duration: 0.35, ease: "easeOut" }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.post('http://localhost:5000/api/auth/google', {
          access_token: codeResponse.access_token
        });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user); // use server response which includes role
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'Google login failed');
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed')
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user); // use server response which includes role
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };



  return (
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
          <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden bg-primary/10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <ShieldCheck size={16} className="text-primary hidden" />
          </div>
          <span>My Things </span>
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
            <div className="flex-grow border-t border-borderBase"></div>
            <span className="flex-shrink-0 mx-4 text-textMuted text-sm">or</span>
            <div className="flex-grow border-t border-borderBase"></div>
          </div>

          {error && <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-sm font-medium">{error}</div>}

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
                <a href="#" className="text-primary text-xs font-semibold hover:text-primaryHover transition-colors">Forgot?</a>
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
              {loading ? <span className="animate-pulse">Signing in...</span> : 'Sign In'}
            </button>
          </form>



          <p className="text-center mt-6 text-sm text-textSecondary">
            Don't have an account? <button onClick={() => navigate('/signup')} className="text-primary font-semibold hover:text-primaryHover">Sign Up</button>
          </p>
        </div>
      </main>
    </motion.div>
  );
}
