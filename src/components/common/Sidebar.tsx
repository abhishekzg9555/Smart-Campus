import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  BarChart3,
  Bell,
  User,
  LogOut,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadNotifsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimary?: boolean;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  unreadNotifsCount,
  isOpen,
  onClose,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();

  const studentNavItems: NavItem[] = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/report', label: 'Report a Problem', icon: PlusCircle, isPrimary: true },
    { path: '/student/complaints', label: 'My Complaints', icon: FileText },
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount },
    { path: '/student/profile', label: 'Student Profile', icon: User },
  ];

  const adminNavItems: NavItem[] = [
    { path: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { path: '/admin/complaints', label: 'Manage Complaints', icon: FileText },
    { path: '/admin/analytics', label: 'Campus Analytics', icon: BarChart3 },
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount },
    { path: '/admin/profile', label: 'Admin Profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onClose();
  };

  const isItemActive = (itemPath: string) => {
    if (currentPath === itemPath) return true;
    if (itemPath === '/student/complaints' && currentPath.startsWith('/student/complaints')) return true;
    if (itemPath === '/admin/complaints' && currentPath.startsWith('/admin/complaints')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Items */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* User Status Card */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner ${
                  isAdmin ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 capitalize font-mono">
                  {isAdmin ? 'Facility Admin' : userProfile?.studentId || 'Student'}
                </p>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {isAdmin ? 'Administration Portal' : 'Student Services'}
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);
              const isAction = item.isPrimary;

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isAction
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 mb-2'
                      : isActive
                      ? 'bg-slate-800 text-blue-400 border border-slate-700/80 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isAction
                          ? 'text-white'
                          : isActive
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-slate-900">
                      {item.badge}
                    </span>
                  )}
                  {isActive && !isAction && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Footer & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-2.5 text-[11px] text-blue-300 leading-snug">
            <p className="font-semibold text-blue-200">CEP Engineering Initiative</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Centralized Campus Maintenance</p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
