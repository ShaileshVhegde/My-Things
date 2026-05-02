import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './navigation/Sidebar';
import MobileNavbar from './navigation/MobileNavbar';
import NotificationBell from './navigation/NotificationBell';
import HomeTrackLogo from './HomeTrackLogo';

export default function AppLayout({ children }) {
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const displayName = user?.name || user?.email || 'User';
  const initials = displayName[0].toUpperCase();

  return (
    <div className="flex h-screen bg-bgBase overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full md:ml-64">
        {/* Top bar (shared desktop & mobile) */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-borderBase bg-bgSurface relative z-20">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 font-display font-bold text-textPrimary">
            <HomeTrackLogo size={34} animated={false} />
            <span>My Things</span>
          </div>
          
          <div className="hidden md:block"></div>

          <div className="flex items-center gap-3 relative">
            <div className="md:hidden">
              <NotificationBell />
            </div>
            <button onClick={toggleTheme} className="p-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-bgElevated">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm outline-none"
            >
              {initials}
            </button>

            {/* Universal User Dropdown */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  key="user-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-64 bg-bgSurface border border-borderBase rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="px-4 py-5 border-b border-borderBase bg-bgElevated/50 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mb-3 shadow-inner">
                      {initials}
                    </div>
                    <p className="text-sm font-bold text-textPrimary w-full truncate">{displayName}</p>
                    <p className="text-xs font-medium text-textMuted mt-1 w-full truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-danger hover:bg-danger/10 transition-colors outline-none"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        {/* Added pb-24 on mobile to account for the bottom navbar height */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8" onClick={() => setUserMenuOpen(false)}>
          {children}
        </main>

        {/* Mobile Bottom Navbar */}
        <MobileNavbar />
      </div>
    </div>
  );
}
