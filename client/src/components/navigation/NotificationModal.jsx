import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import {
  X, Bell, BellOff, CheckCheck, Trash2,
  PackagePlus, FilePen, Trash, AlertTriangle, ShieldAlert, PartyPopper
} from 'lucide-react';

// ─── Map notification type → icon + colour ─────────────────────────────────

const TYPE_META = {
  welcome:         { Icon: PartyPopper,   color: 'text-primary',   bg: 'bg-primary/10',   label: 'Welcome'  },
  product_added:   { Icon: PackagePlus,   color: 'text-success',   bg: 'bg-success/10',   label: 'Added'    },
  product_updated: { Icon: FilePen,       color: 'text-primary',   bg: 'bg-primary/10',   label: 'Updated'  },
  product_deleted: { Icon: Trash,         color: 'text-textMuted', bg: 'bg-borderBase',   label: 'Deleted'  },
  expiry_warning:  { Icon: AlertTriangle, color: 'text-warn',      bg: 'bg-warn/10',      label: 'Warning'  },
  expiry:          { Icon: ShieldAlert,   color: 'text-danger',    bg: 'bg-danger/10',    label: 'Expired'  },
  // legacy
  reminder:        { Icon: AlertTriangle, color: 'text-warn',      bg: 'bg-warn/10',      label: 'Reminder' },
};

const getMeta = (type) => TYPE_META[type] || TYPE_META['reminder'];

// ─── Single notification item ──────────────────────────────────────────────

function NotifItem({ notif, onRead, onDelete }) {
  const { Icon, color, bg, label } = getMeta(notif.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className={`group relative flex gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        !notif.isRead
          ? 'bg-primary/5 border-primary/20 shadow-sm'
          : 'bg-bgSurface border-borderBase hover:border-borderStrong'
      }`}
      onClick={() => !notif.isRead && onRead(notif._id)}
    >
      {/* Icon badge */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={16} className={color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
          <div className="flex items-center gap-1.5">
            {!notif.isRead && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-textMuted hover:text-danger hover:bg-danger/10 transition-all"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-textPrimary' : 'text-textSecondary'}`}>
          {notif.message}
        </p>
        <span className="text-[11px] font-medium text-textMuted mt-2 block">
          {notif.createdAt
            ? new Date(notif.createdAt).toLocaleString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
            : 'Just now'}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification, clearAll } = useNotifications();
  const modalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="notif-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-lg bg-bgSurface border border-borderBase rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-borderBase bg-bgElevated/40 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-textPrimary leading-none">Notifications</h3>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <CheckCheck size={14} />
                    All read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    title="Clear all notifications"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-textMuted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <BellOff size={14} />
                    Clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-textSecondary hover:text-textPrimary hover:bg-bgElevated rounded-lg transition-colors ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3">
              <AnimatePresence>
                {notifications.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center text-textMuted flex flex-col items-center gap-3"
                  >
                    <Bell size={48} className="text-borderBase opacity-40" />
                    <div>
                      <p className="text-sm font-medium text-textSecondary">No notifications yet</p>
                      <p className="text-xs mt-1">Product events and warranty alerts will appear here.</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <NotifItem
                        key={notif._id}
                        notif={notif}
                        onRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
