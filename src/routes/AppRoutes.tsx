import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DevicePage } from '../pages/DevicePage';
import { ConsoleLayout } from '../components/layout/ConsoleLayout';
import { AdminPage } from '../admin/pages/AdminPage';
import { ManagerPage } from '../manager/pages/ManagerPage';
import { UserPage } from '../user/pages/UserPage';

function HomeRedirect() {
  const { role } = useAppContext();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/${role}`} replace />;
}

/**
 * App route map
 *
 * Public:  /login, /register
 * Console: /admin/:tab | /manager/:tab | /user/:tab  (wrapped in ConsoleLayout)
 * Device:  /device/:id
 */
export function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ConsoleLayout />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/:tab" element={<AdminPage />} />

          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/manager/:tab" element={<ManagerPage />} />

          <Route path="/user" element={<UserPage />} />
          <Route path="/user/:tab" element={<UserPage />} />
        </Route>

        <Route path="/device/:id" element={<DevicePage />} />

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
