import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { UserProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  firebaseProjectId: string;
  registerStudent: (
    name: string,
    email: string,
    studentId: string,
    pass: string,
    department?: string
  ) => Promise<UserProfile>;
  loginStudent: (email: string, pass: string) => Promise<UserProfile>;
  loginAdmin: (email: string, pass: string) => Promise<UserProfile>;
  login: (email: string, pass: string) => Promise<UserProfile>;
  signInWithGoogle: (preferredRole?: 'student' | 'admin') => Promise<UserProfile>;
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

export const handleAuthError = (err: any): Error => {
  if (!err) return new Error('An unknown authentication error occurred.');
  if (typeof err === 'string') return new Error(err);
  if (err.message && !err.code) return err;

  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return new Error('Invalid email or password. Please verify your credentials or register if you do not have an account.');
    case 'auth/user-not-found':
      return new Error('No account found with this email. Please click "Register Student Account" to create your account.');
    case 'auth/email-already-in-use':
      return new Error('This college email is already registered. Please sign in with your password.');
    case 'auth/weak-password':
      return new Error('Password must be at least 6 characters in length.');
    case 'auth/invalid-email':
      return new Error('Please enter a valid email format.');
    case 'auth/operation-not-allowed':
      return new Error(
        'Email/Password sign-in is disabled in your Firebase console. Please enable Email/Password under Firebase Console > Authentication > Sign-in method, or sign in using Google!'
      );
    case 'auth/too-many-requests':
      return new Error('Access temporarily blocked due to multiple failed login attempts. Please try again in a few moments.');
    case 'auth/popup-closed-by-user':
      return new Error('Google Sign-In popup was closed before completing. Please try again.');
    case 'auth/cancelled-popup-request':
      return new Error('Authentication request was cancelled.');
    case 'auth/network-request-failed':
      return new Error('Network error connecting to Firebase Authentication. Check your connection.');
    default:
      return new Error(err.message || 'Authentication failed. Please verify credentials and try again.');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getLocalSession());
  const [loading, setLoading] = useState<boolean>(true);

  const firebaseProjectId = (firebaseConfig as any)?.projectId || 'smart-campus';

  // Helper to sync Firestore profile for authenticated user
  const syncProfileFromFirestore = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      const isMasterAdmin = firebaseUser.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const role = isMasterAdmin ? 'admin' : 'student';
        const profile: UserProfile = {
          ...data,
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          role,
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

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: isMasterAdmin ? 'Abhishek (Campus Admin)' : formattedName,
          email: firebaseUser.email || '',
          role: isMasterAdmin ? 'admin' : 'student',
          studentId: isMasterAdmin ? undefined : 'STU-' + Math.floor(100000 + Math.random() * 900000),
          department: isMasterAdmin ? 'Central Campus Maintenance & Estate Cell' : 'Computer Science & Engineering',
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile, { merge: true });
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

  // Auth State Listener attached to Firebase Auth
  useEffect(() => {
    let isMounted = true;

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
    department: string = 'Computer Science & Engineering'
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanStudentId = studentId.trim().toUpperCase();

    if (!cleanEmail || !pass || !cleanName) {
      throw new Error('Please fill in all required fields.');
    }

    if (pass.length < 6) {
      throw new Error('Password must be at least 6 characters in length.');
    }

    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() || cleanEmail.includes('admin')) {
      throw new Error('Admin emails cannot be registered as students. Please use the Admin Portal.');
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth display name
      await updateProfile(firebaseUser, { displayName: cleanName });

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: cleanName,
        email: cleanEmail,
        studentId: cleanStudentId,
        role: 'student',
        department,
        createdAt: new Date().toISOString(),
      };

      // Persist to Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, newProfile);

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

    // Direct master admin to the Admin Login tab
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(
        'Access Notice: admin@smartcampus.edu is the Master Admin account. Please switch to the "Admin Login" tab.'
      );
    }

    try {
      // Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const firebaseUser = userCredential.user;
      setUser(firebaseUser);

      // Fetch user profile from Firestore
      const profile = await syncProfileFromFirestore(firebaseUser);
      if (!profile) {
        throw new Error('Unable to retrieve student profile. Please re-login.');
      }

      if (profile.role === 'admin') {
        throw new Error('This account is registered as Administrator. Please use the Admin Login tab.');
      }

      return profile;
    } catch (err: any) {
      console.error('Firebase Student Login Error:', err);
      throw handleAuthError(err);
    }
  };

  // 3. ADMIN LOGIN WITH FIREBASE AUTH
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

    try {
      // Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const firebaseUser = userCredential.user;
      setUser(firebaseUser);

      // Fetch or assign admin profile
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
        await setDoc(userDocRef, adminProfile, { merge: true });
      }

      setUserProfile(adminProfile);
      persistLocalSession(adminProfile);
      return adminProfile;
    } catch (err: any) {
      console.error('Firebase Admin Login Error:', err);
      throw handleAuthError(err);
    }
  };

  // 4. GOOGLE SIGN-IN WITH POPUP
  const signInWithGoogle = async (preferredRole: 'student' | 'admin' = 'student'): Promise<UserProfile> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      setUser(firebaseUser);

      const isMasterAdmin = firebaseUser.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();

      // Block any non-authorized email from choosing Admin
      if (preferredRole === 'admin' && !isMasterAdmin) {
        throw new Error(
          `Admin Access Denied: Admin login is only allowed from ${DEFAULT_ADMIN_EMAIL}. Your Google account (${firebaseUser.email}) cannot log in as administrator.`
        );
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const existing = snap.data() as UserProfile;
        const role = isMasterAdmin ? 'admin' : 'student';
        const updatedProfile: UserProfile = { ...existing, role };
        if (existing.role !== role) {
          await setDoc(userDocRef, { role }, { merge: true });
        }
        setUserProfile(updatedProfile);
        persistLocalSession(updatedProfile);
        return updatedProfile;
      }

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: isMasterAdmin ? 'Abhishek (Campus Admin)' : (firebaseUser.displayName || 'Campus Member'),
        email: firebaseUser.email || '',
        role: isMasterAdmin ? 'admin' : 'student',
        studentId: isMasterAdmin ? undefined : 'STU-' + Math.floor(100000 + Math.random() * 900000),
        department: isMasterAdmin ? 'Central Campus Maintenance & Estate Cell' : 'Computer Science & Engineering',
        createdAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, newProfile, { merge: true });
      setUserProfile(newProfile);
      persistLocalSession(newProfile);
      return newProfile;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw handleAuthError(err);
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
      await setDoc(userDocRef, adminProfile, { merge: true });

      setUser(firebaseUser);
      setUserProfile(adminProfile);
      persistLocalSession(adminProfile);
      return adminProfile;
    } catch (err: any) {
      console.error('Setup Admin Error:', err);
      throw handleAuthError(err);
    }
  };

  // 6. GENERAL LOGIN HELPER
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      return loginAdmin(cleanEmail, pass);
    } else {
      return loginStudent(cleanEmail, pass);
    }
  };

  // 7. SIGN OUT
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
        registerStudent,
        loginStudent,
        loginAdmin,
        login,
        signInWithGoogle,
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
