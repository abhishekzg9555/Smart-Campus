import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppNotification } from '../../types';
import {
  Bell,
  LogOut,
  User,
  Shield,
  GraduationCap,
  Menu,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  onToggleSidebar: () => void;
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
  onViewAllNotifications: () => void;
  onOpenQuickTrack: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  notifications,
  onNotificationClick,
  onViewAllNotifications,
  onOpenQuickTrack,
}) => {
  const { userProfile, logout, isAdmin } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'h:mm a • MMM d');
    } catch {
      return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md ring-2 ring-blue-400/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  Campus Care
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Infrastructure & Maintenance System
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Quick Tracking Search Bar Trigger */}
          <button
            type="button"
            onClick={onOpenQuickTrack}
            className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs px-3.5 py-1.5 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Track by ID (e.g. CAMP-1001)</span>
            <kbd className="bg-slate-900 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-mono">
              /
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Campus Notifications ({unreadCount} new)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onViewAllNotifications}
                    className="text-xs text-blue-300 hover:text-white underline font-medium"
                  >
                    View all
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onNotificationClick(notif);
                          setShowNotifMenu(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-blue-50/60 border-l-3 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">
                              {notif.title}
                            </p>
                            {notif.type === 'resolved' && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                Resolved
                              </span>
                            )}
                            {notif.type === 'assignment' && (
                              <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                Assigned
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onViewAllNotifications();
                      setShowNotifMenu(false);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Go to Notifications Center →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center space-x-2.5 bg-slate-800/80 hover:bg-slate-800 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {isAdmin ? 'Admin Portal' : userProfile?.studentId || 'Student'}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-bold text-slate-900">{userProfile?.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{userProfile?.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-800">
                    {isAdmin ? (
                      <>
                        <Shield className="w-3 h-3 text-red-600" />
                        <span>Administrator</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3 h-3 text-blue-600" />
                        <span>Student ({userProfile?.studentId})</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
