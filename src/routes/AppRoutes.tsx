import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VerifyOtpPage } from '../pages/VerifyOtpPage';
import { SetPasswordPage } from '../pages/SetPasswordPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { BuyPlanPage } from '../pages/BuyPlanPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DevicePage } from '../pages/DevicePage';
import { ConsoleLayout } from '../components/layout/ConsoleLayout';
import { AdminPage } from '../admin/pages/AdminPage';
import { ManagerPage } from '../manager/pages/ManagerPage';
import { UserPage } from '../user/pages/UserPage';
import { LandingPage } from '../components/landing/LandingPage';

/**
 * App route map
 *
 * Public:  / (landing), /login, /register
 * Auth:    /subscribe (manager plan gate)
 * Console: /admin/:tab | /manager/:tab | /user/:tab  (wrapped in ConsoleLayout)
 * Device:  /device/:id
 */
export function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/setup-password/:token" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/subscribe" element={<BuyPlanPage />} />

        <Route element={<ConsoleLayout />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/:tab" element={<AdminPage />} />

          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/manager/:tab" element={<ManagerPage />} />

          <Route path="/user" element={<UserPage />} />
          <Route path="/user/:tab" element={<UserPage />} />
        </Route>

        <Route path="/device/:id" element={<DevicePage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
