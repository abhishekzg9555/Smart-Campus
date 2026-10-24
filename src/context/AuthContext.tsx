import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, sanitizeFirestoreData } from '../firebase/config';
import { UserProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  firebaseProjectId: string;
  isEmbeddedIframe: boolean;
  redirectError: string | null;
  clearRedirectError: () => void;
  registerStudent: (
    name: string,
    email: string,
    studentId: string,
    pass: string,
    department?: string,
    mobileNo?: string,
    academicYear?: string
  ) => Promise<UserProfile>;
  loginStudent: (email: string, pass: string) => Promise<UserProfile>;
  loginAdmin: (email: string, pass: string) => Promise<UserProfile>;
  login: (email: string, pass: string) => Promise<UserProfile>;
  signInWithGoogle: (preferredRole?: 'student' | 'admin', useRedirect?: boolean) => Promise<UserProfile | void>;
  signInWithGoogleRedirect: (preferredRole?: 'student' | 'admin') => Promise<void>;
  updateStudentId: (studentId: string, department?: string) => Promise<UserProfile>;
  completeStudentOnboarding: (data: {
    rollNo: string;
    branch: string;
    mobileNo: string;
    academicYear: string;
    name?: string;
  }) => Promise<UserProfile>;
  updateStudentProfile: (updates: {
    rollNo?: string;
    branch?: string;
    mobileNo?: string;
    academicYear?: string;
    name?: string;
  }) => Promise<UserProfile>;
  setupAdminAccount: (
    email?: string,
    pass?: string,
    name?: string,
    department?: string
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_ADMIN_EMAIL = 'abhishekzg9555@gmail.com';
export const DEFAULT_ADMIN_PASS = 'CampusAdmin123!';

const LOCAL_STORAGE_KEY = 'smartcampus_active_user_session';

const persistLocalSession = (profile: UserProfile | null) => {
  try {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to update local storage session:', e);
  }
};

const getLocalSession = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as UserProfile;
    }
  } catch (e) {
    console.error('Failed to read local storage session:', e);
  }
  return null;
};

export interface AppAuthError extends Error {
  code?: string;
  rawMessage?: string;
  currentDomain?: string;
}

