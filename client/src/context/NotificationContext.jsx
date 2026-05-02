import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const NOTIF_PATH = '/notifications';


export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  // Request browser notification permissions once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get(NOTIF_PATH, { headers: authHeader() });
      const newNotifs = res.data.notifications || [];
      setNotifications(newNotifs);

      const newUnread = newNotifs.filter(n => !n.isRead).length;
      setUnreadCount(newUnread);

      // Browser push for truly new unread notifications
      if (newUnread > prevCountRef.current) {
        const newest = newNotifs.find(n => !n.isRead);
        if (newest && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('My Things', {
            body: newest.message,
            icon: '/favicon.ico',
          });
        }
      }
      prevCountRef.current = newUnread;
    } catch (err) {
      console.error('[NotificationContext] fetch error:', err.message);
    }
  }, [user]);

  // Poll every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`${NOTIF_PATH}/${id}/read`, {}, { headers: authHeader() });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] markAsRead error:', err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await API.patch(`${NOTIF_PATH}/mark-all-read`, {}, { headers: authHeader() });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] markAllRead error:', err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`${NOTIF_PATH}/${id}`, { headers: authHeader() });
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => {
        const was = notifications.find(n => n._id === id);
        return was && !was.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('[NotificationContext] delete error:', err.message);
    }
  };

  const clearAll = async () => {
    try {
      await API.delete(`${NOTIF_PATH}/clear-all`, { headers: authHeader() });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] clearAll error:', err.message);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllRead,
      deleteNotification,
      clearAll,
      fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
