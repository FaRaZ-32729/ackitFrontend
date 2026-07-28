import api from './axios';
import type { EnergyData } from '../types';

export type EnergyPeriod = keyof EnergyData;

export interface EnergySeriesPoint {
  label: string;
  kwh: number;
}

export interface DeviceEnergyRow {
  deviceId: string;
  deviceName: string;
  organizationId: string;
  organizationName: string;
  venueId: string;
  venueName: string;
  unitsKwh: number;
  sumCurrent: number;
  sampleCount: number;
  currentA: number;
  powerW: number;
  powerKw: number;
}

export interface DeviceEnergyResponse {
  success: boolean;
  period: EnergyPeriod;
  hours: number;
  sampleLimit: number;
  deviceCount: number;
  samplesFetched: number;
  sumCurrent: number;
  totalKwh: number;
  formula: {
    energyVoltageV: number;
    powerVoltageV: number;
    samplesPerHour: number;
    energyExpression: string;
    powerExpression: string;
  };
  series: EnergySeriesPoint[];
  devices: DeviceEnergyRow[];
}

/**
 * Fetch energy (kWh) + power for devices from DeviceCurrent time-series.
 * units = (207 × sum(current) / 1000) × (1/12)
 * power = latestCurrent × 230
 */
export async function getDeviceEnergy(
  deviceIds: string[],
  period: EnergyPeriod
): Promise<DeviceEnergyResponse> {
  if (!deviceIds.length) {
    return {
      success: true,
      period,
      hours: 0,
      sampleLimit: 0,
      deviceCount: 0,
      samplesFetched: 0,
      sumCurrent: 0,
      totalKwh: 0,
      formula: {
        energyVoltageV: 207,
        powerVoltageV: 230,
        samplesPerHour: 12,
        energyExpression: 'units_kWh = (207 × sum(current) / 1000) × (1/12)',
        powerExpression: 'power_W = current × 230',
      },
      series: [],
      devices: [],
    };
  }

  const { data } = await api.get<DeviceEnergyResponse>('/api/device/energy', {
    params: {
      deviceIds: deviceIds.join(','),
      period,
    },
  });

  return {
    ...data,
    devices: Array.isArray(data.devices) ? data.devices : [],
    series: Array.isArray(data.series) ? data.series : [],
  };
}
