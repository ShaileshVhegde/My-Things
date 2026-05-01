import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronRight } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" }
};

const Splash = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-bgBase flex flex-col items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, boxShadow: ["0 0 0 0 rgba(108,71,255,0.4)", "0 0 0 15px rgba(108,71,255,0)"] }}
        transition={{ duration: 0.8, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
        className="mb-6 w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden bg-primary/10"
      >
        <img src="/logo.png" alt="My Things  Logo" className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <ShieldCheck size={80} strokeWidth={1.5} className="text-primary hidden" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-display font-bold text-textPrimary tracking-wide"
      >
        WARRANTY VAULT
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-textMuted mt-2 tracking-widest text-sm uppercase"
      >
        Smart. Secure. Tracked.
      </motion.p>

      <motion.div
        className="mt-12 w-48 h-1.5 bg-borderBase rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <Splash key="splash" onComplete={() => setShowSplash(false)} />
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-bgBase flex flex-col"
        >
          {/* Header */}
          <header className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 font-display font-bold text-xl text-textPrimary">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-primary/10">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <ShieldCheck size={20} className="text-primary hidden" />
              </div>
              <span>My Things </span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-textSecondary font-semibold hover:text-textPrimary transition-colors"
            >
              Sign In
            </button>
          </header>

          {/* Hero Section */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto -mt-10">
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <div className="inline-block px-4 py-1.5 rounded-full bg-primarySubtle text-primary text-sm font-semibold mb-6">
                ✨ Your Smart Warranty Assistant
              </div>
              <h1 className="text-display-xl font-display font-extrabold text-textPrimary leading-tight mb-6">
                Never Lose a <br /><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Warranty Again</span>
              </h1>
              <p className="text-body-lg text-textSecondary mb-10 max-w-xl mx-auto">
                Store all your product warranties in one secure, intelligent vault. Our AI extracts details instantly, and smart alerts save you money.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-primary hover:bg-primaryHover text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(108,71,255,0.39)] w-full sm:w-auto justify-center"
                >
                  Get Started Free <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
