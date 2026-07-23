export type Role = 'admin' | 'manager' | 'user';

export interface SubscriptionPlan {
  id: string;
  name: string;
  maxOrgs: number;
  maxVenues: number;
  maxDevices: number;
  reportVisibility?: ('hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly')[];
  planType?: 'free' | 'basic' | 'premium' | 'custom';
  description?: string;
  pricePkr?: number;
  durationDays?: number;
  maxUsers?: number;
  assignedToEmail?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  permission?: string | null;
  currentSubscription?: string | null;
  assignedVenueIds?: string[];
  organizationIds?: string[];
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
  organizationIds?: string[];
  managerId: string;
  permission?: 'view' | 'manage';
  subscriptionType?: string;
}

export interface Organization {
  id: string;
  name: string;
  managerId: string;
  address?: string;
  ownerName?: string;
  ownerEmail?: string;
}

export interface Venue {
  id: string;
  name: string;
  orgId: string;
  orgName?: string;
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
  /** Backend healthAlert text when faulty (vent temp, etc.) */
  healthAlert?: string;
  energyConsumption: EnergyData;
  events: ACEvent[];
  brand?: string;
  hasEnergySensor?: boolean;
  capacityTon?: string;
  mode?: string;
  fanSpeed?: string;
  /** Line voltage set at device create/edit (default 230) */
  voltage?: number;
  /** Live measured current from ESP (A) */
  current?: number;
  /** Live / stored draw from DB (`powerConsumption`) in kW */
  powerConsumption?: number;
  /** Last DS18B20 vent/room reading from ESP (°C) */
  ventTemperature?: number | null;
  organizationId?: string;
  brandId?: string;
  /** Base64 of hardware deviceId (DB `apikey`) — read-only in UI */
  apiKey?: string;
  /** MQTT connectivity from backend */
  status?: 'online' | 'offline';
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

