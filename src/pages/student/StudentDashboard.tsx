import React from 'react';
import { Complaint } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { format } from 'date-fns';
import {
  PlusCircle,
  Clock,
  Wrench,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles,
  Bell
} from 'lucide-react';
import { AppNotification } from '../../types';

interface StudentDashboardProps {
  complaints?: Complaint[];
  notifications?: AppNotification[];
  onGoToReport?: () => void;
  onGoToMyComplaints?: () => void;
  onSelectComplaint?: (docId: string) => void;
  onNavigateToReport?: () => void;
  onNavigateToComplaints?: () => void;
  onViewComplaint?: (complaint: Complaint) => void;
  onViewAllNotifications?: () => void;
  onSelectComplaintId?: (complaintId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  complaints = [],
  notifications = [],
  onGoToReport,
  onGoToMyComplaints,
  onSelectComplaint,
  onNavigateToReport,
  onNavigateToComplaints,
  onViewComplaint,
  onViewAllNotifications,
  onSelectComplaintId,
}) => {
  const { userProfile } = useAuth();

  const handleReport = onGoToReport || onNavigateToReport || (() => {});
  const handleMyComplaints = onGoToMyComplaints || onNavigateToComplaints || (() => {});
  const handleSelect = (complaint: Complaint) => {
    if (onViewComplaint) {
      onViewComplaint(complaint);
    } else if (onSelectComplaint) {
      onSelectComplaint(complaint.id);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const total = safeComplaints.length;
  const pending = safeComplaints.filter(
    (c) => c.status === 'Reported' || c.status === 'Under Review'
  ).length;
  const inProgress = safeComplaints.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolved = safeComplaints.filter((c) => c.status === 'Resolved').length;

  const recentComplaints = safeComplaints.slice(0, 5);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Campus Maintenance Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {userProfile?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Report broken campus infrastructure, upload photographs for maintenance inspection, and
            track repair progress with verified before/after audit photos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReport}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Broken Infrastructure</span>
            </button>
            <button
              type="button"
              onClick={handleMyComplaints}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors"
            >
              <span>View My History ({total})</span>
            </button>
          </div>
        </div>

        {/* Decorative Badge */}
        <div className="hidden lg:block absolute right-8 bottom-6 opacity-20">
          <Building2 className="w-44 h-44 text-blue-400" />
        </div>
      </div>

      {/* Resolved Notification Banner */}
      {resolved > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                {resolved} {resolved === 1 ? 'Issue Fixed & Verified' : 'Issues Fixed & Verified'} 🎉
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Maintenance staff has completed repair works and uploaded before & after resolution photographs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleMyComplaints}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review Resolution Proof</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Complaints"
          value={total}
          icon={FileText}
          subtitle="All filed issues"
          accentColor="blue"
          onClick={handleMyComplaints}
        />
        <StatCard
          title="Pending Review"
          value={pending}
          icon={Clock}
          subtitle="Reported or in review"
          accentColor="purple"
          onClick={handleMyComplaints}
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={Wrench}
          subtitle="Assigned to tech staff"
          accentColor="amber"
          onClick={handleMyComplaints}
        />
        <StatCard
          title="Resolved"
          value={resolved}
          icon={CheckCircle2}
          subtitle="Fixed & verified"
          accentColor="emerald"
          onClick={handleMyComplaints}
        />
      </div>

      {/* Live Assigned & Resolved Updates Feed */}
      {safeNotifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Assigned & Resolved Maintenance Updates</span>
                  <span className="bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Technician dispatches, department assignments, and repair approvals
                </p>
              </div>
            </div>

            {onViewAllNotifications && (
              <button
                type="button"
                onClick={onViewAllNotifications}
                className="text-xs text-blue-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View all ({safeNotifications.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {safeNotifications.slice(0, 3).map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.complaintId && onSelectComplaintId) {
                    onSelectComplaintId(notif.complaintId);
                  } else if (onViewAllNotifications) {
                    onViewAllNotifications();
                  }
                }}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !notif.read ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      notif.type === 'resolved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : notif.type === 'assignment'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {notif.type === 'resolved' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {notif.complaintId && (
                  <button
                    type="button"
                    className="self-end sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>View Status</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Reported Issues</h3>
            <p className="text-xs text-slate-500">Your latest campus tickets and current statuses</p>
          </div>

          {safeComplaints.length > 0 && (
            <button
              type="button"
              onClick={handleMyComplaints}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>View all ({total})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {safeComplaints.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Complaints Logged Yet"
                description="Notice a damaged ceiling fan, leaking washroom, or broken classroom bench? Submit your first report to notify facility staff."
                actionText="Report a Problem"
                onAction={handleReport}
              />
            </div>
          ) : (
            recentComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                    <img
                      src={c.photoUrl}
                      alt="Issue"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {c.complaintId}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">{c.category} Issue</h4>
                    </div>

                    <p className="text-xs text-slate-500">
                      {c.building?.replace('Building', 'Department')} • {c.floor} ({c.location})
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-1 max-w-md">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={c.priority} size="sm" />
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
