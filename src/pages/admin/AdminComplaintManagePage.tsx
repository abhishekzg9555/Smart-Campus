import React, { useState } from 'react';
import {
  Complaint,
  ComplaintStatus,
  Priority,
  MaintenanceDepartment
} from '../../types';
import {
  updateComplaintStatus,
  assignDepartmentAndStaff,
  updatePriority,
  resolveComplaint
} from '../../services/complaintService';
import { uploadPhoto } from '../../services/storageService';
import { ImageUpload } from '../../components/common/ImageUpload';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Timeline } from '../../components/common/Timeline';
import { BeforeAfterViewer } from '../../components/common/BeforeAfterViewer';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Wrench,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  Save,
  Sparkles,
  Eye,
  Timer,
  Play
} from 'lucide-react';

interface AdminComplaintManagePageProps {
  complaint?: Complaint | null;
  onBack: () => void;
  onRefreshComplaint: () => void;
}

const DEPARTMENTS: MaintenanceDepartment[] = [
  'Electrical Maintenance',
  'Plumbing Maintenance',
  'Cleaning Staff',
  'Furniture/Maintenance',
  'Infrastructure',
  'Security',
  'Other',
];

const STATUSES: ComplaintStatus[] = [
  'Reported',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

const SAMPLE_RESOLUTION_PHOTOS = [
  {
    name: 'Electrical Replaced',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    comment: 'Replaced damaged switchboard and tested voltage insulation safely.',
  },
  {
    name: 'Plumbing Repaired',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    comment: 'Replaced pipe connector, stopped leakage, and cleaned standing water.',
  },
  {
    name: 'Furniture Restored',
    url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    comment: 'Installed heavy-duty wood plank, sanded edges, and secured brackets.',
  },
  {
    name: 'Corridor Sanitized',
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
    comment: 'Deep sanitation completed, dispensers refilled and log signed.',
  },
];

export const AdminComplaintManagePage: React.FC<AdminComplaintManagePageProps> = ({
  complaint,
  onBack,
  onRefreshComplaint,
}) => {
  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">The selected complaint details could not be loaded.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
        >
          Return to Complaints
        </button>
      </div>
    );
  }

  // Form controls state
  const [priority, setPriority] = useState<Priority>(complaint.priority || 'Normal');
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status || 'Reported');
  const [department, setDepartment] = useState<string>(
    complaint.assignedDepartment || 'Electrical Maintenance'
  );
  const [staffName, setStaffName] = useState<string>(complaint.assignedStaff || '');
  const [adminComment, setAdminComment] = useState<string>(complaint.adminComment || '');

  // Resolution controls state
  const [resolutionComment, setResolutionComment] = useState<string>(
    complaint.resolutionComment || ''
  );
  const [resFile, setResFile] = useState<File | null>(null);
  const [resPreview, setResPreview] = useState<string | null>(
    complaint.resolutionPhotoUrl || null
  );

  // Loading & status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy • h:mm a');
    } catch {
      return isoString;
    }
  };

  const handleStartWorkNow = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateComplaintStatus(
        complaint.id,
        'In Progress',
        adminComment.trim() || 'Work started immediately by maintenance crew.',
        complaint
      );
      setStatus('In Progress');
      setSuccessMessage('Status updated to In Progress! Maintenance team is actively working on site.');
      onRefreshComplaint();
    } catch (err: any) {
      console.error('Error updating to In Progress:', err);
      setErrorMessage(err.message || 'Failed to update status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAssignmentAndStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // 1. Update priority if changed
      if (priority !== complaint.priority) {
        await updatePriority(complaint.id, priority);
      }

      // 2. Update assignment & department
      await assignDepartmentAndStaff(
        complaint.id,
        department,
        staffName.trim(),
        adminComment.trim(),
        complaint
      );

      // 3. Update status if explicitly specified
      if (status !== complaint.status) {
        if (status === 'Resolved') {
          await resolveComplaint(
            complaint.id,
            resPreview || complaint.resolutionPhotoUrl || complaint.photoUrl,
            resolutionComment.trim() || 'Maintenance repair completed and approved by administration.',
            adminComment.trim(),
            complaint
          );
        } else {
          await updateComplaintStatus(complaint.id, status, adminComment.trim(), complaint);
        }
      }

      setSuccessMessage('Complaint assignment & status updated successfully! Student has been notified in real time.');
      onRefreshComplaint();
    } catch (err: any) {
      console.error('Error updating complaint:', err);
      setErrorMessage(err.message || 'Failed to update ticket.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!resPreview) {
      setErrorMessage('Please upload a Resolution Photograph proving the repair before marking as Resolved.');
      return;
    }

    if (!resolutionComment.trim() || resolutionComment.trim().length < 5) {
      setErrorMessage('Please enter a brief maintenance resolution comment.');
      return;
    }

    setIsResolving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let finalResPhoto = resPreview;
      if (resFile) {
        if (resPreview && resPreview.startsWith('data:image/')) {
          finalResPhoto = resPreview;
        } else {
          finalResPhoto = await uploadPhoto(resFile, 'resolutions', complaint.complaintId);
        }
      }

      await resolveComplaint(
        complaint.id,
        finalResPhoto,
        resolutionComment.trim(),
        adminComment.trim(),
        complaint
      );

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setStatus('Resolved');
      setSuccessMessage('Ticket officially marked as Resolved! Before & After resolution proof is published and student notified.');
      onRefreshComplaint();
    } catch (err: any) {
      console.error('Error resolving complaint:', err);
      setErrorMessage(err.message || 'Failed to resolve ticket.');
    } finally {
      setIsResolving(false);
    }
  };

  const isAlreadyResolved = complaint.status === 'Resolved';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Table</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
            {complaint.complaintId}
          </span>
          <PriorityBadge priority={complaint.priority} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="font-semibold">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-800 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {complaint.title || `${complaint.category} Issue in ${complaint.building?.replace('Building', 'Department')}`}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>Department: <strong>{complaint.building?.replace('Building', 'Department')}</strong></span>
              <span>•</span>
              <span>Floor: <strong>{complaint.floor}</strong></span>
              <span>•</span>
              <span>Location: <strong>{complaint.location}</strong></span>
              <span>•</span>
              <span>Reported on {formatDate(complaint.createdAt)}</span>
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{complaint.studentName} ({complaint.studentId})</span>
            </p>
            <p className="text-slate-500">{complaint.studentEmail}</p>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Workflow Progress Timeline
          </h4>
          <Timeline complaint={complaint} />
        </div>
      </div>

      {/* Before / After Resolution Showcase (If Resolved) */}
      {isAlreadyResolved && (
        <BeforeAfterViewer complaint={complaint} />
      )}

      {/* Admin Action Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Triage & Department Assignment */}
        <form
          onSubmit={handleUpdateAssignmentAndStatus}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  1. Triage & Department Assignment
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign maintenance crew and advance status
                </p>
              </div>
            </div>

            {/* Assigned Status Notice & Quick Action */}
            {complaint.status === 'Assigned' && (
              <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Timer className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Auto-advances to In Progress 5 minutes post-assignment</span>
                  </div>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Technicians have been assigned. Work will transition automatically or you can begin now:
                </p>
                <button
                  type="button"
                  onClick={handleStartWorkNow}
                  disabled={isSaving}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Work Now (Move to In Progress)</span>
                </button>
              </div>
            )}

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normal', 'Medium', 'High'] as Priority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        p === 'High'
                          ? isSelected
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-red-50 text-red-700 border-red-200'
                          : p === 'Medium'
                          ? isSelected
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                          : isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Complaint Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-800"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Maintenance Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-800"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Staff Member */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Staff Member / Lead Technician
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Ramesh Verma (Senior Electrician)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Admin Comment / Internal Log */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Administrative Notes / Public Comment
              </label>
              <textarea
                rows={3}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="e.g. Field crew dispatched with safety insulation kit; work underway during afternoon hours..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Updates...' : 'Save Department & Status Updates'}</span>
          </button>
        </form>

        {/* Right Column: Resolution Photo & Close-Out Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  2. Resolution Photo & Audit Verification
                </h3>
                <p className="text-[11px] text-slate-500">
                  Provide proof photo and close ticket as Resolved
                </p>
              </div>
            </div>

            {/* Original Problem Photo Reminder */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-300">
                <img
                  src={complaint.photoUrl}
                  alt="Original"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-slate-800">Original Reported Photograph</p>
                <p className="text-slate-500 line-clamp-1">{complaint.description}</p>
              </div>
            </div>

            {/* Resolution Photo Upload */}
            <div>
              <ImageUpload
                onImageSelected={(file, dataUrl) => {
                  setResFile(file);
                  setResPreview(dataUrl);
                }}
                previewUrl={resPreview}
                label="Upload Resolution Verification Photograph"
                helperText="Attach photograph taken after repair to complete the Before/After audit."
                required
              />
            </div>

            {/* Quick Test Resolution Sample Selector */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Quick Resolution Sample Presets for Testing:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_RESOLUTION_PHOTOS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      setResPreview(sample.url);
                      setResFile(null);
                      if (!resolutionComment) {
                        setResolutionComment(sample.comment);
                      }
                    }}
                    className="text-xs bg-white hover:bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded border border-emerald-300 font-medium transition-colors"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Maintenance Resolution Notes *
              </label>
              <textarea
                rows={3}
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                placeholder="Explain the actions taken (e.g. Broken fan capacitor replaced, blades aligned, wiring insulated, verified operational)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Mark as Resolved Button */}
          <button
            type="button"
            onClick={handleMarkResolved}
            disabled={isResolving}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {isResolving
                ? 'Publishing Resolution...'
                : isAlreadyResolved
                ? 'Update Resolution Audit Proof'
                : 'Mark as Resolved & Notify Student'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
