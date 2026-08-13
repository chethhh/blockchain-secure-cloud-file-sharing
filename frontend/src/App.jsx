import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';

import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import MyFiles from './pages/MyFiles';
import SharedFiles from './pages/SharedFiles';
import UploadFile from './pages/UploadFile';
import FileDetails from './pages/FileDetails';
import Profile from './pages/Profile';
import ActivityLogs from './pages/ActivityLogs';
import AdminPanel from './pages/AdminPanel';

// Main App Layout Wrapper for authenticated views
const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-files" element={<MyFiles />} />
                <Route path="/shared-files" element={<SharedFiles />} />
                <Route path="/files/:id" element={<FileDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/activity" element={<ActivityLogs />} />

                {/* Upload Route: Restricted to Admin and Editor roles */}
                <Route element={<RoleRoute allowedRoles={['Admin', 'Editor']} />}>
                  <Route path="/upload" element={<UploadFile />} />
                </Route>

                {/* Admin Route: Restricted strictly to Admin role */}
                <Route element={<RoleRoute allowedRoles={['Admin']} />}>
                  <Route path="/admin" element={<AdminPanel />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
