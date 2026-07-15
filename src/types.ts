export type Role = 'admin' | 'manager' | 'user';

export interface SubscriptionPlan {
  id: string;
  name: string;
  maxOrgs: number;
  maxVenues: number;
  maxDevices: number;
  reportVisibility: ('hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly')[];
  planType?: 'free' | 'basic' | 'premium' | 'custom';
  description?: string;
  pricePkr?: number;
  durationDays?: number;
  maxUsers?: number;
}

export interface ManagerAccount {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  planId: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  assignedVenueIds: string[];
  managerId: string;
  subscriptionType?: string;
}

export interface Organization {
  id: string;
  name: string;
  managerId: string;
  address?: string;
  description?: string;
}

export interface Venue {
  id: string;
  name: string;
  orgId: string;
}

export interface ACEvent {
  id: string;
  name: string;
  time: string;
  endTime?: string;
  action: 'ON' | 'OFF' | 'SET_TEMP';
  targetTemp?: number;
  isRecurring: boolean;
  startDate?: string;
  endDate?: string;
  days: string[];
  enabled: boolean;
}

export interface EnergyData {
  hourly: { label: string; kwh: number }[];
  daily: { label: string; kwh: number }[];
  weekly: { label: string; kwh: number }[];
  monthly: { label: string; kwh: number }[];
  yearly: { label: string; kwh: number }[];
}

export interface ACUnit {
  id: string;
  name: string;
  venueId: string;
  isOn: boolean;
  currentTemp: number;
  targetTemp: number;
  isLocked: boolean;
  eventLocked: boolean;
  hasFault: boolean;
  energyConsumption: EnergyData;
  events: ACEvent[];
  brand?: string;
  hasEnergySensor?: boolean;
  capacityTon?: string;
}

export function getACPowerDraw(unit: ACUnit): { power: number; unitStr: string; energyToday: number } {
  const isSensorEnabled = unit.hasEnergySensor !== false; // default to true if undefined
  if (!isSensorEnabled) {
    return { power: 0, unitStr: '—', energyToday: 0 };
  }
  
  if (!unit.isOn) {
    return { power: 0.02, unitStr: 'kW', energyToday: 1.2 };
  }
  
  // Base power based on capacity
  let basePower = 1.3; // Default 1.5 Ton
  if (unit.capacityTon) {
    if (unit.capacityTon === '1ton') basePower = 0.9;
    else if (unit.capacityTon === '1.5ton' || unit.capacityTon === '1.5 ton') basePower = 1.3;
    else if (unit.capacityTon === '2ton' || unit.capacityTon === '2 ton') basePower = 1.8;
    else if (unit.capacityTon === '2.5ton' || unit.capacityTon === '2.5 ton') basePower = 2.2;
    else if (unit.capacityTon === '3.5ton' || unit.capacityTon === '3.5 ton') basePower = 3.2;
  }
  
  // Slight fluctuation based on target vs room temperature
  const tempDiff = Math.max(0, unit.currentTemp - unit.targetTemp);
  const loadFactor = tempDiff > 4 ? 1.15 : tempDiff > 1 ? 1.0 : 0.75;
  const power = Number((basePower * loadFactor).toFixed(2));
  
  // Calculate today's energy
  const hourlyData = unit.energyConsumption?.hourly || [];
  const energyToday = hourlyData.length > 0 
    ? Number(hourlyData.reduce((acc, h) => acc + h.kwh, 0).toFixed(1))
    : Number((power * 8.5).toFixed(1));
    
  return { power, unitStr: 'kW', energyToday };
}

