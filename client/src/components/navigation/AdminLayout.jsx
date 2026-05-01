import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, LayoutDashboard, ShieldCheck, LogOut, Moon, Sun, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const adminNavItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/admin' },
  { label: 'Users', icon: Users, to: '/admin/users' },
];

export default function AdminLayout({ children }) {
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.name || user?.email || 'Admin';
  const initials = displayName[0].toUpperCase();

  return (
    <div className="flex h-screen bg-bgBase overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-bgSurface border-r border-borderBase z-30 fixed top-0 left-0">
        {/* Logo + Admin Badge */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-borderBase">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-textPrimary text-base block leading-none">Admin Panel</span>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-widest">My Things</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminNavItems.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all outline-none ${active
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-textSecondary hover:bg-bgElevated hover:text-textPrimary'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-borderBase space-y-1">
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-textSecondary hover:bg-bgElevated hover:text-textPrimary transition-all"
          >
            <ChevronLeft size={18} />
            Back to App
          </button>
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-textSecondary hover:bg-bgElevated hover:text-textPrimary transition-all"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:ml-64">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-borderBase bg-bgSurface z-20">
          <div>
            <h1 className="text-sm font-bold text-textPrimary">
              {adminNavItems.find(i => i.to === location.pathname)?.label || 'Admin Panel'}
            </h1>
            <p className="text-xs text-textMuted">My Things Admin</p>
          </div>

          <div className="flex items-center gap-3 relative">
            <button onClick={toggleTheme} className="md:hidden p-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-bgElevated">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm outline-none"
            >
              {initials}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-64 bg-bgSurface border border-borderBase rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="px-4 py-5 border-b border-borderBase bg-bgElevated/50 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mb-3 shadow-inner">
                      {initials}
                    </div>
                    <p className="text-sm font-bold text-textPrimary w-full truncate">{displayName}</p>
                    <p className="text-xs font-medium text-textMuted mt-1 w-full truncate">{user?.email}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setProfileOpen(false); logout(); }}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" onClick={() => setProfileOpen(false)}>
          {children}
        </main>
      </div>
    </div>
  );
}
