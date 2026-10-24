import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Hash,
  Building2,
  Phone,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { AcademicYear } from '../../types';

interface StudentOnboardingModalProps {
  onCompleted?: () => void;
}

const COMMON_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Chemical Engineering',
  'Biotechnology',
  'Other',
];

const ACADEMIC_YEARS: { value: AcademicYear; label: string; sublabel: string }[] = [
  { value: '1st Year', label: '1st Year', sublabel: 'First Year (Freshman)' },
  { value: '2nd Year', label: '2nd Year', sublabel: 'Second Year (Sophomore)' },
  { value: '3rd Year', label: '3rd Year', sublabel: 'Third Year (Junior)' },
  { value: '4th Year', label: '4th Year', sublabel: 'Fourth Year (Senior / Final)' },
];

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  onCompleted,
}) => {
  const { userProfile, completeStudentOnboarding, logout } = useAuth();

  const [name, setName] = useState<string>(userProfile?.name || '');
  const [rollNo, setRollNo] = useState<string>(userProfile?.rollNo || userProfile?.studentId || '');
  const [branch, setBranch] = useState<string>(
    userProfile?.branch || userProfile?.department || 'Computer Science & Engineering (CSE)'
  );
  const [customBranch, setCustomBranch] = useState<string>('');
  const [mobileNo, setMobileNo] = useState<string>(userProfile?.mobileNo || userProfile?.phone || '');
  const [academicYear, setAcademicYear] = useState<AcademicYear>(
    (userProfile?.academicYear as AcademicYear) || '1st Year'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanRollNo = rollNo.trim().toUpperCase();
    const effectiveBranch = branch === 'Other' ? customBranch.trim() : branch.trim();
    const cleanMobile = mobileNo.trim().replace(/\s+/g, '');

    // Validations
    if (!cleanRollNo) {
      setError('Please enter your Student Roll Number / ID.');
      return;
    }

    if (!effectiveBranch) {
      setError('Please select or specify your Branch Name.');
      return;
    }

    if (!cleanMobile) {
      setError('Please enter your Mobile Number.');
      return;
    }

    // Check basic phone length (typically 10 digits for student mobile numbers)
    const digitsOnly = cleanMobile.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!academicYear) {
      setError('Please choose your Academic Year (1st to 4th Year).');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeStudentOnboarding({
        name: name.trim() || userProfile?.name || 'Campus Student',
        rollNo: cleanRollNo,
        branch: effectiveBranch,
        mobileNo: cleanMobile,
        academicYear,
      });

      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      console.error('Failed to complete student onboarding:', err);
      setError(err.message || 'Failed to save student profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-blue-400/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 bg-blue-950/70 px-2.5 py-0.5 rounded-full border border-blue-700/50 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                First-Time Student Registration
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Complete Your Student Profile
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-lg mt-1">
            Welcome to Campus Care! Please provide your official college details to activate your account. You will only need to do this once.
          </p>
        </div>

        {/* Content & Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Roll Number & Mobile Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Roll No. *</span>
                </label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 21CS042 or STU-102"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Official university roll/registration number
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mobile Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="e.g. 9876543210"
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used for maintenance updates & notifications
                </span>
              </div>
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Branch Name *</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                {COMMON_BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {branch === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    placeholder="Enter your branch name (e.g. Aerospace Engineering)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Year (First to Fourth Year) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Academic Year (First to Fourth Year) *</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACADEMIC_YEARS.map((yr) => {
                  const isSelected = academicYear === yr.value;
                  return (
                    <button
                      key={yr.value}
                      type="button"
                      onClick={() => setAcademicYear(yr.value)}
                      className={`py-3 px-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold scale-[1.02]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                      }`}
                    >
                      <div className="text-sm">{yr.label}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {yr.value === '1st Year'
                          ? '1st Year'
                          : yr.value === '2nd Year'
                          ? '2nd Year'
                          : yr.value === '3rd Year'
                          ? '3rd Year'
                          : '4th Year'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving & Activating Profile...</span>
                ) : (
                  <>
                    <span>Save & Enter Campus Care Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch account / sign out */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Signed in as {userProfile?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
