import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, BrainCircuit, Package, Plus, Info, ShieldCheck, Sun, Moon, LogOut, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationModal from './NotificationModal';

const navItems = [
  { label: 'Dashboard', icon: House, to: '/dashboard' },
  { label: 'Analyze AI', icon: BrainCircuit, to: '/analyze' },
  { label: 'Products', icon: Package, to: '/products' },
  { label: 'Notifications', icon: Bell, action: 'open_notifications' },
  { label: 'About Us', icon: Info, to: '/about' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const displayName = user?.name || user?.email || 'User';
  const initials = displayName[0].toUpperCase();

  return (
    <>
    <aside className="hidden md:flex flex-col w-64 h-full bg-bgSurface border-r border-borderBase z-30 fixed top-0 left-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-borderBase">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-primary/10">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <ShieldCheck size={18} className="text-primary hidden" />
        </div>
        <span className="font-display font-bold text-textPrimary text-lg">My Things </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, to, action }) => {
          if (action === 'open_notifications') {
            return (
              <button 
                key={label} 
                onClick={() => setIsNotifModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-textSecondary hover:bg-bgElevated hover:text-textPrimary outline-none"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </div>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          }

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

        <Link to="/products/add"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${location.pathname === '/products/add'
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'text-textSecondary hover:bg-bgElevated hover:text-textPrimary'
            }`}
        >
          <Plus size={18} />
          Add Product
        </Link>

        {/* Admin link — only visible to admins */}
        {user?.role === 'admin' && (
          <Link to="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2 outline-none ${
              location.pathname.startsWith('/admin')
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-primary/80 hover:bg-primary/10 border border-primary/20'
            }`}
          >
            <Shield size={18} />
            Admin Panel
          </Link>
        )}
      </nav>

    </aside>

    <NotificationModal 
      isOpen={isNotifModalOpen} 
      onClose={() => setIsNotifModalOpen(false)} 
    />
    </>
  );
}
