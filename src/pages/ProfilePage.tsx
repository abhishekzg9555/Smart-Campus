import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Complaint } from '../types';
import {
  User,
  Mail,
  Hash,
  Shield,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Building,
  Award
} from 'lucide-react';
import { format } from 'date-fns';

interface ProfilePageProps {
  complaints: Complaint[];
  onNavigateToComplaints: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  complaints,
  onNavigateToComplaints,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();

  const userComplaints = isAdmin
    ? complaints
    : complaints.filter((c) => c.studentUid === userProfile?.uid);

  const resolvedCount = userComplaints.filter((c) => c.status === 'Resolved').length;
  const pendingCount = userComplaints.filter((c) => c.status !== 'Resolved').length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMMM d, yyyy');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                isAdmin ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {isAdmin ? (
                <Shield className="w-8 h-8" />
              ) : (
                <GraduationCap className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {userProfile?.name || 'Smart Campus User'}
                </h1>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isAdmin ? 'Facility Admin' : 'Student'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{userProfile?.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-600" />
            <span>Account Details</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Account Type</span>
              <span className="font-bold text-slate-800 capitalize">
                {isAdmin ? 'Campus Administrator' : 'Enrolled Student'}
              </span>
            </div>

            {!isAdmin && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Student Roll / ID</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {userProfile?.studentId || 'Not set'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Primary Email</span>
              <span className="font-mono text-slate-700">{userProfile?.email}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Member Since</span>
              <span className="text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(userProfile?.createdAt)}</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>{userProfile?.department || 'CSE Department'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Engagement Program</span>
              <span className="font-semibold text-slate-800">
                Community Engagement (CEP)
              </span>
            </div>
          </div>
        </div>

        {/* Activity & Impact Metrics */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{isAdmin ? 'Campus System Metrics' : 'Your Maintenance Impact'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <p className="text-[11px] font-bold text-slate-500 uppercase">
                {isAdmin ? 'Total Tickets' : 'Reports Filed'}
              </p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {userComplaints.length}
              </h4>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <p className="text-[11px] font-bold text-emerald-800 uppercase">
                Resolved & Verified
              </p>
              <h4 className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                {resolvedCount}
              </h4>
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Campus Citizen Engagement</span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              Every complaint logged empowers facility technicians to repair broken infrastructure, prevent accidents, and maintain college hygiene.
            </p>
            <button
              type="button"
              onClick={onNavigateToComplaints}
              className="font-bold text-blue-700 hover:text-blue-900 underline block pt-1"
            >
              View Complaints History →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
