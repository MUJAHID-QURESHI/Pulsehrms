import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { Login } from "@/pages/auth/Login";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { EmployeeList } from "@/pages/employees/EmployeeList";
import { EmployeeForm } from "@/pages/employees/EmployeeForm";
import { EmployeeProfilePage } from "@/pages/employees/EmployeeProfilePage";
import { MyAttendance } from "@/pages/ess/MyAttendance";
import { ApplyLeave } from "@/pages/ess/ApplyLeave";
import { MyDocuments } from "@/pages/ess/MyDocuments";
import { TeamDirectory } from "@/pages/mss/TeamDirectory";
import { Approvals } from "@/pages/mss/Approvals";
import { Organization } from "@/pages/organization/Organization";
import { Notifications } from "@/pages/notifications/Notifications";
import { Settings } from "@/pages/settings/Settings";
import { Reports } from "@/pages/reports/Reports";
import { NotFound } from "@/pages/NotFound";

// Guard component for private routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm font-semibold font-heading animate-pulse">Loading workspace session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Guard component for auth pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Main Workspace Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* ESS (Employee Self Service) routes */}
        <Route path="/profile" element={<EmployeeProfilePage />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/apply-leave" element={<ApplyLeave />} />
        <Route path="/my-documents" element={<MyDocuments />} />
        
        {/* MSS (Manager Self Service) routes */}
        <Route path="/team" element={<TeamDirectory />} />
        <Route path="/approvals" element={<Approvals />} />
        
        {/* Employee Management directory routes */}
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/employees/add" element={<EmployeeForm />} />
        <Route path="/employees/edit/:id" element={<EmployeeForm />} />
        <Route path="/employees/:id" element={<EmployeeProfilePage />} />

        {/* Active MERN routes */}
        <Route path="/organization" element={<Organization />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
        
        {/* Catch-all private fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Global Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
