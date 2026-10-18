import React, { useState } from 'react';
import { Complaint } from '../../types';
import { findComplaintByCustomId } from '../../services/complaintService';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Timeline } from './Timeline';
import {
  Search,
  AlertCircle,
  Building2,
  Calendar,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Modal } from './Modal';
import { format } from 'date-fns';

interface QuickTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const QuickTrackModal: React.FC<QuickTrackModalProps> = ({
  isOpen,
  onClose,
  onSelectComplaint,
}) => {
  const [complaintIdInput, setComplaintIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundComplaint, setFoundComplaint] = useState<Complaint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = complaintIdInput.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a Complaint ID.');
      return;
    }

    setError(null);
    setLoading(true);
    setFoundComplaint(null);

    try {
      const result = await findComplaintByCustomId(clean);
      if (!result) {
        setError(`No complaint found with ID "${clean}". Please verify the ID number.`);
      } else {
        setFoundComplaint(result);
      }
    } catch (err: any) {
      console.error('Track error:', err);
      setError('Failed to query complaint.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSample = (sampleId: string) => {
    setComplaintIdInput(sampleId);
    setError(null);
    setLoading(true);
    findComplaintByCustomId(sampleId)
      .then((res) => {
        if (res) setFoundComplaint(res);
        else setError(`Complaint ${sampleId} not found in database.`);
      })
      .catch(() => setError('Failed to load sample complaint.'))
      .finally(() => setLoading(false));
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy • h:mm a');
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setFoundComplaint(null);
        setError(null);
        setComplaintIdInput('');
        onClose();
      }}
      title="Quick Complaint Tracking"
      subtitle="Search any campus maintenance ticket instantly by ID"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={complaintIdInput}
              onChange={(e) => setComplaintIdInput(e.target.value)}
              placeholder="e.g. CAMP-1001, CAMP-1002"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500 focus:bg-white uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Ticket'}
          </button>
        </form>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Try sample tickets:</span>
          </span>
          {['CAMP-1001', 'CAMP-1002', 'CAMP-1003'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleQuickSample(id)}
              className="font-mono text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
            >
              {id}
            </button>
          ))}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Result */}
        {foundComplaint && (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                    {foundComplaint.complaintId}
                  </span>
                  <StatusBadge status={foundComplaint.status} size="sm" />
                  <PriorityBadge priority={foundComplaint.priority} size="sm" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  {foundComplaint.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectComplaint(foundComplaint);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                <span>Full Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                <span className="font-semibold text-slate-800">
                  {foundComplaint.building?.replace('Building', 'Department')} • {foundComplaint.floor} ({foundComplaint.location})
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Department</span>
                <span className="font-semibold text-slate-800">
                  {foundComplaint.assignedDepartment || 'Pending Assignment'}
                </span>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="pt-2">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Current Progress State
              </h5>
              <Timeline complaint={foundComplaint} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
