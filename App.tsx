import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AgencySidebar } from "./components/AgencySidebar";
import { AgencyDashboardLayout } from "./components/AgencyDashboardLayout";

// Public pages
import { Landing } from "./pages/public/Landing";
import { ForAgencies } from "./pages/public/ForAgencies";
import { Login } from "./pages/public/Login";
import { Onboarding } from "./pages/public/Onboarding";
import { Waitlist } from "./pages/public/Waitlist";

// Brand pages
import { Matches as BrandMatches } from "./pages/brand/Matches";
import { Proposals as BrandProposals } from "./pages/brand/Proposals";
import { Jobs } from "./pages/brand/Jobs";
import { JobDetail } from "./pages/brand/JobDetail";
import { CreateJob } from "./pages/brand/CreateJob";
import { Agencies } from "./pages/brand/Agencies";
import { AgencyDetail } from "./pages/brand/AgencyDetail";
import { Profile as BrandProfile } from "./pages/brand/Profile";
import { Support } from "./pages/brand/Support";

// Agency pages
import { Dashboard as AgencyDashboard } from "./pages/agency/Dashboard";
import { Matches as AgencyMatches } from "./pages/agency/Matches";
import { Proposals as AgencyProposals } from "./pages/agency/Proposals";
import { Projects as AgencyProjects } from "./pages/agency/Projects";
import { ProjectDetail as AgencyProjectDetail } from "./pages/agency/ProjectDetail";
import { Profile as AgencyProfile } from "./pages/agency/Profile";

// Shared pages
import { StripeOnboarding } from "./pages/shared/StripeOnboarding";

import { FEATURES, isWhitelistedEmail } from "./config/features";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If waitlist mode is enabled and user is not whitelisted, redirect to waitlist
  if (FEATURES.WAITLIST_MODE && user.email && !isWhitelistedEmail(user.email)) {
    return <Navigate to="/waitlist" replace />;
  }

  return <>{children}</>;
};

// Protected route that requires agency user type
const AgencyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading, isAgencyUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If not an agency user, redirect to business dashboard
  if (!isAgencyUser) {
    return <Navigate to="/deals" replace />;
  }

  return <>{children}</>;
};

// Protected route that requires business (brand) user type
const BrandProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading, isAgencyUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If waitlist mode is enabled and user is not whitelisted, redirect to waitlist
  if (FEATURES.WAITLIST_MODE && user.email && !isWhitelistedEmail(user.email)) {
    return <Navigate to="/waitlist" replace />;
  }

  // If agency user tries to access brand routes, redirect to agency dashboard
  if (isAgencyUser) {
    return <Navigate to="/agency" replace />;
  }

  return <>{children}</>;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col relative min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto scroll-smooth px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/for-agencies" element={<ForAgencies />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/signup" element={<Login initialMode="signup" />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route
              path="/deals"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <BrandMatches />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/proposals"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <BrandProposals />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/agencies"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <Agencies />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/agencies/:id"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <AgencyDetail />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/my-brand"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <BrandProfile />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <Support />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <Jobs />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/jobs/create"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <CreateJob />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <JobDetail />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            <Route
              path="/stripe-onboarding"
              element={
                <BrandProtectedRoute>
                  <DashboardLayout>
                    <StripeOnboarding />
                  </DashboardLayout>
                </BrandProtectedRoute>
              }
            />
            
            {/* Agency Portal Routes */}
            <Route
              path="/agency"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <AgencyDashboard />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/deals"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <AgencyMatches />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/proposals"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <AgencyProposals />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/jobs"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <AgencyProjects />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/jobs/:id"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <AgencyProjectDetail />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/payouts"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <StripeOnboarding />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/profile"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <AgencyProfile />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            <Route
              path="/agency/support"
              element={
                <AgencyProtectedRoute>
                  <AgencyDashboardLayout>
                    <Support />
                  </AgencyDashboardLayout>
                </AgencyProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
