import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { ExploreMapView } from './views/ExploreMapView';
import { ReportWizardView } from './views/ReportWizardView';
import { CitizenTrackerView } from './views/CitizenTrackerView';
import { FieldOfficerView } from './views/FieldOfficerView';
import { SupervisorView } from './views/SupervisorView';
import { ManagerAnalyticsView } from './views/ManagerAnalyticsView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';
import { AppointmentBookingView } from './views/AppointmentBookingView';
import { IssueDetailModal } from './components/IssueDetailModal';

function MainLayout() {
  const { user, role, isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [appointmentPrefill, setAppointmentPrefill] = useState<{ issueId?: string; department?: string } | null>(null);

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      setCurrentTab('login');
      return;
    }
    setCurrentTab('report');
  };

  const handleSelectIssue = (issueOrId: any) => {
    if (typeof issueOrId === 'string') {
      setSelectedIssueId(issueOrId);
    } else if (issueOrId && issueOrId.id) {
      setSelectedIssueId(issueOrId.id);
    }
  };

  // Automatic role redirection after authenticated login
  const handleLoginSuccess = (userRole: string) => {
    switch (userRole) {
      case 'CITIZEN':
        setCurrentTab('tracker');
        break;
      case 'FIELD_OFFICER':
        setCurrentTab('officer');
        break;
      case 'DEPARTMENT_SUPERVISOR':
        setCurrentTab('supervisor');
        break;
      case 'DEPARTMENT_MANAGER':
        setCurrentTab('manager');
        break;
      case 'GOVERNMENT_ADMIN':
      case 'SUPER_ADMIN':
        setCurrentTab('admin');
        break;
      default:
        setCurrentTab('landing');
    }
  };

  // Route authorization guards
  const renderContent = () => {
    // 1. Login View
    if (currentTab === 'login') {
      return (
        <LoginView
          onSuccessRedirect={handleLoginSuccess}
          onNavigatePublic={() => setCurrentTab('landing')}
        />
      );
    }

    // 2. Landing View (Public)
    if (currentTab === 'landing') {
      return (
        <LandingView
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenReport={handleOpenReport}
          onOpenLogin={() => setCurrentTab('login')}
        />
      );
    }

    // 3. Civic Map (Public)
    if (currentTab === 'map') {
      return (
        <ExploreMapView
          onSelectIssue={handleSelectIssue}
          onOpenReport={handleOpenReport}
        />
      );
    }

    // 3.5. Appointment Booking & Supabase Integration (Public)
    if (currentTab === 'appointments') {
      return (
        <AppointmentBookingView
          onBackToHome={() => setCurrentTab('landing')}
          preselectedIssueId={appointmentPrefill?.issueId}
          preselectedDepartment={appointmentPrefill?.department}
        />
      );
    }

    // 4. Report Wizard (Requires Authentication)
    if (currentTab === 'report') {
      if (!isAuthenticated) {
        return (
          <LoginView
            onSuccessRedirect={() => setCurrentTab('report')}
            onNavigatePublic={() => setCurrentTab('landing')}
          />
        );
      }
      return (
        <ReportWizardView
          onSuccess={(issueId) => {
            setSelectedIssueId(issueId);
            setCurrentTab('tracker');
          }}
          onCancel={() => setCurrentTab('landing')}
        />
      );
    }

    // 5. Citizen Tracker (Requires Authentication)
    if (currentTab === 'tracker') {
      if (!isAuthenticated) {
        return (
          <LoginView
            onSuccessRedirect={() => setCurrentTab('tracker')}
            onNavigatePublic={() => setCurrentTab('landing')}
          />
        );
      }
      return (
        <CitizenTrackerView
          onSelectIssue={handleSelectIssue}
          onOpenReport={handleOpenReport}
          onOpenLogin={() => setCurrentTab('login')}
        />
      );
    }

    // 6. Field Officer Console (Requires FIELD_OFFICER or higher)
    if (currentTab === 'officer') {
      if (!isAuthenticated) {
        return (
          <LoginView
            onSuccessRedirect={handleLoginSuccess}
            onNavigatePublic={() => setCurrentTab('landing')}
          />
        );
      }
      const allowedRoles = ['FIELD_OFFICER', 'DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'];
      if (!role || !allowedRoles.includes(role)) {
        return (
          <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-rose-600">Access Denied</h3>
            <p className="text-xs text-slate-500">
              Your account ({role}) is not authorized to access Field Dispatch Operations.
            </p>
            <button
              onClick={() => setCurrentTab('landing')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Return to Overview
            </button>
          </div>
        );
      }
      return <FieldOfficerView onSelectIssue={handleSelectIssue} />;
    }

    // 7. Supervisor Console (Requires DEPARTMENT_SUPERVISOR or higher)
    if (currentTab === 'supervisor') {
      if (!isAuthenticated) {
        return (
          <LoginView
            onSuccessRedirect={handleLoginSuccess}
            onNavigatePublic={() => setCurrentTab('landing')}
          />
        );
      }
      const allowedRoles = ['DEPARTMENT_SUPERVISOR', 'DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'];
      if (!role || !allowedRoles.includes(role)) {
        return (
          <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-rose-600">Access Denied</h3>
            <p className="text-xs text-slate-500">
              Supervisor dashboard requires DEPARTMENT_SUPERVISOR or executive municipal privileges.
            </p>
            <button
              onClick={() => setCurrentTab('landing')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Return to Overview
            </button>
          </div>
        );
      }
      return <SupervisorView onSelectIssue={handleSelectIssue} />;
    }

    // 8. Manager Analytics (Requires DEPARTMENT_MANAGER or higher)
    if (currentTab === 'manager') {
      if (!isAuthenticated) {
        return (
          <LoginView
            onSuccessRedirect={handleLoginSuccess}
            onNavigatePublic={() => setCurrentTab('landing')}
          />
        );
      }
      const allowedRoles = ['DEPARTMENT_MANAGER', 'GOVERNMENT_ADMIN', 'SUPER_ADMIN'];
      if (!role || !allowedRoles.includes(role)) {
        return (
          <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-rose-600">Access Denied</h3>
            <p className="text-xs text-slate-500">
              Department Analytics requires DEPARTMENT_MANAGER, GOVERNMENT_ADMIN, or SUPER_ADMIN authorization.
            </p>
            <button
              onClick={() => setCurrentTab('landing')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Return to Overview
            </button>
          </div>
        );
      }
      return <ManagerAnalyticsView />;
    }

    // 9. Admin Console (Requires GOVERNMENT_ADMIN or SUPER_ADMIN)
    if (currentTab === 'admin') {
      if (!isAuthenticated) {
        return (
          <LoginView
            onSuccessRedirect={handleLoginSuccess}
            onNavigatePublic={() => setCurrentTab('landing')}
          />
        );
      }
      const allowedRoles = ['GOVERNMENT_ADMIN', 'SUPER_ADMIN'];
      if (!role || !allowedRoles.includes(role)) {
        return (
          <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-rose-600">Administrative Access Prohibited</h3>
            <p className="text-xs text-slate-500">
              Platform administration requires verified GOVERNMENT_ADMIN or SUPER_ADMIN security clearance.
            </p>
            <button
              onClick={() => setCurrentTab('landing')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Return to Overview
            </button>
          </div>
        );
      }
      return <AdminView />;
    }

    return (
      <LandingView
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenReport={handleOpenReport}
        onOpenLogin={() => setCurrentTab('login')}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onSelectIssue={handleSelectIssue}
        onOpenLogin={() => setCurrentTab('login')}
      />

      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Global Issue Inspection Modal */}
      {selectedIssueId && (
        <IssueDetailModal
          issueId={selectedIssueId}
          onClose={() => setSelectedIssueId(null)}
          onIssueUpdated={() => {}}
          onBookAppointment={(issueId, department) => {
            setAppointmentPrefill({ issueId, department });
            setSelectedIssueId(null);
            setCurrentTab('appointments');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
