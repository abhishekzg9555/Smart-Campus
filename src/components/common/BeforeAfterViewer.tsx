import React, { useState } from 'react';
import { Complaint } from '../../types';
import { CheckCircle2, ArrowRight, Eye, ShieldCheck, Calendar, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface BeforeAfterViewerProps {
  complaint: Complaint;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({ complaint }) => {
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy • h:mm a');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Resolution Verification & Audit</h3>
            <p className="text-xs text-slate-300">
              Visual proof of maintenance repair and facility audit
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            Problem Resolved
          </span>
        </div>
      </div>

      {/* Before / Action / After Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BEFORE: Initial Problem Photo */}
          <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                Problem Before (Reported)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {formatDate(complaint.createdAt)}
              </span>
            </div>

            <div className="relative group aspect-video bg-slate-900 overflow-hidden">
              <img
                src={complaint.photoUrl}
                alt="Problem Before"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() =>
                  setModalImage({
                    url: complaint.photoUrl,
                    title: `Original Problem [${complaint.complaintId}]`,
                  })
                }
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4" /> View Full Image
              </button>
            </div>

            <div className="p-3.5 bg-white border-t border-slate-200 flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Student Report Description
              </p>
              <p className="text-sm text-slate-800 line-clamp-3">{complaint.description}</p>
            </div>
          </div>

          {/* AFTER: Resolution Photo */}
          <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Problem After (Resolved)
              </span>
              <span className="text-[11px] text-emerald-700 font-mono font-medium">
                {formatDate(complaint.resolvedAt)}
              </span>
            </div>

            <div className="relative group aspect-video bg-slate-900 overflow-hidden">
              {complaint.resolutionPhotoUrl ? (
                <>
                  <img
                    src={complaint.resolutionPhotoUrl}
                    alt="Resolution After"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setModalImage({
                        url: complaint.resolutionPhotoUrl!,
                        title: `Resolution Verification [${complaint.complaintId}]`,
                      })
                    }
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" /> View Full Image
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Wrench className="w-8 h-8 mb-2 text-slate-500" />
                  <p className="text-xs">Resolved through on-site maintenance inspection</p>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-white border-t border-slate-200 flex-1">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Maintenance Resolution Note
              </p>
              <p className="text-sm text-slate-800">
                {complaint.resolutionComment || 'Maintenance team conducted the necessary repairs and verified safety.'}
              </p>
              {complaint.assignedDepartment && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Executed by: <strong>{complaint.assignedDepartment}</strong>
                  </span>
                  {complaint.assignedStaff && <span>({complaint.assignedStaff})</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full image view */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-semibold text-sm text-slate-800">{modalImage.title}</h4>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-950">
              <img
                src={modalImage.url}
                alt={modalImage.title}
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
