import React, { useState } from 'react';
import { Complaint } from '../../types';
import { seedDemoComplaints, clearDemoComplaints } from '../../services/complaintService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import {
  Database,
  RefreshCw,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  ShieldAlert
} from 'lucide-react';

interface DemoDataManagerPageProps {
  complaints?: Complaint[];
  onRefreshData: () => void;
}

export const DemoDataManagerPage: React.FC<DemoDataManagerPageProps> = ({
  complaints = [],
  onRefreshData,
}) => {
  const [loadingAction, setLoadingAction] = useState<'seed' | 'clear' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const demoComplaints = safeComplaints.filter((c) => c.isDemoData);
  const realComplaints = safeComplaints.filter((c) => !c.isDemoData);

  const handleSeed = async () => {
    setLoadingAction('seed');
    setMessage(null);
    try {
      await seedDemoComplaints();
      setMessage({
        type: 'success',
        text: 'Successfully seeded standard CEP engineering demo complaints (CAMP-1001 to CAMP-1005)!',
      });
      onRefreshData();
    } catch (err: any) {
      console.error('Error seeding demo data:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to seed demo data in Firestore.',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClear = async () => {
    setLoadingAction('clear');
    setMessage(null);
    try {
      const removed = await clearDemoComplaints();
      setMessage({
        type: 'success',
        text: `Removed ${removed} demo complaints. User-reported complaints remain untouched.`,
      });
      onRefreshData();
    } catch (err: any) {
      console.error('Error clearing demo data:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to clear demo data from Firestore.',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              CEP Demo Data & Evaluation Tool
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Testing Utility
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Easily bootstrap realistic test complaints (with before/after photos and departments) to evaluate all features.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Status Feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Dataset Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Firestore Records</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">{complaints.length}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Live database collection size</p>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-800 uppercase">CEP Demo Seed Tickets</p>
          <h3 className="text-3xl font-extrabold text-amber-700 mt-1 font-mono">{demoComplaints.length}</h3>
          <p className="text-[11px] text-amber-600 mt-1">Marked with isDemoData = true</p>
        </div>

        <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-sm">
          <p className="text-xs font-semibold text-blue-800 uppercase">User-Reported Complaints</p>
          <h3 className="text-3xl font-extrabold text-blue-700 mt-1 font-mono">{realComplaints.length}</h3>
          <p className="text-[11px] text-blue-600 mt-1">Live field incident reports</p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Quick Demo Seed Management</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Loading sample data injects realistic complaints across Electrical, Plumbing, Furniture, Cleanliness,
          and Infrastructure domains with realistic photos, departmental assignments, and verified resolution proofs.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={loadingAction !== null}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {loadingAction === 'seed' ? 'Seeding Firestore Database...' : 'Seed CEP Demo Complaints'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loadingAction !== null || demoComplaints.length === 0}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {loadingAction === 'clear' ? 'Cleaning...' : 'Clear Demo Complaints Only'}
            </span>
          </button>
        </div>
      </div>

      {/* Demo Complaints Overview Table */}
      {demoComplaints.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">
              Currently Loaded Demo Dataset ({demoComplaints.length} tickets)
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {demoComplaints.map((c) => (
              <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {c.complaintId}
                    </span>
                    <span className="font-bold text-slate-900">{c.title}</span>
                  </div>
                  <p className="text-slate-500">
                    {c.building?.replace('Building', 'Department')} • {c.floor} ({c.location}) — Category: {c.category}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
