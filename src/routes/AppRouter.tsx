import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { TopNav } from '../components/common/TopNav';
import { DemoControls } from '../components/common/DemoControls';
import { ToastContainer } from '../components/common/Toast';
import { AlertsModal } from '../components/common/AlertsModal';
import { NurseBottomNav } from '../components/nurse/NurseBottomNav';
import { DoctorSidebar } from '../components/doctor/DoctorSidebar';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { RoleRoute } from './RoleRoute';

// Pages
import { LoginWalkthroughPage } from '../pages/LoginWalkthroughPage';
import { NurseRoundsPage } from '../pages/NurseRoundsPage';
import { DoctorQueuePage } from '../pages/DoctorQueuePage';
import { DoctorPatientsPage } from '../pages/DoctorPatientsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminAdmissionsPage } from '../pages/AdminAdmissionsPage';
import { AdminDischargesPage } from '../pages/AdminDischargesPage';
import { AdminPatientsPage } from '../pages/AdminPatientsPage';
import { AdminStaffPage } from '../pages/AdminStaffPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';
import { AlertsPage } from '../pages/AlertsPage';

// Shared App Shell
const AppLayout: React.FC = () => {
  const { currentUser } = useStore();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-900 font-sans">
      <TopNav onOpenAlerts={() => setIsAlertsOpen(true)} />

      <div className="flex-1 flex">
        {currentUser.role === 'doctor' && <DoctorSidebar />}
        {currentUser.role === 'admin' && <AdminSidebar />}

        <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {currentUser.role === 'nurse' && (
        <NurseBottomNav onOpenAlerts={() => setIsAlertsOpen(true)} />
      )}

      <DemoControls />
      <ToastContainer />
      <AlertsModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
    </div>
  );
};

export const AppRouter: React.FC = () => {
  const { currentUser } = useStore();

  const getDefaultRedirect = () => {
    switch (currentUser.role) {
      case 'nurse':
        return '/rounds';
      case 'doctor':
        return '/doctor/queue';
      case 'admin':
        return '/admin/dashboard';
    }
  };

  return (
    <HashRouter>
      <Routes>
        {/* Login / Walkthrough Screen */}
        <Route path="/login" element={<LoginWalkthroughPage />} />

        {/* Application Layout */}
        <Route element={<AppLayout />}>
          {/* Default entry redirect */}
          <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

          {/* Nurse Routes */}
          <Route
            path="/rounds"
            element={
              <RoleRoute allowedRoles={['nurse', 'doctor', 'admin']}>
                <NurseRoundsPage />
              </RoleRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor/queue"
            element={
              <RoleRoute allowedRoles={['doctor']}>
                <DoctorQueuePage />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <RoleRoute allowedRoles={['doctor']}>
                <DoctorPatientsPage />
              </RoleRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['admin', 'doctor']}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/admissions"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminAdmissionsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/discharges"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminDischargesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminPatientsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminStaffPage />
              </RoleRoute>
            }
          />

          {/* Shared Routes */}
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};
