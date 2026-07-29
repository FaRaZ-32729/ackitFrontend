import axios from 'axios';
import api from './axios';
import type { UserAccount } from '../types';

export interface CreateSubUserPayload {
  name: string;
  email: string;
  organizations: string[];
  venues?: string[];
}

export interface UpdateSubUserPayload {
  /** Organization Mongo IDs to assign (replaces existing list) */
  organizations: string[];
  /** Venue Mongo IDs to assign (replaces existing list; empty = none) */
  venues?: string[];
}

interface ApiSubUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  isActive?: boolean;
  isVerified?: boolean;
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
    };
  }>('/api/auth/register-user', {
    name: payload.name,
    email: payload.email,
    role: 'user',
    organizations: payload.organizations,
    venues: payload.venues || [],
  });

  return {
    id: String(data.user.id),
    name: data.user.name,
    email: data.user.email,
    status: 'pending',
    assignedVenueIds: payload.venues || [],
    organizationIds: payload.organizations,
    managerId: '',
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
  }>(`/api/user/update-user/${userId}`, {
    organizations: payload.organizations,
    venues: payload.venues || [],
  });

  return mapApiSubUser(data.user);
}

export async function deleteSubUser(userId: string): Promise<void> {
  await api.delete(`/api/user/delete-user/${userId}`);
}
