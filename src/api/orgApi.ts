import api from './axios';
import type { Organization } from '../types';

export interface ApiOrganization {
  _id?: string;
  id?: string;
  name: string;
  address?: string;
  owner?:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
        role?: string;
      };
  createdAt?: string;
  updatedAt?: string;
}

export function mapApiOrganization(org: ApiOrganization): Organization {
  const owner = org.owner;
  const managerId =
    typeof owner === 'string'
      ? owner
      : owner?._id
        ? String(owner._id)
        : '';

  return {
    id: String(org._id || org.id),
    name: org.name,
    managerId,
    address: org.address || undefined,
    ownerName: typeof owner === 'object' ? owner?.name : undefined,
    ownerEmail: typeof owner === 'object' ? owner?.email : undefined,
  };
}

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await api.get<{
    success: boolean;
    count: number;
    organizations: ApiOrganization[];
  }>('/api/organization/my-organizations');
  return (data.organizations || []).map(mapApiOrganization);
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const { data } = await api.get<{
    success: boolean;
    count: number;
    organizations: ApiOrganization[];
  }>('/api/organization/all');
  return (data.organizations || []).map(mapApiOrganization);
}

export async function createOrganization(
  name: string,
  address?: string
): Promise<Organization> {
  const payload: { name: string; address?: string } = { name };
  if (address?.trim()) payload.address = address.trim();

  const { data } = await api.post<{
    success: boolean;
    message: string;
    organization: ApiOrganization;
  }>('/api/organization/create', payload);
  return mapApiOrganization(data.organization);
}

export async function updateOrganization(
  id: string,
  name: string,
  address?: string
): Promise<Organization> {
  const { data } = await api.put<{
    success: boolean;
    message: string;
    organization: {
      id: string;
      name: string;
      address?: string;
      owner: string;
    };
  }>(`/api/organization/update/${id}`, {
    name,
    address: address ?? '',
  });

  return {
    id: String(data.organization.id),
    name: data.organization.name,
    managerId: String(data.organization.owner),
    address: data.organization.address || undefined,
  };
}

export async function deleteOrganization(id: string): Promise<void> {
  await api.delete(`/api/organization/delete-org/${id}`);
}
