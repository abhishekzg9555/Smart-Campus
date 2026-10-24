import React, { useState } from 'react';
import { useAuth, DEFAULT_ADMIN_EMAIL } from '../context/AuthContext';
import { FirebaseAuthDiagnostic } from '../components/common/FirebaseAuthDiagnostic';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  User,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Globe,
  Phone,
  Smartphone,
  KeyRound,
  RotateCw,
  MessageSquare,
} from 'lucide-react';
import { ConfirmationResult } from '../context/AuthContext';

interface LoginPageProps {
  onGoToRegister: () => void;
  onGoToHome: () => void;
  onLoginSuccess?: (role: 'student' | 'admin') => void;
  initialRoleTab?: 'student' | 'admin';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoToRegister,
  onGoToHome,
  onLoginSuccess,
  initialRoleTab = 'student',
}) => {
  const {
    loginStudent,
    loginAdmin,
    signInWithGoogle,
    signInWithGoogleRedirect,
    sendPhoneVerificationCode,
    confirmPhoneVerificationCode,
    redirectError,
    clearRedirectError,
    isEmbeddedIframe,
    firebaseProjectId,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>(initialRoleTab);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Sync redirect errors returned from signInWithRedirect
  React.useEffect(() => {
    if (redirectError) {
      setError(redirectError);
    }
  }, [redirectError]);

  // Resend SMS countdown timer
  React.useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSendPhoneCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanDigits = phoneNumber.trim().replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 7) {
      setError('Please enter a valid mobile phone number (at least 7 to 10 digits).');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanDigits}`;
    setIsSendingPhoneCode(true);

    try {
      const result = await sendPhoneVerificationCode(fullPhoneNumber, 'recaptcha-container');
      setConfirmationResult(result);
      setSuccessMessage(`SMS verification code sent to ${fullPhoneNumber}. Enter the 6-digit code below.`);
      setResendCountdown(30);
    } catch (err: any) {
      console.error('Phone SMS error:', err);
      setError(err.message || 'Failed to send SMS verification code.');
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(null);

    const cleanOtp = otpCode.trim().replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code from your SMS.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const profile = await confirmPhoneVerificationCode(confirmationResult, cleanOtp);
      if (onLoginSuccess) {
        onLoginSuccess(profile.role);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid or expired SMS OTP code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPhoneFlow = () => {
    setConfirmationResult(null);
    setOtpCode('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    clearRedirectError();
    setSuccessMessage(null);

    const cleanInputEmail = email.trim().toLowerCase();

    // EXCLUSIVE ADMIN HANDLING:
    // If abhishekzg9555@gmail.com is logging in, ALWAYS sign them into the Admin portal!
    if (cleanInputEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      setActiveTab('admin');
      setIsLoading(true);
      try {
        const profile = await loginAdmin(cleanInputEmail, password);
        setSuccessMessage(`Welcome back, Administrator ${profile.name}! Logged in successfully.`);
        if (onLoginSuccess) {
          onLoginSuccess('admin');
        }
      } catch (err: any) {
        console.error('Admin login error:', err);
        setError(err.message || 'Failed to authenticate administrator account.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If on Admin tab with a different email, reject
    if (activeTab === 'admin' && cleanInputEmail !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      setError(
        `Access Denied: Only ${DEFAULT_ADMIN_EMAIL} is authorized to log in as Campus Administrator. Other email IDs cannot access the admin portal.`
      );
      return;
    }

    // Student Login
    setIsLoading(true);
    try {
      const profile = await loginStudent(email.trim(), password);
      setSuccessMessage(`Welcome back, ${profile.name}! Authenticated via Firebase.`);
      if (onLoginSuccess) {
        onLoginSuccess(profile.role);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInPopup = async () => {
    setError(null);
    clearRedirectError();
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const profile = await signInWithGoogle(activeTab, false);
      if (profile) {
        setSuccessMessage(`Signed in with Google as ${profile.name} (${profile.role}). Redirecting...`);
        if (onLoginSuccess) {
          onLoginSuccess(profile.role);
        }
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignInRedirect = async () => {
    setError(null);
    clearRedirectError();
    setSuccessMessage('Redirecting to Google for authentication...');
    setIsGoogleLoading(true);

    try {
      await signInWithGoogleRedirect(activeTab);
    } catch (err: any) {
      console.error('Google redirect sign-in error:', err);
      setError(err.message || 'Google redirect sign-in failed.');
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Top back navigation & security notice */}
      <div className="max-w-md w-full mx-auto mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onGoToHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Campus Care Portal
        </button>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
          <Shield className="w-3 h-3" />
          <span>Safe & Secure</span>
        </span>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Top Banner Header */}
        <div
          className={`p-6 text-center text-white transition-colors duration-300 ${
            activeTab === 'admin'
              ? 'bg-gradient-to-r from-slate-950 via-red-950 to-slate-900'
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg mx-auto mb-3 transition-colors ${
              activeTab === 'admin'
                ? 'bg-red-600 ring-2 ring-red-400/30'
                : 'bg-blue-600 ring-2 ring-blue-400/30'
            }`}
          >
            {activeTab === 'admin' ? <Shield className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {activeTab === 'admin' ? 'Campus Admin Facility Portal' : 'Campus Care Student Portal'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {activeTab === 'admin'
              ? 'Authorized Campus Infrastructure Management'
              : 'Sign in with your Firebase credentials to report & track issues'}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'student'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Student Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'admin'
                ? 'border-red-600 text-red-700 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {/* Error & Diagnostic Banner */}
          {error && (
            <FirebaseAuthDiagnostic
              error={error}
              firebaseProjectId={firebaseProjectId}
              onDismiss={() => {
                setError(null);
                clearRedirectError();
              }}
              onRetryRedirect={handleGoogleSignInRedirect}
            />
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Embedded Preview Banner */}
          {isEmbeddedIframe && (
            <div className="p-2.5 bg-blue-50/90 border border-blue-200/90 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[11px] text-blue-800 leading-tight">
                  Running in AI Studio embedded preview. Open standalone for unimpeded Google authentication:
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
                className="shrink-0 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs transition-colors self-end sm:self-auto"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Tab</span>
              </button>
            </div>
          )}

          {/* Google Sign-In Buttons */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleGoogleSignInPopup}
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
              <span>
                {isGoogleLoading
                  ? 'Authenticating with Google...'
                  : `Sign In with Google (${activeTab === 'admin' ? 'Admin' : 'Student'})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleGoogleSignInRedirect}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 shadow-2xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              title="Full-page redirect flow"
            >
              <span>Or Sign In with Redirect (Full Page)</span>
            </button>
          </div>

          {/* Hidden reCAPTCHA DOM Anchor */}
          <div id="recaptcha-container"></div>

          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {activeTab === 'admin' ? 'Administrator Password Login' : 'Or Sign In with Phone or Email'}
            </span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Student Auth Method Selector */}
          {activeTab === 'student' && (
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === 'email'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email & Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMethod === 'phone'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>Phone SMS OTP</span>
              </button>
            </div>
          )}

          {/* ================= PHONE SMS AUTHENTICATION FLOW ================= */}
          {activeTab === 'student' && authMethod === 'phone' ? (
            <div className="space-y-4">
              {!confirmationResult ? (
                // Step 1: Request Phone SMS
                <form onSubmit={handleSendPhoneCode} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-28 px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                      >
                        <option value="+91">🇮🇳 IN (+91)</option>
                        <option value="+1">🇺🇸 US/CA (+1)</option>
                        <option value="+44">🇬🇧 UK (+44)</option>
                        <option value="+971">🇦🇪 UAE (+971)</option>
                        <option value="+61">🇦🇺 AU (+61)</option>
                        <option value="+65">🇸🇬 SG (+65)</option>
                        <option value="+49">🇩🇪 DE (+49)</option>
                      </select>

                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          maxLength={15}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Test number helper */}
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between text-xs text-blue-900">
                    <span className="text-[11px] text-slate-600">Testing phone login?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCountryCode('+91');
                        setPhoneNumber('9999999999');
                        setError(null);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline"
                    >
                      Fill Demo Test Number
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    We will send a one-time 6-digit SMS verification code to this phone number. Standard SMS rates may apply.
                  </p>

                  <button
                    type="submit"
                    disabled={isSendingPhoneCode}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingPhoneCode ? (
                      <span>Sending SMS Verification Code...</span>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Send Verification Code (SMS)</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Verify SMS OTP Code
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Code Sent To</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {countryCode} {phoneNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPhoneFlow}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Change Number
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      6-Digit SMS Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 123456"
                        maxLength={6}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono tracking-widest font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span>Didn't receive SMS?</span>
                    <button
                      type="button"
                      disabled={resendCountdown > 0 || isSendingPhoneCode}
                      onClick={() => handleSendPhoneCode()}
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1"
                    >
                      <RotateCw className={`w-3 h-3 ${isSendingPhoneCode ? 'animate-spin' : ''}`} />
                      <span>{resendCountdown > 0 ? `Resend SMS in ${resendCountdown}s` : 'Resend SMS Code'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <span>Verifying SMS Code with Firebase...</span>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            // ================= EMAIL & PASSWORD FORM =================
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {activeTab === 'admin' ? 'Administrator Email' : 'Student College Email'}
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {activeTab === 'admin' ? 'Exclusive to abhishekzg9555@gmail.com' : 'Students Only'}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      if (val.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() && activeTab !== 'admin') {
                        setActiveTab('admin');
                        setError(null);
                      }
                    }}
                    placeholder={
                      activeTab === 'admin' ? 'abhishekzg9555@gmail.com' : 'student@campuscare.edu'
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Real-time notice if student tab has admin email */}
                {activeTab === 'student' && email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() && (
                  <div className="mt-2 p-2.5 bg-blue-50 border border-blue-300 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{DEFAULT_ADMIN_EMAIL} is the Campus Administrator account.</p>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Submitting will automatically log you in to the Administrator Facility Portal.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          setError(null);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 underline"
                      >
                        Switch to Admin Login tab &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className={`w-full py-3 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  activeTab === 'admin'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {isLoading ? (
                  <span>Verifying with Firebase Authentication...</span>
                ) : (
                  <>
                    <span>
                      {activeTab === 'admin' ? 'Sign In as Administrator' : 'Sign In as Student'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Student Footer Switch to Register */}
          {activeTab === 'student' && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don't have a student account yet?{' '}
                <button
                  type="button"
                  onClick={onGoToRegister}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Register Student Account
                </button>
              </p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Need to report a campus issue?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('student')}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Switch to Student Login
                </button>
              </p>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};
