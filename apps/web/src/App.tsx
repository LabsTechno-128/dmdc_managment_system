import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Dashboard } from './pages/Dashboard';

const RootRedirect = () => {
  const { user } = useAuthStore();
  if (user?.role === 'lab_technician') {
    return <Navigate to="/test-counter" replace />;
  }
  if (user?.role === 'receptionist') {
    return <Navigate to="/appointments" replace />;
  }
  return <Dashboard />;
};

import { NewPatient } from './pages/Patients/NewPatient';
import { EditPatient } from './pages/Patients/EditPatient';
import { DoctorsList } from './pages/Doctors/DoctorsList';
import { NewDoctor } from './pages/Doctors/NewDoctor';
import { EditDoctor } from './pages/Doctors/EditDoctor';
import { DoctorDetails } from './pages/Doctors/DoctorDetails';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile/Profile';
import { EditProfile } from './pages/Profile/EditProfile';
import { ChangePassword } from './pages/Profile/ChangePassword';
import { UsersList } from './pages/Users/UsersList';
import { ProtectedRoute } from './layout/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { api } from './lib/api';

import Patients from './pages/Patients/Patients';
import Layout from './layout/Layout';

import { BillingList } from './pages/Billing/BillingList';
import { NewBilling } from './pages/Billing/NewBilling';
import { ReportsList } from './pages/Reports/ReportsList';
import { TestCounter } from './pages/TestCounter/TestCounter';
import { Settings } from './pages/Settings/Settings';
import Prescription from './pages/test-prescription/page';
import { TermsAndConditions } from './pages/TermsAndConditions/TermsAndConditions';
import { AppointmentsList } from './pages/Appointments/AppointmentsList';
import { NewAppointment } from './pages/Appointments/NewAppointment';
import { AppointmentDetails } from './pages/Appointments/AppointmentDetails';
import { EditAppointment } from './pages/Appointments/EditAppointment';
import AppointmentAssign from './pages/Appointments/AppointmentAssign';
import Labtest from './pages/Labtest/Labtest';
import { Placeholder } from './pages/Placeholder';

const queryClient = new QueryClient();

function App() {
  const { token, setUser, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user during init:', err);
          logout();
        }
      }
      setIsInitializing(false);
    };
    initAuth();
  }, []); // Only run once on mount

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Initializing...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            
            {/* General Authenticated Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/change-password" element={<ChangePassword />} />
            <Route path="/prescription" element={<Prescription />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

            {/* Root Route */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'lab_technician', 'receptionist']} />}>
              <Route path="/" element={<RootRedirect />} />
            </Route>

            {/* Receptionist Modules (Shared with Admin/SuperAdmin) */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} />}>
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/new" element={<NewPatient />} />
              <Route path="/patients/:id/edit" element={<EditPatient />} />
              <Route path="/billing" element={<BillingList />} />
              <Route path="/billing/new" element={<NewBilling />} />
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/appointments" element={<AppointmentsList />} />
              <Route path="/appointments/create" element={<NewAppointment />} />
              <Route path="/appointments/:id" element={<AppointmentDetails />} />
              <Route path="/appointments/:id/edit" element={<EditAppointment />} />
              <Route path="/appointments/assign/:id" element={<AppointmentAssign />} />
              <Route path="/doctors-fee" element={<Placeholder title="Doctor's Fee" />} />
            </Route>

            {/* Super Admin & Admin Shared Routes (No Receptionist) */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
              <Route path="/inventory" element={<Placeholder title="Inventory" />} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/income" element={<Placeholder title="Income" />} />
              <Route path="/expense" element={<Placeholder title="Expense" />} />
            </Route>

            {/* Super Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/users" element={<UsersList />} />
              <Route path="/doctors" element={<DoctorsList />} />
              <Route path="/doctors/new" element={<NewDoctor />} />
              <Route path="/doctors/:id" element={<DoctorDetails />} />
              <Route path="/doctors/:id/edit" element={<EditDoctor />} />
              <Route path="/lab-test" element={<Labtest />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/accounts" element={<Placeholder title="Accounts" />} />
            </Route>

            {/* Lab Technician Routes (Sample Collection) */}
            <Route element={<ProtectedRoute allowedRoles={['lab_technician', 'super_admin']} />}>
              <Route path="/test-counter" element={<TestCounter />} />
              <Route path="/reagents" element={<Placeholder title="Re-agents & Sample Pots" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
