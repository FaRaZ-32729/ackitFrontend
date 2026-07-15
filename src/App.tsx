import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './admin/pages/AdminPage';
import { ManagerPage } from './manager/pages/ManagerPage';
import { UserPage } from './user/pages/UserPage';
import { DevicePage } from './pages/DevicePage';
import { ConsoleLayout } from './components/ConsoleLayout';
import { NotFoundPage } from './pages/NotFoundPage';

function HomeRedirect() {
  const { role } = useAppContext();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/${role}`} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Secure Console Layout Routes */}
          <Route element={<ConsoleLayout />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/:tab" element={<AdminPage />} />
            
            <Route path="/manager" element={<ManagerPage />} />
            <Route path="/manager/:tab" element={<ManagerPage />} />
            
            <Route path="/user" element={<UserPage />} />
            <Route path="/user/:tab" element={<UserPage />} />
          </Route>

          {/* Device Detail Route */}
          <Route path="/device/:id" element={<DevicePage />} />

          {/* Home Redirect & 404 Pages */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
