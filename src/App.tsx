import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Complaint, AppNotification } from './types';
import {
  subscribeToComplaints,
  getComplaintByDocId,
  findComplaintByCustomId,
  checkAndAutoAdvanceAssignedComplaints,
} from './services/complaintService';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  ensureAssignedAndResolvedNotifications,
} from './services/notificationService';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ReportProblemPage } from './pages/student/ReportProblemPage';
import { MyComplaintsPage } from './pages/student/MyComplaintsPage';
import { ComplaintDetailPage } from './pages/student/ComplaintDetailPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminComplaintManagePage } from './pages/admin/AdminComplaintManagePage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { DemoDataManagerPage } from './pages/admin/DemoDataManagerPage';

// Common Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { QuickTrackModal } from './components/common/QuickTrackModal';
import { GraduationCap, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { userProfile, isAdmin, isStudent, loading } = useAuth();

  // URL Path Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickTrackOpen, setIsQuickTrackOpen] = useState(false);

  // Firestore Real-time subscriptions
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Path navigation helper with browser history support
  const navigate = useCallback((path: string, replace: boolean = false) => {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
  }, []);

  // Listen to browser popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut listener for quick tracking ('/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setIsQuickTrackOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-redirect authenticated users away from public pages to their dashboard
  useEffect(() => {
    if (userProfile) {
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
        if (isAdmin) {
          navigate('/admin/dashboard', true);
        } else {
          navigate('/student/dashboard', true);
        }
      }
    }
  }, [userProfile, isAdmin, currentPath, navigate]);

  // Subscribe to real-time complaints
  useEffect(() => {
    setIsDataLoading(true);
    const filterUid = userProfile && !isAdmin ? userProfile.uid : null;
    const filterEmail = userProfile && !isAdmin ? userProfile.email : null;

    const unsubscribe = subscribeToComplaints(
      filterUid,
      (list) => {
        setComplaints(list);
        setIsDataLoading(false);

        // Ensure all assigned and resolved complaints have notifications
        ensureAssignedAndResolvedNotifications(list);

        // Auto-advance any complaint in Assigned status past 5 minutes
        checkAndAutoAdvanceAssignedComplaints(list);

        // Keep selected complaint synced with real-time updates
        if (selectedComplaint) {
          const fresh = list.find((c) => c.id === selectedComplaint.id || c.complaintId === selectedComplaint.complaintId);
          if (fresh) {
            setSelectedComplaint(fresh);
          }
        }
      },
      filterEmail
    );

    return () => unsubscribe();
  }, [userProfile?.uid, userProfile?.email, isAdmin, selectedComplaint?.id, selectedComplaint?.complaintId]);

  // Periodic timer: every 10 seconds, checks if any 'Assigned' complaint reached 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (complaints && complaints.length > 0) {
        checkAndAutoAdvanceAssignedComplaints(complaints);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [complaints]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userProfile) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      userProfile.uid,
      isAdmin,
      (notifs) => {
        setNotifications(notifs);
      },
      userProfile.email
    );

    return () => unsubscribe();
  }, [userProfile?.uid, userProfile?.email, isAdmin]);

  // Auto-resolve complaint when URL has :id (e.g. /student/complaints/CAMP-1001 or /admin/complaints/CAMP-1001)
  useEffect(() => {
    const checkUrlForComplaint = async () => {
      const studentMatch = currentPath.match(/^\/student\/complaints\/([^/]+)$/);
      const adminMatch = currentPath.match(/^\/admin\/complaints\/([^/]+)$/);
      const complaintParam = studentMatch?.[1] || adminMatch?.[1];

      if (complaintParam && complaintParam !== 'manage') {
        if (!selectedComplaint || (selectedComplaint.id !== complaintParam && selectedComplaint.complaintId !== complaintParam)) {
          // Check loaded complaints first
          const foundInList = complaints.find(
            (c) => c.id === complaintParam || c.complaintId.toLowerCase() === complaintParam.toLowerCase()
          );
          if (foundInList) {
            setSelectedComplaint(foundInList);
          } else {
            // Search Firestore
            let found = await findComplaintByCustomId(complaintParam);
            if (!found) {
              found = await getComplaintByDocId(complaintParam);
            }
            if (found) {
              setSelectedComplaint(found);
            }
          }
        }
      }
    };

    checkUrlForComplaint();
  }, [currentPath, complaints, selectedComplaint]);

  // Route Protection & Role Enforcement Effect
  useEffect(() => {
    if (loading) return;

    if (!userProfile) {
      // Unauthenticated user protection
      if (
        currentPath.startsWith('/student') ||
        currentPath.startsWith('/admin') ||
        currentPath.startsWith('/notifications') ||
        currentPath.startsWith('/profile')
      ) {
        navigate('/login', true);
      }
    } else if (isAdmin) {
      // Admin user protection: redirect away from student-only routes and public auth pages
      if (
        currentPath.startsWith('/student') ||
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath === '/register'
      ) {
        navigate('/admin/dashboard', true);
      }
    } else if (isStudent) {
      // Student user protection: strictly redirect away from admin routes and public auth pages
      if (
        currentPath.startsWith('/admin') ||
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath === '/register'
      ) {
        navigate('/student/dashboard', true);
      }
    }
  }, [userProfile, isAdmin, isStudent, loading, currentPath, navigate]);

  // Navigation handlers
  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    if (isAdmin) {
      navigate(`/admin/complaints/${complaint.complaintId || complaint.id}`);
    } else {
      navigate(`/student/complaints/${complaint.complaintId || complaint.id}`);
    }
  };

  const handleSelectComplaintById = async (complaintId: string) => {
    let found = await findComplaintByCustomId(complaintId);
    if (!found) {
      found = await getComplaintByDocId(complaintId);
    }
    if (found) {
      handleViewComplaint(found);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (notif.id) {
      markNotificationAsRead(notif.id, userProfile?.email || userProfile?.uid);
    }
    if (notif.complaintDocId) {
      const comp = await getComplaintByDocId(notif.complaintDocId);
      if (comp) {
        handleViewComplaint(comp);
        return;
      }
    }
    if (notif.complaintId) {
      await handleSelectComplaintById(notif.complaintId);
      return;
    }
    navigate('/notifications');
  };

  // 1. Initial Authentication Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl animate-pulse ring-2 ring-blue-400/30">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Authenticating Smart Campus System...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Views
  if (!userProfile) {
    if (currentPath === '/login') {
      return (
        <LoginPage
          onGoToRegister={() => navigate('/register')}
          onGoToHome={() => navigate('/')}
          onLoginSuccess={(role) => {
            if (role === 'admin') {
              navigate('/admin/dashboard', true);
            } else {
              navigate('/student/dashboard', true);
            }
          }}
        />
      );
    }

    if (currentPath === '/register') {
      return (
        <RegisterPage
          onGoToLogin={() => navigate('/login')}
          onGoToHome={() => navigate('/')}
          onRegisterSuccess={() => {
            navigate('/student/dashboard', true);
          }}
        />
      );
    }

    // Default unauthenticated view: Landing Page
    return (
      <LandingPage
        onLoginClick={() => navigate('/login')}
        onRegisterClick={() => navigate('/register')}
        onReportClick={() => navigate('/login')}
        onGoToLogin={() => navigate('/login')}
        onGoToRegister={() => navigate('/register')}
        onGoToReport={() => navigate('/login')}
        onTrackComplaint={handleViewComplaint}
        complaints={complaints}
      />
    );
  }

  // 3. Authenticated App Shell (Student & Admin)
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onViewAllNotifications={() => navigate('/notifications')}
        onOpenQuickTrack={() => setIsQuickTrackOpen(true)}
        activeView={currentPath}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 pt-16">
        {/* Left Sidebar */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={(path) => navigate(path)}
          unreadNotifsCount={unreadNotifsCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* ================= STUDENT ROUTES ================= */}
          {isStudent && (
            <>
              {(currentPath === '/student/dashboard' ||
                (!currentPath.startsWith('/student/') &&
                  currentPath !== '/notifications' &&
                  currentPath !== '/profile')) && (
                <StudentDashboard
                  complaints={complaints}
                  notifications={notifications}
                  onNavigateToReport={() => navigate('/student/report')}
                  onNavigateToComplaints={() => navigate('/student/complaints')}
                  onViewComplaint={handleViewComplaint}
                  onViewAllNotifications={() => navigate('/notifications')}
                  onSelectComplaintId={handleSelectComplaintById}
                />
              )}

              {currentPath === '/student/report' && (
                <ReportProblemPage
                  onComplaintCreated={() => {
                    navigate('/student/complaints');
                  }}
                  onCancel={() => navigate('/student/dashboard')}
                />
              )}

              {currentPath === '/student/complaints' && (
                <MyComplaintsPage
                  complaints={complaints}
                  onViewComplaint={handleViewComplaint}
                  onNavigateToReport={() => navigate('/student/report')}
                />
              )}

              {currentPath.startsWith('/student/complaints/') && (
                <ComplaintDetailPage
                  complaint={selectedComplaint}
                  onBack={() => navigate('/student/complaints')}
                />
              )}

              {currentPath === '/student/profile' && (
                <ProfilePage
                  complaints={complaints}
                  onNavigateToComplaints={() => navigate('/student/complaints')}
                />
              )}
            </>
          )}

          {/* ================= ADMIN ROUTES ================= */}
          {isAdmin && (
            <>
              {(currentPath === '/admin/dashboard' ||
                (!currentPath.startsWith('/admin/') &&
                  currentPath !== '/notifications' &&
                  currentPath !== '/profile')) && (
                <AdminDashboard
                  complaints={complaints}
                  onNavigateToComplaints={() => navigate('/admin/complaints')}
                  onNavigateToAnalytics={() => navigate('/admin/analytics')}
                  onNavigateToDemoManager={() => navigate('/admin/demo-manager')}
                  onViewComplaint={handleViewComplaint}
                />
              )}

              {currentPath === '/admin/complaints' && (
                <AdminComplaintsPage
                  complaints={complaints}
                  onManageComplaint={handleViewComplaint}
                />
              )}

              {currentPath.startsWith('/admin/complaints/') && (
                <AdminComplaintManagePage
                  complaint={selectedComplaint}
                  onBack={() => navigate('/admin/complaints')}
                  onRefreshComplaint={async () => {
                    if (selectedComplaint) {
                      const fresh = await getComplaintByDocId(selectedComplaint.id);
                      if (fresh) setSelectedComplaint(fresh);
                    }
                  }}
                />
              )}

              {currentPath === '/admin/analytics' && (
                <AdminAnalyticsPage complaints={complaints} />
              )}

              {currentPath === '/admin/demo-manager' && (
                <DemoDataManagerPage
                  complaints={complaints}
                  onRefreshData={() => {}}
                />
              )}

              {currentPath === '/admin/profile' && (
                <ProfilePage
                  complaints={complaints}
                  onNavigateToComplaints={() => navigate('/admin/complaints')}
                />
              )}
            </>
          )}

          {/* ================= SHARED ROUTES ================= */}
          {currentPath === '/notifications' && (
            <NotificationsPage
              notifications={notifications}
              onSelectComplaintId={handleSelectComplaintById}
            />
          )}

          {currentPath === '/profile' && (
            <ProfilePage
              complaints={complaints}
              onNavigateToComplaints={() =>
                navigate(isAdmin ? '/admin/complaints' : '/student/complaints')
              }
            />
          )}
        </main>
      </div>

      {/* Global Quick Track Search Modal */}
      <QuickTrackModal
        isOpen={isQuickTrackOpen}
        onClose={() => setIsQuickTrackOpen(false)}
        onSelectComplaint={handleViewComplaint}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
