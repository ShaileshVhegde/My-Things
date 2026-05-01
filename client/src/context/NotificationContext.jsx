import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevNotifsRef = useRef([]);

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const newNotifs = res.data.notifications || [];
      setNotifications(newNotifs);
      setUnreadCount(newNotifs.filter(n => !n.isRead).length);

      // Check for new notifications to trigger browser alert
      const prevNotifs = prevNotifsRef.current;
      if (prevNotifs.length > 0 && newNotifs.length > prevNotifs.length) {
        const latestNotif = newNotifs[0]; // Assuming sorted by date desc
        if ('Notification' in window && Notification.permission === 'granted' && !latestNotif.isRead) {
          new Notification('Home Track', {
            body: latestNotif.message,
            icon: '/logo.png'
          });
        }
      }
      prevNotifsRef.current = newNotifs;
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Update local state
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
