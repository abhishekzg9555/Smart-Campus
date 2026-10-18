import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Hash,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Shield,
  Info,
} from 'lucide-react';

interface RegisterPageProps {
  onGoToLogin: () => void;
  onGoToHome: () => void;
  onRegisterSuccess?: () => void;
}

const DEPARTMENTS = [
  'CSE Department',
  'Mechanical Department',
  'Electrical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Other',
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onGoToLogin,
  onGoToHome,
  onRegisterSuccess,
}) => {
  const { registerStudent, signInWithGoogle, firebaseProjectId } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('CSE Department');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your college email address.');
      return;
    }

    if (!studentId.trim()) {
      setError('Please enter your Student ID or Roll Number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    // Explicit security protection against unauthorized admin registration
    if (email.trim().toLowerCase().includes('admin') || name.trim().toLowerCase().includes('admin')) {
      setError(
        'Admin accounts cannot be created via public student registration. Please use the Admin Portal.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await registerStudent(name.trim(), email.trim(), studentId.trim(), password, department);
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create student account with Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle('student');
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      console.error('Google registration error:', err);
      setError(err.message || 'Google registration failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Top back navigation */}
      <div className="max-w-md w-full mx-auto mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onGoToHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Smart Campus Portal
        </button>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/50">
          <Shield className="w-3 h-3" />
          <span>Firebase Registration</span>
        </span>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg mx-auto mb-3 ring-2 ring-blue-400/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Student Registration</h2>
          <p className="text-xs text-slate-300 mt-1">
            Create your official Firebase student account to report and track issues
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <span className="leading-relaxed font-semibold">{error}</span>
                {error.includes('disabled in your Firebase') && (
                  <p className="text-[11px] text-red-800">
                    Use <strong>Sign Up with Google</strong> below for 1-click registration without manual console setup!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Google 1-Click Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs flex items-center justify-center gap-2.5 transition-all hover:border-slate-400 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Signing up with Google...' : 'Sign Up with Google (Instant)'}</span>
          </button>

          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or with Email Registration
            </span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Quick Demo Fill Helper */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Need sample details?</span>
            <button
              type="button"
              onClick={() => {
                setName('Priya Patel');
                setEmail(`priya.${Math.floor(100 + Math.random() * 900)}@smartcampus.edu`);
                setStudentId(`STU-2024-${Math.floor(100 + Math.random() * 900)}`);
                setDepartment('CSE Department');
                setPassword('CampusPass123!');
                setConfirmPassword('CampusPass123!');
                setError(null);
              }}
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Fill Sample Student Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@smartcampus.edu"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student ID / Roll No.
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="STU-2024-042"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white uppercase font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Department</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Account will be registered under <strong>Student Role</strong> in Firebase. Without login credentials, no user can access the portal.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Registering Account in Firebase...</span>
              ) : (
                <>
                  <span>Create Firebase Student Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch to login */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Sign In to Portal
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
