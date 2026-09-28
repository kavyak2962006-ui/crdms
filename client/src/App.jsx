import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public Auth Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentRegistration from './pages/StudentRegistration';
import HRRegistration from './pages/HRRegistration';

// Role Dashboards & Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentSecondaryProfile from './pages/StudentSecondaryProfile';
import StudentDrives from './pages/StudentDrives';

import HRDashboard from './pages/HRDashboard';
import TPODashboard from './pages/TPODashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminDrives from './pages/AdminDrives';
import DashboardLayout from './components/DashboardLayout';
import UserRoleManagement from './pages/UserRoleManagement';
import HRApproval from './pages/HRApproval';
import CompanyProfile from './pages/CompanyProfile';
import SettingsPage from './pages/SettingsPage';

// Guard Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<StudentRegistration />} />
        <Route path="/register-hr" element={<HRRegistration />} />

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/secondary-profile" element={<StudentSecondaryProfile />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/drives" element={<StudentDrives />} />
        </Route>

        {/* Protected HR Routes */}
        <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/company-profile" element={<DashboardLayout pageTitle="Company Profile"><CompanyProfile /></DashboardLayout>} />
        </Route>

        {/* Protected TPO Routes */}
        <Route element={<ProtectedRoute allowedRoles={['tpo']} />}>
          <Route path="/tpo/dashboard" element={<TPODashboard />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/drives" element={<AdminDrives />} />
          <Route path="/admin/hr-approval" element={<HRApproval />} />
          <Route path="/admin/users" element={<UserRoleManagement />} />
        </Route>

        {/* Global Settings Route */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'hr', 'tpo', 'admin']} />}>
          <Route path="/settings" element={<DashboardLayout pageTitle="Settings"><SettingsPage /></DashboardLayout>} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
