import api from './axios';
import type { ACUnit } from '../types';

export interface DeviceBrandOption {
  id: string;
  name: string;
}

interface ApiDevice {
  _id: string;
  deviceId: string;
  deviceName: string;
  organization: string | { _id: string; name?: string };
  venue: string | { _id: string; name?: string };
  brand: string | { _id: string; brandName?: string };
  capacity: number;
  status: 'online' | 'offline';
  state: 'on' | 'off';
  health?: 'healthy' | 'faulty';
  version: string;
  remote: 'lock' | 'unlock' | 'superlock';
  temperature: number;
  powerConsumption: number;
  apikey?: string;
}

const emptyEnergy = () => ({
  hourly: [{ label: '00:00', kwh: 0 }],
  daily: [{ label: new Date().toISOString().split('T')[0], kwh: 0 }],
  weekly: [{ label: 'Week 1', kwh: 0 }],
  monthly: [{ label: new Date().toISOString().slice(0, 7), kwh: 0 }],
  yearly: [{ label: new Date().getFullYear().toString(), kwh: 0 }],
});

export function mapApiDevice(device: ApiDevice): ACUnit {
  const venueId =
    typeof device.venue === 'string' ? device.venue : device.venue._id;
  const organizationId =
    typeof device.organization === 'string'
      ? device.organization
      : device.organization._id;
  const brandId =
    typeof device.brand === 'string' ? device.brand : device.brand._id;
  const brandName =
    typeof device.brand === 'string'
      ? ''
      : device.brand.brandName || '';

  const remote = device.remote || 'unlock';

  return {
    id: device._id,
    name: device.deviceName,
    venueId,
    organizationId,
    brandId,
    isOn: device.state === 'on',
    currentTemp: device.temperature ?? 16,
    targetTemp: device.temperature ?? 16,
    isLocked: remote === 'lock' || remote === 'superlock',
    eventLocked: remote === 'superlock',
    hasFault: device.health === 'faulty',
    brand: brandName,
    capacityTon: `${device.capacity}ton`,
    hasEnergySensor: true,
    powerConsumption: device.powerConsumption ?? 0,
    apiKey: device.apikey || '',
    energyConsumption: emptyEnergy(),
    // Events stay client-side / static for now
    events: [],
  };
}

function parseCapacityTon(capacityTon?: string): number {
  const n = Number(String(capacityTon || '1.5').replace(/ton/gi, '').trim());
  return [1, 1.5, 2, 2.5, 3, 3.5].includes(n) ? n : 1.5;
}

export async function getDeviceBrandOptions(): Promise<DeviceBrandOption[]> {
  const { data } = await api.get<{
    success: boolean;
    brands: Array<{ _id: string; brandName: string }>;
  }>('/api/device/brand-options');

  return (data.brands || []).map((brand) => ({
    id: String(brand._id),
    name: brand.brandName,
  }));
}

export async function getDevicesByVenue(venueId: string): Promise<ACUnit[]> {
  if (!venueId) return [];
  const { data } = await api.get<{
    success: boolean;
    count: number;
    devices: ApiDevice[];
  }>(`/api/device/by-venue/${venueId}`);

  return (data.devices || []).map(mapApiDevice);
}

export async function createDevice(payload: {
  name: string;
  organization: string;
  venue: string;
  brand: string;
  capacity: number;
}): Promise<ACUnit> {
  const { data } = await api.post<{
    success: boolean;
    device: ApiDevice;
  }>('/api/device/create', payload);

  return mapApiDevice(data.device);
}

export async function updateDevice(
  id: string,
  payload: {
    name: string;
    organization: string;
    venue: string;
    brand: string;
    capacity: number;
  }
): Promise<ACUnit> {
  const { data } = await api.put<{
    success: boolean;
    device: ApiDevice;
  }>(`/api/device/update/${id}`, payload);

  return mapApiDevice(data.device);
}

export async function deleteDevice(id: string): Promise<void> {
  await api.delete(`/api/device/delete/${id}`);
}

export async function setDevicePower(
  id: string,
  state: 'on' | 'off'
): Promise<{ requestedState: 'on' | 'off'; currentState: 'on' | 'off' }> {
  const { data } = await api.post<{
    success: boolean;
    requestedState: 'on' | 'off';
    currentState: 'on' | 'off';
  }>(`/api/device/power/${id}`, { state });

  return {
    requestedState: data.requestedState,
    currentState: data.currentState,
  };
}

export async function setDeviceTemperature(
  id: string,
  temperature: number
): Promise<{ requestedTemperature: number; currentTemperature: number }> {
  const { data } = await api.post<{
    success: boolean;
    requestedTemperature: number;
    currentTemperature: number;
  }>(`/api/device/temperature/${id}`, { temperature });

  return {
    requestedTemperature: data.requestedTemperature,
    currentTemperature: data.currentTemperature,
  };
}

export async function setDeviceRemote(
  id: string,
  remote: 'unlock' | 'lock' | 'superlock'
): Promise<{ remote: 'unlock' | 'lock' | 'superlock' }> {
  const { data } = await api.put<{
    success: boolean;
    remote: 'unlock' | 'lock' | 'superlock';
  }>(`/api/device/remote/${id}`, { remote });

  return { remote: data.remote };
}

export { parseCapacityTon };
