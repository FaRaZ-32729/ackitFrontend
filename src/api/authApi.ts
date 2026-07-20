import api from './axios';
import type { AuthUser } from '../types';

export type { AuthUser };

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  userId: string;
  email: string;
  otpExpiresAt: string;
}

export interface ManagerInviteResponse {
  success: boolean;
  message: string;
  otpExpiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'manager';
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  requiresPasswordSetup: boolean;
  setupToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'user';
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', {
    email,
    password,
  });
  return data;
}

export async function registerManager(
  name: string,
  email: string,
  password: string
): Promise<RegistrationResponse> {
  const { data } = await api.post<RegistrationResponse>('/api/auth/register', {
    name,
    email,
    password,
  });
  return data;
}

export async function createManagerByAdmin(
  name: string,
  email: string
): Promise<ManagerInviteResponse> {
  const { data } = await api.post<ManagerInviteResponse>('/api/auth/admin/register', {
    name,
    email,
  });
  return data;
}

export async function verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  const { data } = await api.post<VerifyOtpResponse>('/api/auth/verify-otp', {
    email,
    otp,
  });
  return data;
}

export async function resendOtp(email: string) {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    email: string;
    otpExpiresAt: string;
  }>(
    '/api/auth/resend-otp',
    { email }
  );
  return data;
}

export async function setPassword(token: string, password: string) {
  const { data } = await api.post<{ success: boolean; message: string; email: string }>(
    `/api/auth/set-password/${encodeURIComponent(token)}`,
    { password }
  );
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ success: boolean; message: string }>(
    '/api/auth/forgot-password',
    { email }
  );
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<{ success: boolean; message: string }>(
    `/api/auth/reset-password/${encodeURIComponent(token)}`,
    { password }
  );
  return data;
}

export async function getMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export async function logout() {
  const { data } = await api.delete('/api/auth/logout');
  return data;
}
