import api from './axios';
import type { Venue } from '../types';
import axios from 'axios';

export interface ApiVenue {
  _id?: string;
  id?: string;
  name: string;
  organization?:
    | string
    | {
        _id: string;
        name?: string;
      };
  createdAt?: string;
  updatedAt?: string;
}

export function mapApiVenue(venue: ApiVenue): Venue {
  const organization = venue.organization;
  const orgId =
    typeof organization === 'string'
      ? organization
      : organization?._id
        ? String(organization._id)
        : '';

  return {
    id: String(venue._id || venue.id),
    name: venue.name,
    orgId,
    orgName: typeof organization === 'object' ? organization?.name : undefined,
  };
}

function isEmptyNotFound(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  const message = String(
    (err.response?.data as { message?: string } | undefined)?.message || ''
  ).toLowerCase();
  return status === 404 && message.includes('venue');
}

export async function getVenuesByOrganization(
  organizationId: string
): Promise<Venue[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      count: number;
      venues: ApiVenue[];
    }>(`/api/venue/get-by-org/${organizationId}`);
    return (data.venues || []).map(mapApiVenue);
  } catch (err) {
    if (isEmptyNotFound(err)) return [];
    throw err;
  }
}

export async function getMyVenues(organizationIds: string[]): Promise<Venue[]> {
  if (organizationIds.length === 0) return [];
  const batches = await Promise.all(
    organizationIds.map((orgId) => getVenuesByOrganization(orgId))
  );
  return batches.flat();
}

export async function getAllVenues(): Promise<Venue[]> {
  try {
    const { data } = await api.get<{
      success: boolean;
      count: number;
      venues: ApiVenue[];
    }>('/api/venue/all');
    return (data.venues || []).map(mapApiVenue);
  } catch (err) {
    if (isEmptyNotFound(err)) return [];
    throw err;
  }
}

export async function createVenue(
  name: string,
  organizationId: string
): Promise<Venue> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    venue: ApiVenue;
  }>('/api/venue/create', {
    name,
    organization: organizationId,
  });
  return mapApiVenue(data.venue);
}

export async function updateVenue(
  id: string,
  payload: { name?: string; organizationId?: string }
): Promise<Venue> {
  const body: { name?: string; organization?: string } = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.organizationId !== undefined) {
    body.organization = payload.organizationId;
  }

  const { data } = await api.put<{
    success: boolean;
    message: string;
    venue: ApiVenue;
  }>(`/api/venue/update/${id}`, body);
  return mapApiVenue(data.venue);
}

export async function deleteVenue(id: string): Promise<void> {
  await api.delete(`/api/venue/delete-venue/${id}`);
}
