import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Notification } from '../types';
import { api, setAuthSession, clearAuthSession } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
  login: (email: string, password?: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toastMessage: string | null;
  toastType: 'success' | 'info' | 'error';
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
      await refreshNotifications();
    } catch (err) {
      setUser(null);
      clearAuthSession();
    }
  };

  const loadInitialAuth = async () => {
    try {
      setLoading(true);
      const savedToken = localStorage.getItem('civicfix_token');
      if (savedToken) {
        const currentUser = await api.getMe();
        setUser(currentUser);
        await refreshNotifications();
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      clearAuthSession();
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      if (!user) return;
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (e) {
      // ignore silently
    }
  };

  const login = async (email: string, password?: string): Promise<User> => {
    try {
      setLoading(true);
      const res = await api.login(email, password);
      setAuthSession(res.token, res.user.id);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`);
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (e) {}
      return res.user;
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<User> => {
    try {
      setLoading(true);
      const res = await api.register({ name, email, password, phone });
      setAuthSession(res.token, res.user.id);
      setUser(res.user);
      showToast(`Account registered successfully. Welcome, ${res.user.name}!`);
      return res.user;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setNotifications([]);
    showToast('Signed out successfully.', 'info');
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  useEffect(() => {
    loadInitialAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        loading,
        notifications,
        unreadCount,
        login,
        register,
        logout,
        refreshUser,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        toastMessage,
        toastType,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700/50">
          <span className={`w-2.5 h-2.5 rounded-full ${
            toastType === 'success' ? 'bg-emerald-500' : toastType === 'error' ? 'bg-rose-500' : 'bg-sky-500'
          }`} />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white dark:hover:text-black text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

