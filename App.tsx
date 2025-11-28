import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Deals } from "./pages/Deals";
import { Ongoing } from "./pages/Ongoing";
import { Agencies } from "./pages/Agencies";
import { AgencyDetail } from "./pages/AgencyDetail";
import { MyBrand } from "./pages/MyBrand";
import { Support } from "./pages/Support";

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
            <Route path="/login" element={<Login />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deals"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Deals />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ongoing"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Ongoing />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agencies"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Agencies />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agencies/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AgencyDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-brand"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MyBrand />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Support />
                  </DashboardLayout>
                </ProtectedRoute>
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
