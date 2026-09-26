import React, { useState } from 'react';
import { 
  Building2, MapPin, PlusCircle, LayoutDashboard, 
  BarChart3, Settings, Moon, Sun, Menu, X, Shield, 
  UserCheck, Wrench, FileText, LogIn, LogOut, ChevronDown, User as UserIcon, Calendar 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationDropdown } from './NotificationDropdown';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSelectIssue?: (issueId: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  onTabChange, 
  onSelectIssue,
  onOpenLogin,
}) => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Nav items strictly governed by role
  const navItems = [
    { id: 'landing', label: 'Overview', icon: Building2 },
    { id: 'map', label: 'Civic Map', icon: MapPin },
    { id: 'appointments', label: 'Book Appointment', icon: Calendar },
    { id: 'report', label: 'Report Issue', icon: PlusCircle, highlight: true },
    { id: 'tracker', label: 'My Reports', icon: FileText, requireAuth: true },
    { 
      id: 'officer', 
      label: 'Field Crew', 
      icon: Wrench, 
      roles: ['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'] as UserRole[] 
    },
    { 
      id: 'supervisor', 
      label: 'Supervisor', 
      icon: LayoutDashboard, 
      roles: ['DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'] as UserRole[] 
    },
    { 
      id: 'manager', 
      label: 'Analytics', 
      icon: BarChart3, 
      roles: ['DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'] as UserRole[] 
    },
    { 
      id: 'admin', 
      label: 'Admin', 
      icon: Settings, 
      roles: ['GOVERNMENT_ADMIN', 'SUPER_ADMIN'] as UserRole[] 
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.roles) {
      if (!role) return false;
      return item.roles.includes(role);
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  Civic<span className="text-sky-600 dark:text-sky-400">Fix</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Gov 2.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
                Report it. Track it. Fix it.
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.highlight
                      ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-600/30'
                      : isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Authenticated User Status or Sign In Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[11px] font-bold leading-none">{user.name}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {user.role.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {user.role}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        onTabChange('landing');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Notifications (available to logged-in users) */}
            {isAuthenticated && (
              <NotificationDropdown onSelectIssue={onSelectIssue} />
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-6 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.highlight
                    ? 'bg-sky-600 text-white'
                    : isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {!isAuthenticated && (
            <button
              onClick={() => {
                onOpenLogin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 mt-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In to CivicFix</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
