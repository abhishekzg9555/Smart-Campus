import React from 'react';
import { Complaint } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { format } from 'date-fns';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Database,
  ChevronRight
} from 'lucide-react';

interface AdminDashboardProps {
  complaints?: Complaint[];
  onNavigateToComplaints: (filter?: { priority?: string; status?: string }) => void;
  onNavigateToAnalytics: () => void;
  onNavigateToDemoManager: () => void;
  onSelectComplaintToManage?: (docId: string) => void;
  onViewComplaint?: (complaint: Complaint) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints = [],
  onNavigateToComplaints,
  onNavigateToAnalytics,
  onNavigateToDemoManager,
  onSelectComplaintToManage,
  onViewComplaint,
}) => {
  const handleManage = (complaint: Complaint) => {
    if (onViewComplaint) {
      onViewComplaint(complaint);
    } else if (onSelectComplaintToManage) {
      onSelectComplaintToManage(complaint.id);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const total = safeComplaints.length;
  const pending = safeComplaints.filter(
    (c) => c.status === 'Reported' || c.status === 'Under Review'
  ).length;
  const inProgress = safeComplaints.filter(
    (c) => c.status === 'Assigned' || c.status === 'In Progress'
  ).length;
  const resolved = safeComplaints.filter((c) => c.status === 'Resolved').length;
  const highPriority = safeComplaints.filter((c) => c.priority === 'High' && c.status !== 'Resolved').length;

  const urgentComplaints = safeComplaints.filter(
    (c) => c.priority === 'High' && c.status !== 'Resolved'
  );
  const recentComplaints = safeComplaints.slice(0, 6);

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
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Central Maintenance Control & Estate Cell</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Infrastructure Admin Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Review incoming student complaints, assign technician crews, inspect resolution
            photographs, and monitor facility uptime analytics.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToComplaints()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Manage All Issues</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToAnalytics}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>View Analytics</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToDemoManager}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Seed CEP Demo Data"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Issues"
          value={total}
          icon={FileText}
          subtitle="All recorded tickets"
          accentColor="slate"
          onClick={() => onNavigateToComplaints()}
        />
        <StatCard
          title="Pending Triage"
          value={pending}
          icon={Clock}
          subtitle="Requires assignment"
          accentColor="purple"
          onClick={() => onNavigateToComplaints({ status: 'Reported' })}
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={Wrench}
          subtitle="Technicians dispatched"
          accentColor="amber"
          onClick={() => onNavigateToComplaints({ status: 'In Progress' })}
        />
        <StatCard
          title="Resolved"
          value={resolved}
          icon={CheckCircle2}
          subtitle="Verified & audited"
          accentColor="emerald"
          onClick={() => onNavigateToComplaints({ status: 'Resolved' })}
        />
      </div>

      {/* High Priority Urgent Alert Banner (If Any Unresolved) */}
      {highPriority > 0 && (
        <div className="bg-red-50 border-2 border-red-300/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold animate-pulse">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-sm">
                  {highPriority} Urgent High-Priority Incident{highPriority > 1 ? 's' : ''} Requiring Attention
                </h3>
                <p className="text-xs text-red-700">
                  Hazards reported in academic blocks or labs needing fast response
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToComplaints({ priority: 'High' })}
              className="text-xs font-bold text-red-700 hover:text-red-900 underline hidden sm:inline"
            >
              Filter all high priority →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentComplaints.slice(0, 3).map((urgent) => (
              <div
                key={urgent.id}
                onClick={() => handleManage(urgent)}
                className="bg-white p-3.5 rounded-xl border border-red-200 hover:border-red-400 cursor-pointer shadow-xs transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-700">
                    {urgent.complaintId}
                  </span>
                  <StatusBadge status={urgent.status} size="sm" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs truncate">
                  {urgent.category} • {urgent.building?.replace('Building', 'Department')}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {urgent.floor} — {urgent.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Incoming Maintenance Stream</h3>
            <p className="text-xs text-slate-500">Live ticket queue across campus blocks</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToComplaints()}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Open Full Complaint Table</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentComplaints.map((c) => (
            <div
              key={c.id}
              onClick={() => handleManage(c)}
              className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                    {c.assignedDepartment && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-100 hidden sm:inline">
                        Dept: {c.assignedDepartment}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {c.building?.replace('Building', 'Department')} • {c.floor} ({c.location}) — Reported by {c.studentName}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-1 max-w-lg">
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

                <button
                  type="button"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
