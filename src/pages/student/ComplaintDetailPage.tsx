import React, { useState } from 'react';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { BeforeAfterViewer } from '../../components/common/BeforeAfterViewer';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  User,
  Tag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  MessageSquare,
  Eye,
  ExternalLink,
  Timer
} from 'lucide-react';

interface ComplaintDetailPageProps {
  complaint?: Complaint | null;
  onBack: () => void;
  onManageComplaint?: (docId: string) => void;
}

export const ComplaintDetailPage: React.FC<ComplaintDetailPageProps> = ({
  complaint,
  onBack,
  onManageComplaint,
}) => {
  const { isAdmin } = useAuth();
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">The selected complaint details could not be loaded.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
        >
          Return to List
        </button>
      </div>
    );
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy • h:mm a');
    } catch {
      return isoString;
    }
  };

  const isResolved = complaint.status === 'Resolved';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </button>

        {isAdmin && onManageComplaint && (
          <button
            type="button"
            onClick={() => onManageComplaint(complaint.id)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Open Admin Management Panel</span>
          </button>
        )}
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-sm font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg">
                {complaint.complaintId}
              </span>
              <PriorityBadge priority={complaint.priority} size="md" />
              <StatusBadge status={complaint.status} size="md" />
              {complaint.isDemoData && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Demo Sample Ticket
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {complaint.title || `${complaint.category} Issue in ${complaint.building?.replace('Building', 'Department')}`}
            </h1>

            <p className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Filed {formatDate(complaint.createdAt)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Student: {complaint.studentName} ({complaint.studentId})</span>
              </span>
            </p>
          </div>

          {isResolved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Problem Resolved
                </p>
                <p className="text-[11px] text-emerald-600 font-mono">
                  {formatDate(complaint.resolvedAt)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Progress Timeline */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
            Resolution Workflow Timeline
          </h4>
          <Timeline complaint={complaint} />
        </div>
      </div>

      {/* Before & After Resolution Section (If Resolved) */}
      {isResolved && (
        <BeforeAfterViewer complaint={complaint} />
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Problem Report & Photo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Problem Description & Details</h3>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>

            {/* Location Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-bold text-blue-600 uppercase">Department</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{complaint.building?.replace('Building', 'Department')}</p>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-bold text-blue-600 uppercase">Floor</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{complaint.floor}</p>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-bold text-blue-600 uppercase">Location / Room</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{complaint.location}</p>
              </div>
            </div>
          </div>

          {/* Problem Photograph Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Attached Problem Photograph</h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Full Zoom
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video max-h-80 relative group">
              <img
                src={complaint.photoUrl}
                alt="Problem Photograph"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Maintenance Assignment & Admin Activity */}
        <div className="space-y-6">
          {/* Maintenance Team Assignment */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Assigned Maintenance Team</span>
            </h3>

            {complaint.assignedDepartment ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase">Department</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {complaint.assignedDepartment}
                  </p>
                  {complaint.assignedStaff && (
                    <p className="text-xs text-indigo-800 mt-1 font-medium">
                      Assigned to: <strong>{complaint.assignedStaff}</strong>
                    </p>
                  )}
                  {complaint.status === 'Assigned' && (
                    <div className="mt-2 pt-2 border-t border-indigo-200 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
                      <Timer className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                      <span>Scheduled to transition to In Progress 5 minutes post-assignment.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Awaiting administrative triage & department assignment.
              </div>
            )}
          </div>

          {/* Admin / Maintenance Notes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Administrative Logs & Notes</span>
            </h3>

            {complaint.adminComment ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">Estate Office Note:</p>
                {complaint.adminComment}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No admin notes logged yet.</p>
            )}

            {complaint.resolutionComment && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <p className="font-semibold text-emerald-800 mb-1">Resolution Audit Note:</p>
                {complaint.resolutionComment}
              </div>
            )}
          </div>

          {/* Student Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Reporter Information</h3>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <strong className="text-slate-800">Student:</strong> {complaint.studentName}
              </p>
              <p>
                <strong className="text-slate-800">Student ID:</strong> {complaint.studentId}
              </p>
              <p>
                <strong className="text-slate-800">Email:</strong> {complaint.studentEmail}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-sm text-slate-800">
                Problem Photo • {complaint.complaintId} ({complaint.category})
              </h4>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={complaint.photoUrl}
                alt="Problem zoom"
                className="max-h-full max-w-full object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
