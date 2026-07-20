import axios from 'axios';
import api from './axios';
import type { ManagerAccount } from '../types';

interface ApiManager {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  currentSubscription?: {
    _id: string;
    plan?: string | { _id: string };
    status: string;
    endDate?: string;
  } | null;
}

function mapManager(manager: ApiManager): ManagerAccount {
  const plan = manager.currentSubscription?.plan;
  const planId = typeof plan === 'string' ? plan : plan?._id || '';

  return {
    id: manager._id,
    name: manager.name,
    email: manager.email,
    status: !manager.isVerified ? 'pending' : manager.isActive ? 'active' : 'inactive',
    planId,
  };
}

export async function getAllManagers(): Promise<ManagerAccount[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      count: number;
      managers: ApiManager[];
    }>('/api/user/managers');
    return (data.managers || []).map(mapManager);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function suspendManager(
  managerId: string,
  isActive: boolean,
  suspensionReason?: string
): Promise<{
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  suspensionReason?: string | null;
}> {
  const { data } = await api.put<{
    success: boolean;
    message: string;
    manager: {
      id: string;
      name: string;
      email: string;
      isActive: boolean;
      suspensionReason?: string | null;
    };
  }>(`/api/user/suspend/${managerId}`, {
    isActive,
    ...(isActive ? {} : { suspensionReason: suspensionReason?.trim() }),
  });
  return data.manager;
}

export async function deleteManager(managerId: string): Promise<void> {
  await api.delete(`/api/user/delete-manager/${managerId}`);
}