export const handleAuthError = (err: any): AppAuthError => {
  if (!err) return new Error('An unknown authentication error occurred.');
  if (typeof err === 'string') return new Error(err);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const errCode: string = err.code || '';
  const rawMsg: string = err.message || '';

  let userFriendly = '';
  switch (errCode) {
    case 'auth/unauthorized-domain':
      userFriendly = `[auth/unauthorized-domain] Domain "${currentHost}" is not in Firebase's Authorized Domains list. Please add "${currentHost}" to Firebase Console > Authentication > Settings > Authorized domains.`;
      break;
    case 'auth/operation-not-allowed':
      userFriendly = `[auth/operation-not-allowed] Google Sign-In or Email/Password is not enabled in Firebase Console. Go to Authentication > Sign-in method in Firebase Console and click Enable.`;
      break;
    case 'auth/popup-blocked':
      userFriendly = `[auth/popup-blocked] The Google Sign-In popup was blocked by your browser. Please allow popups for "${currentHost}".`;
      break;
    case 'auth/popup-closed-by-user':
      userFriendly = `[auth/popup-closed-by-user] Google Sign-In popup was closed before completing. Please try again.`;
      break;
    case 'auth/cancelled-popup-request':
      userFriendly = `[auth/cancelled-popup-request] Previous popup request was cancelled. Please try again.`;
      break;
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      userFriendly = `[auth/invalid-credential] Invalid email or password. Please verify your credentials or register if you do not have an account.`;
      break;
    case 'auth/user-not-found':
      userFriendly = `[auth/user-not-found] No account found with this email. Please register or sign in with Google.`;
      break;
    case 'auth/email-already-in-use':
      userFriendly = `[auth/email-already-in-use] This email is already registered. Please sign in with your password or use Google Sign-In.`;
      break;
    case 'auth/weak-password':
      userFriendly = `[auth/weak-password] Password must be at least 6 characters in length.`;
      break;
    case 'auth/invalid-email':
      userFriendly = `[auth/invalid-email] Please enter a valid email format.`;
      break;
    case 'auth/too-many-requests':
      userFriendly = `[auth/too-many-requests] Access temporarily blocked due to multiple failed login attempts. Please try again in a few moments.`;
      break;
    case 'auth/network-request-failed':
      userFriendly = `[auth/network-request-failed] Network error connecting to Firebase Authentication. Check your connection.`;
      break;
    default:
      userFriendly = errCode ? `[${errCode}] ${rawMsg}` : rawMsg || 'Authentication failed. Please check credentials and try again.';
  }

  const errorObj = new Error(userFriendly) as AppAuthError;
  errorObj.code = errCode;
  errorObj.rawMessage = rawMsg;
  errorObj.currentDomain = currentHost;
  return errorObj;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getLocalSession());
  const [loading, setLoading] = useState<boolean>(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const firebaseProjectId = (firebaseConfig as any)?.projectId || 'smart-campus';
  const isEmbeddedIframe = typeof window !== 'undefined' && window.self !== window.top;
  const clearRedirectError = () => setRedirectError(null);

  // Helper to sync Firestore profile for authenticated user
  const syncProfileFromFirestore = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      const isMasterAdmin = firebaseUser.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const role = isMasterAdmin ? 'admin' : 'student';
        const hasAllFields = Boolean(
          (data.rollNo || data.studentId) &&
          (data.branch || data.department) &&
          (data.mobileNo || data.phone) &&
          data.academicYear
        );
        const isOnboarded = role === 'admin' ? true : (data.isOnboarded ?? hasAllFields);
        const profile: UserProfile = {
          ...data,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          role,
          rollNo: data.rollNo || data.studentId || undefined,
          studentId: data.studentId || data.rollNo || undefined,
          branch: data.branch || data.department || undefined,
          department: data.department || data.branch || undefined,
          mobileNo: data.mobileNo || data.phone || undefined,
          phone: data.phone || data.mobileNo || undefined,
          academicYear: data.academicYear || undefined,
          isOnboarded,
        };
        if (data.role !== role) {
          await setDoc(userDocRef, { role }, { merge: true });
        }
        setUserProfile(profile);
        persistLocalSession(profile);
        return profile;
      } else {
        // If profile doesn't exist yet in Firestore (e.g., Google Sign-In)
        const nameFromEmail = firebaseUser.email?.split('@')[0].replace(/[._-]/g, ' ') || 'Campus User';
        const formattedName =
          firebaseUser.displayName ||
          nameFromEmail.replace(/\b\w/g, (c) => c.toUpperCase());

        // Construct Firestore document payload ensuring no undefined values
        const firestorePayload: Record<string, any> = {
          uid: firebaseUser.uid,
          name: isMasterAdmin ? 'Abhishek (Campus Admin)' : formattedName,
          email: firebaseUser.email || '',
          role: isMasterAdmin ? 'admin' : 'student',
          isOnboarded: isMasterAdmin ? true : false,
          createdAt: new Date().toISOString(),
        };

        if (isMasterAdmin) {
          firestorePayload.department = 'Central Campus Maintenance & Estate Cell';
        }

        // For Google Sign-In, studentId, branch, mobileNo, academicYear are omitted until assigned.
        // Neither undefined nor random values are saved to Firestore.
        await setDoc(userDocRef, sanitizeFirestoreData(firestorePayload), { merge: true });

        const newProfile: UserProfile = {
          uid: firestorePayload.uid,
          name: firestorePayload.name,
          email: firestorePayload.email,
          role: firestorePayload.role,
          department: firestorePayload.department,
          isOnboarded: firestorePayload.isOnboarded,
          createdAt: firestorePayload.createdAt,
        };

        setUserProfile(newProfile);
        persistLocalSession(newProfile);
        return newProfile;
      }
    } catch (e) {
      console.warn('Failed to load user document from Firestore:', e);
      // Fallback from existing local session if matched
      const local = getLocalSession();
      if (local && local.uid === firebaseUser.uid) {
        setUserProfile(local);
        return local;
      }
      return null;
    }
  };

  // Auth State Listener attached to Firebase Auth + getRedirectResult handler
  useEffect(() => {
    let isMounted = true;

    // 1. Process getRedirectResult for users returning from signInWithRedirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result || !result.user) return;
        const firebaseUser = result.user;
        const userEmail = (firebaseUser.email || '').trim().toLowerCase();
        const isMasterAdmin = userEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

        let savedRole: string | null = null;
        try {
          savedRole = sessionStorage.getItem('firebase_auth_preferred_role');
          sessionStorage.removeItem('firebase_auth_preferred_role');
        } catch {
          // ignore storage exceptions
        }

        if (savedRole === 'admin' && !isMasterAdmin) {
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          persistLocalSession(null);
          setRedirectError(
            `Admin Access Denied: Admin login is only permitted for ${DEFAULT_ADMIN_EMAIL}. Your Google account (${firebaseUser.email}) cannot access the administrator portal.`
          );
          return;
        }

        setUser(firebaseUser);
        const profile = await syncProfileFromFirestore(firebaseUser);
        if (profile) {
          setUserProfile(profile);
          persistLocalSession(profile);
        }
      })
      .catch((err: any) => {
        console.error('getRedirectResult error:', err);
        if (!isMounted) return;
        const parsed = handleAuthError(err);
        setRedirectError(parsed.message);
      });

    // 2. Continuous Auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          setUser(firebaseUser);
          await syncProfileFromFirestore(firebaseUser);
        } else {
          setUser(null);
          setUserProfile(null);
          persistLocalSession(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Auth listener error:', error);
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 1. STUDENT REGISTRATION WITH FIREBASE AUTH
  const registerStudent = async (
    name: string,
    email: string,
    studentId: string,
    pass: string,
    department: string = 'Computer Science & Engineering',
    mobileNo?: string,
    academicYear?: string
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanStudentId = studentId.trim().toUpperCase();
    const cleanMobile = mobileNo?.trim() || '';
    const cleanYear = academicYear?.trim() || '';
    const cleanDept = department.trim();

    if (!cleanEmail || !pass || !cleanName) {
      throw new Error('Please fill in all required fields.');
    }

    if (pass.length < 6) {
      throw new Error('Password must be at least 6 characters in length.');
    }

    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() || cleanEmail.includes('admin')) {
      throw new Error(
        `Registration Denied: ${DEFAULT_ADMIN_EMAIL} is the Campus Administrator account and cannot be registered as a student. Please use the Admin Portal.`
      );
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth display name
      await updateProfile(firebaseUser, { displayName: cleanName });

      const hasAllFields = Boolean(cleanStudentId && cleanDept && cleanMobile && cleanYear);

      const firestorePayload: Record<string, any> = {
        uid: firebaseUser.uid,
        name: cleanName,
        email: cleanEmail,
        studentId: cleanStudentId,
        rollNo: cleanStudentId,
        role: 'student',
        department: cleanDept,
        branch: cleanDept,
        isOnboarded: hasAllFields,
        createdAt: new Date().toISOString(),
      };

      if (cleanMobile) {
        firestorePayload.mobileNo = cleanMobile;
        firestorePayload.phone = cleanMobile;
      }
      if (cleanYear) {
        firestorePayload.academicYear = cleanYear;
      }

      // Persist to Firestore with sanitization
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, sanitizeFirestoreData(firestorePayload));

      const newProfile: UserProfile = {
        uid: firestorePayload.uid,
        name: firestorePayload.name,
        email: firestorePayload.email,
        studentId: firestorePayload.studentId,
        rollNo: firestorePayload.rollNo,
        role: 'student',
        department: firestorePayload.department,
        branch: firestorePayload.branch,
        phone: firestorePayload.phone,
        mobileNo: firestorePayload.mobileNo,
        academicYear: firestorePayload.academicYear,
        isOnboarded: hasAllFields,
        createdAt: firestorePayload.createdAt,
      };

      setUser(firebaseUser);
      setUserProfile(newProfile);
      persistLocalSession(newProfile);

      return newProfile;
    } catch (err: any) {
      console.error('Firebase Registration Error:', err);
      throw handleAuthError(err);
    }
  };

  // 2. STUDENT LOGIN WITH FIREBASE AUTH
  const loginStudent = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error('Please provide both your college email and password.');
    }

    // If abhishekzg9555@gmail.com is entered, automatically route to loginAdmin!
    // This guarantees abhishekzg9555@gmail.com ONLY logs in as Administrator and is never locked out.
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      return loginAdmin(cleanEmail, pass);
    }

    try {
      // Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const firebaseUser = userCredential.user;

      // Double-check if the authenticated email is the admin email
      if (firebaseUser.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
        // Force admin sync
        const profile = await syncProfileFromFirestore(firebaseUser);
        if (profile) return profile;
      }

      setUser(firebaseUser);

      // Fetch user profile from Firestore
      const profile = await syncProfileFromFirestore(firebaseUser);
      if (!profile) {
        throw new Error('Unable to retrieve student profile. Please re-login.');
      }

      if (profile.role === 'admin') {
        // If this user has an admin role, ensure they have the full admin profile
        setUserProfile(profile);
        persistLocalSession(profile);
        return profile;
      }

      return profile;
    } catch (err: any) {
      console.error('Firebase Student Login Error:', err);
      throw handleAuthError(err);
    }
  };

  // 3. ADMIN LOGIN WITH FIREBASE AUTH (EXCLUSIVE TO abhishekzg9555@gmail.com)
  const loginAdmin = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error('Please enter administrator email and password.');
    }

    // STRICT ACCESS CONTROL: Only abhishekzg9555@gmail.com can log in as admin
    if (cleanEmail !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(
        `Access Denied: Only ${DEFAULT_ADMIN_EMAIL} is authorized to log in as Campus Administrator. Other email IDs cannot access the admin portal.`
      );
    }

    let firebaseUser: User;

    try {
      // Attempt 1: Authenticate with Firebase Authentication with entered password
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      firebaseUser = userCredential.user;
    } catch (primaryErr: any) {
      const errCode = primaryErr?.code;

      // If user does not exist yet in Firebase Authentication, or credential invalid
      if (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
        // Attempt 2: Auto-provision / create admin in Firebase Authentication with this password
        try {
          const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          firebaseUser = createCred.user;
          await updateProfile(firebaseUser, { displayName: 'Abhishek (Campus Admin)' });
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-in-use') {
            // User exists in Firebase, but password typed was different.
            // Attempt 3: Try standard default admin password 'CampusAdmin123!'
            if (pass !== DEFAULT_ADMIN_PASS) {
              try {
                const defaultCred = await signInWithEmailAndPassword(auth, cleanEmail, DEFAULT_ADMIN_PASS);
                firebaseUser = defaultCred.user;
              } catch {
                throw new Error(
                  `Authentication failed for ${DEFAULT_ADMIN_EMAIL}. The password entered did not match. Please use password "${DEFAULT_ADMIN_PASS}" or click "Sign In with Google" below for 1-click access.`
                );
              }
            } else {
              throw handleAuthError(primaryErr);
            }
          } else {
            throw handleAuthError(createErr);
          }
        }
      } else {
        throw handleAuthError(primaryErr);
      }
    }

    // Ensure authenticated user's email strictly matches DEFAULT_ADMIN_EMAIL
    if (firebaseUser.email?.toLowerCase() !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      persistLocalSession(null);
      throw new Error(
        `Access Denied: Only ${DEFAULT_ADMIN_EMAIL} is authorized for Admin access.`
      );
    }

    setUser(firebaseUser);

    // Fetch or assign admin profile in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userDocRef);

    let adminProfile: UserProfile;
    if (snap.exists() && snap.data().role === 'admin') {
      adminProfile = snap.data() as UserProfile;
    } else {
      // Enforce admin role in document
      adminProfile = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Abhishek (Campus Admin)',
        email: cleanEmail,
        role: 'admin',
        department: 'Central Campus Maintenance & Estate Cell',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, sanitizeFirestoreData(adminProfile), { merge: true });
    }

    setUserProfile(adminProfile);
    persistLocalSession(adminProfile);
    return adminProfile;
  };

  // 4. GOOGLE SIGN-IN VIA REDIRECT (Full page navigation for standalone/hosted environments)
  const signInWithGoogleRedirect = async (preferredRole: 'student' | 'admin' = 'student'): Promise<void> => {
    try {
      try {
        sessionStorage.setItem('firebase_auth_preferred_role', preferredRole);
      } catch (e) {
        console.warn('Could not save preferred role in sessionStorage:', e);
      }
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Redirect Sign-In error:', err);
      throw handleAuthError(err);
    }
  };

  // 4b. GOOGLE SIGN-IN (Popup with fallback / redirect support)
  const signInWithGoogle = async (
    preferredRole: 'student' | 'admin' = 'student',
    useRedirect: boolean = false
  ): Promise<UserProfile | void> => {
    if (useRedirect) {
      await signInWithGoogleRedirect(preferredRole);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userEmail = (firebaseUser.email || '').trim().toLowerCase();
      const isMasterAdmin = userEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();

      // STRICT ACCESS CONTROL:
      // If someone else tries to select Admin login, reject them!
      if (preferredRole === 'admin' && !isMasterAdmin) {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        persistLocalSession(null);
        throw new Error(
          `Admin Access Denied: Admin login is only permitted for ${DEFAULT_ADMIN_EMAIL}. Your Google account (${firebaseUser.email}) cannot access the administrator portal.`
        );
      }

      setUser(firebaseUser);

      // CRITICAL ROLE ENFORCEMENT:
      // If the email is abhishekzg9555@gmail.com, role is ALWAYS strictly 'admin'!
      // For all other users, role is 'student'
      const assignedRole: 'admin' | 'student' = isMasterAdmin ? 'admin' : 'student';

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const existing = snap.data() as UserProfile;
        const hasAllFields = Boolean(
          (existing.rollNo || existing.studentId) &&
          (existing.branch || existing.department) &&
          (existing.mobileNo || existing.phone) &&
          existing.academicYear
        );
        const isOnboarded = assignedRole === 'admin' ? true : (existing.isOnboarded ?? hasAllFields);
        const updatedProfile: UserProfile = {
          ...existing,
          role: assignedRole,
          rollNo: existing.rollNo || existing.studentId || undefined,
          studentId: existing.studentId || existing.rollNo || undefined,
          branch: existing.branch || existing.department || undefined,
          department: existing.department || existing.branch || undefined,
          mobileNo: existing.mobileNo || existing.phone || undefined,
          phone: existing.phone || existing.mobileNo || undefined,
          academicYear: existing.academicYear || undefined,
          isOnboarded,
        };
        if (existing.role !== assignedRole) {
          await setDoc(userDocRef, { role: assignedRole }, { merge: true });
        }
        setUserProfile(updatedProfile);
        persistLocalSession(updatedProfile);
        return updatedProfile;
      }

      const firestorePayload: Record<string, any> = {
        uid: firebaseUser.uid,
        name: isMasterAdmin ? 'Abhishek (Campus Admin)' : (firebaseUser.displayName || 'Campus Member'),
        email: firebaseUser.email || '',
        role: assignedRole,
        isOnboarded: isMasterAdmin ? true : false,
        createdAt: new Date().toISOString(),
      };

      if (isMasterAdmin) {
        firestorePayload.department = 'Central Campus Maintenance & Estate Cell';
      }

      // For Google Sign-In, studentId is omitted until assigned by user.
      await setDoc(userDocRef, sanitizeFirestoreData(firestorePayload), { merge: true });

      const newProfile: UserProfile = {
        uid: firestorePayload.uid,
        name: firestorePayload.name,
        email: firestorePayload.email,
        role: firestorePayload.role,
        department: firestorePayload.department,
        isOnboarded: firestorePayload.isOnboarded,
        createdAt: firestorePayload.createdAt,
      };

      setUserProfile(newProfile);
      persistLocalSession(newProfile);
      return newProfile;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const parsed = handleAuthError(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/popup-blocked') {
        if (isEmbeddedIframe) {
          const iframeMsg = `[auth/popup-closed-by-user] Google Sign-In popup was closed or blocked. Because the app is running in an embedded preview iframe, cross-origin browser policies prevent popup communication. Please click "Sign In with Redirect" or open the app in a standalone tab.`;
          const customErr = new Error(iframeMsg) as any;
          customErr.code = err.code;
          throw customErr;
        }
      }
      throw parsed;
    }
  };

  // 5. MASTER ADMIN INITIALIZATION / SETUP
  const setupAdminAccount = async (
    email: string = DEFAULT_ADMIN_EMAIL,
    pass: string = DEFAULT_ADMIN_PASS,
    name: string = 'Abhishek (Campus Admin Director)',
    department: string = 'Central Campus Maintenance & Estate Cell'
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`Admin account setup is strictly restricted to ${DEFAULT_ADMIN_EMAIL}.`);
    }

    try {
      let firebaseUser: User;
      try {
        // Try sign-in first in case already initialized
        const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        firebaseUser = res.user;
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          // Create account if not present
          const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          firebaseUser = res.user;
          await updateProfile(firebaseUser, { displayName: name });
        } else {
          throw e;
        }
      }

      const adminProfile: UserProfile = {
        uid: firebaseUser.uid,
        name,
        email: cleanEmail,
        role: 'admin',
        department,
        createdAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, sanitizeFirestoreData(adminProfile), { merge: true });

      setUser(firebaseUser);
      setUserProfile(adminProfile);
      persistLocalSession(adminProfile);
      return adminProfile;
    } catch (err: any) {
      console.error('Setup Admin Error:', err);
      throw handleAuthError(err);
    }
  };

  // 6. UPDATE STUDENT ID / DEPARTMENT
  const updateStudentId = async (
    newStudentId: string,
    newDepartment?: string
  ): Promise<UserProfile> => {
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    if (isAdmin) {
      throw new Error('Administrators do not have a student ID.');
    }
    const cleanId = newStudentId.trim().toUpperCase();
    if (!cleanId) {
      throw new Error('Please enter a valid Student ID or Roll Number.');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const updates: Record<string, any> = {
      studentId: cleanId,
      rollNo: cleanId,
    };
    if (newDepartment?.trim()) {
      updates.department = newDepartment.trim();
      updates.branch = newDepartment.trim();
    }

    await setDoc(userDocRef, sanitizeFirestoreData(updates), { merge: true });

    const updatedProfile: UserProfile = {
      ...(userProfile || {
        uid: user.uid,
        name: user.displayName || 'Campus Student',
        email: user.email || '',
        role: 'student',
        createdAt: new Date().toISOString(),
      }),
      studentId: cleanId,
      rollNo: cleanId,
      department: newDepartment?.trim() || userProfile?.department || 'Computer Science & Engineering',
      branch: newDepartment?.trim() || userProfile?.branch || 'Computer Science & Engineering',
    };

    setUserProfile(updatedProfile);
    persistLocalSession(updatedProfile);
    return updatedProfile;
  };

  // 6b. COMPLETE STUDENT ONBOARDING (First time login / registration flow)
  const completeStudentOnboarding = async (data: {
    rollNo: string;
    branch: string;
    mobileNo: string;
    academicYear: string;
    name?: string;
  }): Promise<UserProfile> => {
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    const cleanRollNo = data.rollNo.trim().toUpperCase();
    const cleanBranch = data.branch.trim();
    const cleanMobileNo = data.mobileNo.trim();
    const cleanYear = data.academicYear.trim();
    const cleanName = data.name?.trim() || userProfile?.name || user.displayName || 'Campus Student';

    if (!cleanRollNo) {
      throw new Error('Please enter your Student Roll Number.');
    }
    if (!cleanBranch) {
      throw new Error('Please enter or select your Branch Name.');
    }
    if (!cleanMobileNo) {
      throw new Error('Please enter your Mobile Number.');
    }
    if (!cleanYear) {
      throw new Error('Please select your Academic Year.');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const updates: Record<string, any> = {
      name: cleanName,
      studentId: cleanRollNo,
      rollNo: cleanRollNo,
      branch: cleanBranch,
      department: cleanBranch,
      mobileNo: cleanMobileNo,
      phone: cleanMobileNo,
      academicYear: cleanYear,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, sanitizeFirestoreData(updates), { merge: true });

    const updatedProfile: UserProfile = {
      ...(userProfile || {
        uid: user.uid,
        email: user.email || '',
        role: 'student',
        createdAt: new Date().toISOString(),
      }),
      name: cleanName,
      studentId: cleanRollNo,
      rollNo: cleanRollNo,
      branch: cleanBranch,
      department: cleanBranch,
      mobileNo: cleanMobileNo,
      phone: cleanMobileNo,
      academicYear: cleanYear,
      isOnboarded: true,
      updatedAt: updates.updatedAt,
    };

    setUserProfile(updatedProfile);
    persistLocalSession(updatedProfile);
    return updatedProfile;
  };

  // 6c. UPDATE STUDENT PROFILE (From Profile Page)
  const updateStudentProfile = async (updates: {
    rollNo?: string;
    branch?: string;
    mobileNo?: string;
    academicYear?: string;
    name?: string;
  }): Promise<UserProfile> => {
    if (!user) {
      throw new Error('User is not authenticated.');
    }
    const payload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name?.trim()) payload.name = updates.name.trim();
    if (updates.rollNo?.trim()) {
      const clean = updates.rollNo.trim().toUpperCase();
      payload.rollNo = clean;
      payload.studentId = clean;
    }
    if (updates.branch?.trim()) {
      const clean = updates.branch.trim();
      payload.branch = clean;
      payload.department = clean;
    }
    if (updates.mobileNo?.trim()) {
      const clean = updates.mobileNo.trim();
      payload.mobileNo = clean;
      payload.phone = clean;
    }
    if (updates.academicYear?.trim()) {
      payload.academicYear = updates.academicYear.trim();
    }

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, sanitizeFirestoreData(payload), { merge: true });

    const updatedProfile: UserProfile = {
      ...(userProfile || {
        uid: user.uid,
        email: user.email || '',
        role: 'student',
        createdAt: new Date().toISOString(),
      }),
      ...payload,
    };

    setUserProfile(updatedProfile);
    persistLocalSession(updatedProfile);
    return updatedProfile;
  };

  // 7. GENERAL LOGIN HELPER
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      return loginAdmin(cleanEmail, pass);
    } else {
      return loginStudent(cleanEmail, pass);
    }
  };

  // 8. SIGN OUT
  const logout = async () => {
    persistLocalSession(null);
    setUser(null);
    setUserProfile(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign-out warning:', err);
    }
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (auth.currentUser) {
      return syncProfileFromFirestore(auth.currentUser);
    }
    const local = getLocalSession();
    if (local) {
      setUserProfile(local);
      return local;
    }
    return null;
  };

  const isAdmin = userProfile?.role === 'admin';
  const isStudent = userProfile?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isStudent,
        firebaseProjectId,
        isEmbeddedIframe,
        redirectError,
        clearRedirectError,
        registerStudent,
        loginStudent,
        loginAdmin,
        login,
        signInWithGoogle,
        signInWithGoogleRedirect,
        updateStudentId,
        completeStudentOnboarding,
        updateStudentProfile,
        setupAdminAccount,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
