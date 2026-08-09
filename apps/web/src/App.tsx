import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Dashboard } from './pages/Dashboard';

import { NewPatient } from './pages/Patients/NewPatient';
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
            <Route path="/" element={<Dashboard />} />
            
            {/* Profile Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/change-password" element={<ChangePassword />} />
            
            {/* Users Route */}
            <Route path="/users" element={<UsersList />} />
            
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<NewPatient />} />
            <Route path="/billing" element={<BillingList />} />
            <Route path="/billing/new" element={<NewBilling />} />
            <Route path="/test-counter" element={<TestCounter />} />
            <Route path="/reports" element={<ReportsList />} />
            <Route path="/doctors" element={<DoctorsList />} />
            <Route path="/doctors/new" element={<NewDoctor />} />
            <Route path="/doctors/:id" element={<DoctorDetails />} />
            <Route path="/doctors/:id/edit" element={<EditDoctor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/prescription" element={<Prescription />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/appointments" element={<AppointmentsList />} />
            <Route path="/appointments/create" element={<NewAppointment />} />
            <Route path="/appointments/:id" element={<AppointmentDetails />} />
            <Route path="/appointments/:id/edit" element={<EditAppointment />} />
            <Route path="/appointments/assign/:id" element={<AppointmentAssign />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
