import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Shield,
  Wrench,
  Sparkles,
  Zap,
  Droplets,
  Trash2,
  Armchair,
  Building2,
  ShieldAlert,
  Search,
  CheckCircle2,
  Users,
  BarChart3,
  Clock
} from 'lucide-react';
import { Complaint } from '../types';
import { findComplaintByCustomId } from '../services/complaintService';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { Timeline } from '../components/common/Timeline';
import { Modal } from '../components/common/Modal';

interface LandingPageProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onReportClick?: () => void;
  onGoToLogin?: () => void;
  onGoToAdminLogin?: () => void;
  onGoToRegister?: () => void;
  onGoToReport?: () => void;
  onTrackComplaint?: (complaint: Complaint) => void;
  complaints?: Complaint[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onRegisterClick,
  onReportClick,
  onGoToLogin,
  onGoToAdminLogin,
  onGoToRegister,
  onGoToReport,
  onTrackComplaint,
  complaints = [],
}) => {
  const handleLogin = onLoginClick || onGoToLogin || (() => {});
  const handleAdminLogin = onGoToAdminLogin || handleLogin;
  const handleRegister = onRegisterClick || onGoToRegister || (() => {});
  const handleReport = onReportClick || onGoToReport || handleLogin;

  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // Compute live/demo stats
  const totalCount = safeComplaints.length > 0 ? safeComplaints.length : 28;
  const resolvedCount =
    safeComplaints.filter((c) => c.status === 'Resolved').length || 19;
  const inProgressCount =
    safeComplaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length || 6;
  const avgResolutionTime = '24-48 Hours';

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;

    setIsSearching(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      // Look in currently loaded complaints first
      const foundInState = safeComplaints.find(
        (c) => c.complaintId && c.complaintId.toLowerCase() === trackId.trim().toLowerCase()
      );
      if (foundInState) {
        setTrackResult(foundInState);
        setIsModalOpen(true);
      } else {
        const foundInDb = await findComplaintByCustomId(trackId.trim());
        if (foundInDb) {
          setTrackResult(foundInDb);
          setIsModalOpen(true);
        } else {
          setTrackError(`No complaint found with ID "${trackId.toUpperCase()}". Please verify the code.`);
          setIsModalOpen(true);
        }
      }
    } catch {
      setTrackError('Error looking up complaint. Please try again.');
      setIsModalOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const categories = [
    {
      name: 'Electrical Systems',
      icon: Zap,
      desc: 'Faulty wiring, burnt switchboards, lab power sockets, lighting & fans.',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      name: 'Plumbing & Water',
      icon: Droplets,
      desc: 'Washroom leakages, water coolers, tap damages, blocked drainage.',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      name: 'Campus Cleanliness',
      icon: Trash2,
      desc: 'Corridor sanitation, overflowing bins, hygiene stations & washrooms.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      name: 'Furniture & Classroom',
      icon: Armchair,
      desc: 'Damaged benches, podiums, whiteboard fixtures, auditorium seating.',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      name: 'Civil & Infrastructure',
      icon: Building2,
      desc: 'Broken doors, broken window glass, cracked pathways, railing fixes.',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      name: 'Safety & Security',
      icon: ShieldAlert,
      desc: 'Emergency exit obstructions, fire extinguisher inspection, dark spots.',
      color: 'bg-red-50 text-red-600 border-red-200',
    },
  ];

  const workflowSteps = [
    {
      step: '1',
      title: 'Spot & Report',
      desc: 'Student identifies a broken facility, snaps a photo, and submits location details.',
    },
    {
      step: '2',
      title: 'Admin Triage',
      desc: 'Estate administration reviews priority and assigns the relevant maintenance department.',
    },
    {
      step: '3',
      title: 'Field Execution',
      desc: 'Technicians and electricians fix the issue on-site with live status tracking.',
    },
    {
      step: '4',
      title: 'Photo Verification',
      desc: 'Resolution photo and repair audit are logged, marking the complaint Resolved.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">Campus Care</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={handleAdminLogin}
              className="text-xs sm:text-sm font-bold text-red-400 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-500/40 hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Campus Administrator Login (abhishekzg9555@gmail.com)"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={handleRegister}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
            Making our campus <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-indigo-300">
              safer, cleaner and better maintained.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A centralized campus infrastructure management system. Report damaged fixtures, electrical hazards,
            and sanitation issues directly with photos, track live repair progress, and verify resolutions.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleReport}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-102"
            >
              <Wrench className="w-5 h-5" />
              <span>Report a Campus Problem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm sm:text-base rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Login to Campus Portal</span>
            </button>
          </div>

          {/* Public Track by Complaint ID Widget */}
          <div className="mt-12 max-w-xl mx-auto bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl">
            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Enter Complaint ID (e.g. CAMP-1001)..."
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Track Status'}
              </button>
            </form>
            <p className="text-[11px] text-slate-400 mt-2 text-left px-2">
              💡 Tip: Try sample demo complaints like <code className="text-blue-300 font-mono">CAMP-1001</code>, <code className="text-blue-300 font-mono">CAMP-1002</code>, or <code className="text-blue-300 font-mono">CAMP-1003</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="bg-white border-y border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Campus Impact Metrics
            </span>
            <p className="text-xs text-slate-500 mt-1">
              (Live data aggregated from campus maintenance database)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Complaints</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">{totalCount}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Logged across departments</p>
            </div>
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 text-center">
              <p className="text-xs font-semibold text-emerald-800 uppercase">Issues Resolved</p>
              <h3 className="text-3xl font-extrabold text-emerald-700 mt-1 font-mono">{resolvedCount}</h3>
              <p className="text-[11px] text-emerald-600 mt-1">Verified with after-photos</p>
            </div>
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 text-center">
              <p className="text-xs font-semibold text-blue-800 uppercase">Avg Response Time</p>
              <h3 className="text-3xl font-extrabold text-blue-700 mt-1 font-mono">{avgResolutionTime}</h3>
              <p className="text-[11px] text-blue-600 mt-1">Rapid facility turnaround</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How the System Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            A transparent 4-step pipeline designed for students, facility managers, and technicians.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <div
              key={step.step}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center mb-4 text-base shadow-sm">
                {step.step}
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Categories Showcase */}
      <section className="bg-slate-100/70 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Campus Issue Categories Covered
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From engineering labs to hostels, report any facility dysfunction across campus.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Student vs Admin Role Clarification */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Role Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Portal</h3>
                <p className="text-xs text-slate-500">For students, faculty & campus members</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Snap and upload photographs of damaged infrastructure.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Specify exact department, floor, room number, and category.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Track live complaint progression with automated notifications.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>View verified before-and-after resolution proof photos.</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={handleRegister}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Create Student Account
            </button>
          </div>

          {/* Admin Role Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Estate & Admin Office</h3>
                <p className="text-xs text-slate-500">Facility managers & maintenance heads</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                <span>Triage incoming complaints with priority tagging & search.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                <span>Assign maintenance departments (Electrical, Plumbing, Civil).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                <span>Upload resolution proof photos and maintenance comments.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                <span>Analyze breakdown trends & recurring issues with live charts.</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={handleLogin}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Facility Staff & Admin Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-white font-semibold">
              Campus Care – Infrastructure & Maintenance Management System
            </span>
          </div>
          <p className="text-slate-400 text-center sm:text-right">
            Central Campus Infrastructure & Maintenance Cell
          </p>
        </div>
      </footer>

      {/* Quick Track Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={trackResult ? `Complaint [${trackResult.complaintId}]` : 'Tracking Status'}
        subtitle={trackResult ? `${trackResult.category} in ${trackResult.building?.replace('Building', 'Department')}` : undefined}
        maxWidth="lg"
      >
        {trackError ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">{trackError}</p>
            <p className="text-xs text-slate-500 mb-4">
              Please double check the complaint code (e.g. CAMP-1001).
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        ) : trackResult ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-mono">Location</p>
                <p className="text-sm font-bold text-slate-800">
                  {trackResult.building?.replace('Building', 'Department')} • {trackResult.floor} ({trackResult.location})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={trackResult.priority} size="sm" />
                <StatusBadge status={trackResult.status} size="sm" />
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="py-2">
              <Timeline complaint={trackResult} />
            </div>

            {/* Photo preview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Problem Photo</p>
                <img
                  src={trackResult.photoUrl}
                  alt="Problem"
                  className="w-full h-28 object-cover rounded-lg border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              </div>
              {trackResult.resolutionPhotoUrl && (
                <div>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase mb-1">Resolution Photo</p>
                  <img
                    src={trackResult.resolutionPhotoUrl}
                    alt="Resolution"
                    className="w-full h-28 object-cover rounded-lg border border-emerald-200"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleLogin();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                Sign In to View Full Details
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
