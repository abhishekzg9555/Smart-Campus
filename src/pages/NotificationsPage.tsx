import React from 'react';
import { AppNotification } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCheck,
  ArrowRight,
  ShieldAlert,
  Inbox,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationsPageProps {
  notifications: AppNotification[];
  onSelectComplaintId: (complaintId: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onSelectComplaintId,
}) => {
  const { userProfile } = useAuth();
  const [filter, setFilter] = React.useState<'all' | 'resolved' | 'assignment' | 'unread'>('all');
  const userKey = userProfile?.email || userProfile?.uid || 'guest';

  const resolvedCount = notifications.filter((n) => n.type === 'resolved').length;
  const assignedCount = notifications.filter((n) => n.type === 'assignment').length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'resolved') return n.type === 'resolved';
    if (filter === 'assignment') return n.type === 'assignment';
    return true;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'MMM d, yyyy • h:mm a');
    } catch {
      return isoString;
    }
  };

  const getNotificationIcon = (type?: AppNotification['type']) => {
    switch (type) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'assignment':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'new_complaint':
        return <Bell className="w-5 h-5 text-indigo-600" />;
      default:
        return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Campus Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates regarding your complaint status transitions, technician assignments, and verified repair completions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsAsRead(notifications, userKey)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-slate-500" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Updates</span>
            <span className="text-[10px] opacity-75 font-mono">({notifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved Issues</span>
            <span className="text-[10px] font-mono">({resolvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('assignment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'assignment'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 hover:bg-blue-50 bg-blue-50/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Assigned to Staff</span>
            <span className="text-[10px] font-mono">({assignedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Unread</span>
            <span className="text-[10px] opacity-75 font-mono">({unreadCount})</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No notifications found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'resolved'
                ? 'No resolved issues found yet. Once maintenance marks a fix as complete, the resolution alert will display here.'
                : filter === 'assignment'
                ? 'No assigned issues found yet. When a department or staff is assigned to an issue, it will appear here.'
                : 'You are all caught up! When maintenance crews are assigned or issues resolved, notices will appear here.'}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) markNotificationAsRead(n.id, userKey);
                if (n.complaintId) onSelectComplaintId(n.complaintId);
              }}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                !n.read ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                  n.type === 'resolved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : n.type === 'assignment'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  {getNotificationIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                    {!n.read && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        NEW
                      </span>
                    )}
                    {n.type === 'resolved' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Resolved
                      </span>
                    )}
                    {n.type === 'assignment' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Assigned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{formatDate(n.createdAt)}</p>
                </div>
              </div>

              {n.complaintId && (
                <div className="flex items-center gap-1.5 self-end sm:self-center text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/50">
                  <span>View Details & Proof</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
