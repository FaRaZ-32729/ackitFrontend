import axios from 'axios';
import api from './axios';
import type { UserAccount } from '../types';

export type UserPermission = 'view' | 'manage';

export interface CreateSubUserPayload {
  name: string;
  email: string;
  organizations: string[];
  venues?: string[];
  permission?: UserPermission;
}

export interface UpdateSubUserPayload {
  organizations?: string[];
  venues?: string[];
  permission?: UserPermission;
}

interface ApiSubUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  isActive?: boolean;
  isVerified?: boolean;
  permission?: string | null;
  creatorId?: string | { _id: string };
  organizations?: Array<string | { _id: string; name?: string }>;
  venues?: Array<{
    venueId?: string | { _id: string; name?: string };
    venueName?: string;
  }>;
}

function mapVenueId(entry: {
  venueId?: string | { _id: string; name?: string };
  venueName?: string;
}): string | null {
  const venueId = entry.venueId;
  if (!venueId) return null;
  if (typeof venueId === 'string') return venueId;
  return venueId._id ? String(venueId._id) : null;
}

function mapOrgId(
  org: string | { _id: string; name?: string }
): string {
  return typeof org === 'string' ? org : String(org._id);
}

export function mapApiSubUser(user: ApiSubUser): UserAccount {
  const creator = user.creatorId;
  const managerId =
    typeof creator === 'string'
      ? creator
      : creator?._id
        ? String(creator._id)
        : '';

  const assignedVenueIds = (user.venues || [])
    .map((venue) => mapVenueId(venue))
    .filter((id): id is string => Boolean(id));

  const organizationIds = (user.organizations || []).map(mapOrgId);

  let status: UserAccount['status'] = 'pending';
  if (user.isVerified) {
    status = user.isActive ? 'active' : 'inactive';
  }

  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    status,
    assignedVenueIds,
    organizationIds,
    managerId,
    permission:
      user.permission === 'manage' || user.permission === 'view'
        ? user.permission
        : 'view',
  };
}

export async function getUsersByManager(
  managerId: string
): Promise<UserAccount[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      count: number;
      subUsers: ApiSubUser[];
    }>(`/api/user/manager/${managerId}`);
    return (data.subUsers || []).map(mapApiSubUser);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function createSubUser(
  payload: CreateSubUserPayload
): Promise<UserAccount> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      permission?: string | null;
    };
  }>('/api/auth/register-user', {
    name: payload.name,
    email: payload.email,
    role: 'user',
    organizations: payload.organizations,
    venues: payload.venues || [],
    permission: payload.permission || 'view',
  });

  return {
    id: String(data.user.id),
    name: data.user.name,
    email: data.user.email,
    status: 'pending',
    assignedVenueIds: payload.venues || [],
    organizationIds: payload.organizations,
    managerId: '',
    permission:
      data.user.permission === 'manage' || data.user.permission === 'view'
        ? data.user.permission
        : payload.permission || 'view',
  };
}

export async function updateSubUser(
  userId: string,
  payload: UpdateSubUserPayload
): Promise<UserAccount> {
  const { data } = await api.put<{
    success: boolean;
    message: string;
    user: ApiSubUser;
  }>(`/api/user/update-user/${userId}`, payload);

  return mapApiSubUser(data.user);
}

export async function deleteSubUser(userId: string): Promise<void> {
  await api.delete(`/api/user/delete-user/${userId}`);
}
