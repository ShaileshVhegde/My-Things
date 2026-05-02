import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-bgElevated transition-colors outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full border-2 border-bgSurface">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="bell-dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed inset-x-4 top-16 md:absolute md:inset-x-auto md:top-12 md:right-0 md:w-80 max-h-[70vh] md:max-h-96 overflow-y-auto bg-bgSurface border border-borderBase rounded-xl shadow-2xl z-50 flex flex-col"
          >
            <div className="px-4 py-3 border-b border-borderBase bg-bgElevated/50 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-sm font-bold text-textPrimary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-textMuted text-sm">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-borderBase">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`p-4 transition-colors cursor-pointer hover:bg-bgElevated ${!notif.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => !notif.isRead && markAsRead(notif._id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {notif.type}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className={`text-sm ${!notif.isRead ? 'font-medium text-textPrimary' : 'text-textSecondary'}`}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-textMuted mt-2 block">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
