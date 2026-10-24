import React, { useState } from 'react';
import { AlertCircle, Copy, Check, ExternalLink, ShieldAlert, KeyRound, Globe, HelpCircle } from 'lucide-react';

interface FirebaseAuthDiagnosticProps {
  error: string | null;
  firebaseProjectId: string;
  authDomain?: string;
  onDismiss?: () => void;
  onRetryRedirect?: () => void;
}

export const FirebaseAuthDiagnostic: React.FC<FirebaseAuthDiagnosticProps> = ({
  error,
  firebaseProjectId,
  authDomain = 'credible-xylopolist-kxctm.firebaseapp.com',
  onDismiss,
  onRetryRedirect,
}) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isEmbeddedIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Extract error code if formatted as [auth/code]
  const codeMatch = error.match(/\[([a-zA-Z0-9/-]+)\]/);
  const errorCode = codeMatch ? codeMatch[1] : error.includes('unauthorized-domain') ? 'auth/unauthorized-domain' : null;

  const isUnauthorizedDomain =
    errorCode === 'auth/unauthorized-domain' ||
    error.toLowerCase().includes('unauthorized-domain') ||
    error.toLowerCase().includes('authorized domains');

  const isOperationNotAllowed =
    errorCode === 'auth/operation-not-allowed' ||
    error.toLowerCase().includes('operation-not-allowed') ||
    error.toLowerCase().includes('provider is disabled');

  const isPopupBlocked =
    errorCode === 'auth/popup-blocked' ||
    error.toLowerCase().includes('popup-blocked') ||
    error.toLowerCase().includes('popup was blocked');

  const isPopupClosed =
    errorCode === 'auth/popup-closed-by-user' ||
    error.toLowerCase().includes('popup-closed-by-user');

  const handleCopyHost = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenStandalone = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;
  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`;

  return (
    <div className="bg-red-50/95 border border-red-200 rounded-2xl p-4 text-xs text-red-900 shadow-sm space-y-3 animate-in fade-in duration-200">
      {/* Header with Error Code Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-red-950 text-sm">Firebase Authentication Notice</span>
              {errorCode && (
                <span className="font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px] font-bold border border-red-300">
                  {errorCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-red-800 mt-0.5 leading-snug">
              {error.replace(/\[[a-zA-Z0-9/-]+\]\s*/, '')}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-400 hover:text-red-700 text-xs font-bold px-1.5 py-0.5"
            title="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {/* DIAGNOSTIC: POPUP CLOSED / EMBEDDED IFRAME NOTICE */}
      {(isPopupClosed || isPopupBlocked) && (
        <div className="bg-white/95 rounded-xl p-3.5 border border-red-200 space-y-2.5 text-slate-800">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Root Cause: Embedded Preview Browser Restrictions</span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Google AI Studio displays this app inside an embedded <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-900">&lt;iframe&gt;</code>. Modern browser security policies (such as Chrome and Safari cross-origin tracking protection) prevent OAuth popup communication inside embedded frames, immediately causing <code className="font-mono text-red-800 bg-red-50 px-1 rounded">auth/popup-closed-by-user</code>.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenStandalone}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Standalone Tab (Recommended)</span>
            </button>

            {onRetryRedirect && (
              <button
                type="button"
                onClick={onRetryRedirect}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Try Redirect Sign-In</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DIAGNOSTIC 1: UNAUTHORIZED DOMAIN */}
      {isUnauthorizedDomain && (
        <div className="bg-white/95 rounded-xl p-3.5 border border-red-200 space-y-2.5 text-slate-800">
          <div className="flex items-center gap-2 font-bold text-red-900 text-xs">
            <Globe className="w-4 h-4 text-red-600 shrink-0" />
            <span>Root Cause: App Hostname Not in Firebase Authorized Domains</span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Firebase Authentication restricts Google OAuth to approved domains. Your app is running on{' '}
            <strong className="text-slate-900">{currentHost}</strong>, which must be added to your Firebase project.
          </p>

          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
            <span className="truncate text-slate-800 select-all font-semibold">
              {currentHost}
            </span>
            <button
              type="button"
              onClick={handleCopyHost}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-sans text-[11px] font-bold transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Domain'}</span>
            </button>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-[11px] text-amber-950 space-y-1.5">
            <p className="font-bold text-amber-900">
              Required 30-Second Fix in Firebase Console:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
              <li>
                Open{' '}
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-0.5"
                >
                  Firebase Authentication Settings <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                Scroll down to the <strong>"Authorized domains"</strong> table.
              </li>
              <li>
                Click <strong>"Add domain"</strong>.
              </li>
              <li>
                Paste <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900 font-bold">{currentHost}</code> and click <strong>Done</strong>.
              </li>
              <li>
                Return to this page and click <strong>"Sign In with Google"</strong> again!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC 2: OPERATION NOT ALLOWED */}
      {isOperationNotAllowed && (
        <div className="bg-white/95 rounded-xl p-3.5 border border-red-200 space-y-2 text-slate-800">
          <div className="flex items-center gap-2 font-bold text-red-900 text-xs">
            <KeyRound className="w-4 h-4 text-red-600 shrink-0" />
            <span>Root Cause: Google Provider Not Enabled in Firebase</span>
          </div>

          <p className="text-[11px] text-slate-600">
            Google Sign-In is disabled for project <code className="font-bold text-slate-900 font-mono">{firebaseProjectId}</code>.
          </p>

          <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px]">
            <li>
              Open{' '}
              <a
                href={firebaseProvidersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-0.5"
              >
                Firebase Sign-in Methods <ExternalLink className="w-3 h-3 inline" />
              </a>
            </li>
            <li>Click on <strong>Google</strong> from the Sign-in providers list.</li>
            <li>Toggle the switch to <strong>Enable</strong>.</li>
            <li>Select your Project public-facing name and support email.</li>
            <li>Click <strong>Save</strong>.</li>
          </ol>
        </div>
      )}

      {/* Technical Configuration Overview */}
      <div className="pt-1.5 border-t border-red-200/60 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono">
        <div>
          <span>Project: </span>
          <span className="font-bold text-slate-800">{firebaseProjectId}</span>
        </div>
        <div>
          <span>Auth Domain: </span>
          <span className="font-bold text-slate-800">{authDomain}</span>
        </div>
        <div>
          <span>Environment: </span>
          <span className="font-bold text-slate-800">{isEmbeddedIframe ? 'Embedded Iframe' : 'Standalone Window'}</span>
        </div>
      </div>
    </div>
  );
};
