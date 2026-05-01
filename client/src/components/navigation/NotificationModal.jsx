import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { X, Bell } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const modalRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-bgSurface border border-borderBase rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-borderBase bg-bgElevated/50 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Bell size={20} />
                </div>
                <h3 className="text-lg font-bold text-textPrimary">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-textSecondary hover:text-textPrimary hover:bg-bgElevated rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-textMuted flex flex-col items-center">
                  <Bell size={48} className="text-borderBase mb-4 opacity-50" />
                  <p className="text-sm font-medium">No notifications yet.</p>
                  <p className="text-xs mt-1">We'll notify you about expiring warranties here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`p-4 rounded-xl transition-all cursor-pointer border ${
                        !notif.isRead 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
                          : 'bg-bgSurface border-borderBase hover:border-borderHover'
                      }`}
                      onClick={() => !notif.isRead && markAsRead(notif._id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          notif.type === 'expiry' ? 'text-danger' : 'text-primary'
                        }`}>
                          {notif.type}
                        </span>
                        {!notif.isRead && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Unread
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${!notif.isRead ? 'font-semibold text-textPrimary' : 'text-textSecondary'}`}>
                        {notif.message}
                      </p>
                      <span className="text-[11px] font-medium text-textMuted mt-3 block">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString(undefined, {
                          weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                        }) : 'Just now'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
