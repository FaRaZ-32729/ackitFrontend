import React, { useState } from 'react';
import { ACUnit, Role, UserAccount, Organization, Venue, EnergyData, getACPowerDraw } from '../types';
import { Dashboard } from './Dashboard';
import { Reports } from './Reports';
import { EnergyChart } from './EnergyChart';
import { ACBrandManagement } from './ACBrandManagement';
import { 
  Users, User, Building2, MapPin, MonitorSmartphone, Plus, Edit, Trash2, 
  Activity, ChevronDown, ChevronUp, Check, Lock, Unlock, 
  AlertTriangle, CheckCircle2, Download, Filter, Clock, History, Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Modal } from './Modal';
import { motion, AnimatePresence } from 'motion/react';

export const AC_BRANDS = [
  'Daikin',
  'Mitsubishi Electric',
  'Panasonic',
  'Toshiba',
  'Carrier',
  'LG',
  'Samsung',
  'Gree'
];

interface ManagerViewProps {
  units: ACUnit[];
  users: UserAccount[];
  orgs: Organization[];
  venues: Venue[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSelectUnit: (id: string) => void;
  onTogglePower: (id: string) => void;
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onAddOrg: (org: Omit<Organization, 'id'>) => void;
  onAddVenue: (venue: Omit<Venue, 'id'>) => void;
  onAddDevice: (device: Omit<ACUnit, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (id: string, data: Partial<UserAccount>) => void;
  onDeleteOrg: (id: string) => void;
  onUpdateOrg: (id: string, data: Partial<Organization>) => void;
  onDeleteVenue: (id: string) => void;
  onUpdateVenue: (id: string, data: Partial<Venue>) => void;
  onDeleteDevice: (id: string) => void;
  onUpdateDevice: (id: string, data: Partial<ACUnit>) => void;
}

export function ManagerView({
  units,
  users,
  orgs,
  venues,
  activeTab,
  onTabChange,
  onSelectUnit,
  onTogglePower,
  onAddUser,
  onAddOrg,
  onAddVenue,
  onAddDevice,
  onDeleteUser,
  onUpdateUser,
  onDeleteOrg,
  onUpdateOrg,
  onDeleteVenue,
  onUpdateVenue,
  onDeleteDevice,
  onUpdateDevice,
}: ManagerViewProps) {
  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserStep, setAddUserStep] = useState<'details' | 'success'>('details');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserStatus, setNewUserStatus] = useState<'active' | 'inactive'>('active');
  const [newUserVenues, setNewUserVenues] = useState<string[]>([]);

  // New Org Form State
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgAddress, setNewOrgAddress] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');

  // New Venue Form State
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueOrgId, setNewVenueOrgId] = useState(orgs[0]?.id || '');

  // New Device Form State
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceOrgId, setNewDeviceOrgId] = useState('');
  const [newDeviceVenueId, setNewDeviceVenueId] = useState('');
  const [newDeviceBrand, setNewDeviceBrand] = useState('Daikin');
  const [newDeviceEnergySensor, setNewDeviceEnergySensor] = useState(true);
  const [newDeviceCapacity, setNewDeviceCapacity] = useState('1.5ton');

  // Edit State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editingDevice, setEditingDevice] = useState<ACUnit | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'user' | 'org' | 'venue' | 'device' | null>(null);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [selectedDeviceVenueId, setSelectedDeviceVenueId] = useState<string>('all');
  const [selectedVenueOrgId, setSelectedVenueOrgId] = useState<string>('all');
  const [venueTempInputs, setVenueTempInputs] = useState<Record<string, string>>({});
  const [tempSuccess, setTempSuccess] = useState<Record<string, boolean>>({});
  const [deviceTempInputs, setDeviceTempInputs] = useState<Record<string, string>>({});
  const [deviceTempSuccess, setDeviceTempSuccess] = useState<Record<string, boolean>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeDetailType, setActiveDetailType] = useState<'venues' | 'devices' | 'events' | null>(null);
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserAccount | null>(null);

  // Energy Monitoring State for Overview
  const [energyFilterType, setEnergyFilterType] = useState<'org' | 'venue'>('org');
  const [selectedEnergyId, setSelectedEnergyId] = useState<string>('all');
  const [energyView, setEnergyView] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  React.useEffect(() => {
    if (showAddDevice) {
      const defaultOrgId = orgs[0]?.id || '';
      setNewDeviceOrgId(defaultOrgId);
      const filteredVenues = venues.filter(v => v.orgId === defaultOrgId);
      setNewDeviceVenueId(filteredVenues[0]?.id || venues[0]?.id || '');
      setNewDeviceName('');
      setNewDeviceBrand('Daikin');
      setNewDeviceEnergySensor(true);
      setNewDeviceCapacity('1.5ton');
    }
  }, [showAddDevice, orgs, venues]);

  // Aggregated Data for Overview
  const filteredUnits = React.useMemo(() => {
    return units.filter(unit => {
      if (selectedEnergyId === 'all') return true;
      if (energyFilterType === 'org') {
        const venue = venues.find(v => v.id === unit.venueId);
        return venue?.orgId === selectedEnergyId;
      }
      return unit.venueId === selectedEnergyId;
    });
  }, [units, venues, energyFilterType, selectedEnergyId]);

  const aggregatedEnergyData = React.useMemo(() => {
    const result: EnergyData = {
      hourly: [],
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };

    if (filteredUnits.length === 0) return result;

    // Initialize with labels from the first unit
    const firstUnit = filteredUnits[0];
    (['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const).forEach((period) => {
      if (firstUnit.energyConsumption[period]) {
        result[period] = firstUnit.energyConsumption[period].map((item) => ({
          label: item.label,
          kwh: 0,
        }));
      }
    });

    // Sum up the values
    filteredUnits.forEach((unit) => {
      (['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const).forEach((period) => {
        if (unit.energyConsumption[period]) {
          unit.energyConsumption[period].forEach((item, index) => {
            if (result[period] && result[period][index]) {
              result[period][index].kwh += item.kwh;
            }
          });
        }
      });
    });

    return result;
  }, [filteredUnits]);

  // Mock Runtime Data based on filtered units and selected view
  const runtimeStats = React.useMemo(() => {
    if (filteredUnits.length === 0) return [];
    
    // Use labels from aggregated energy data for consistency
    const labels = aggregatedEnergyData[energyView].map(d => d.label);
    
    return labels.map(label => ({
      label,
      // Mock hours: correlate slightly with energy but keep it realistic (0-24h)
      hours: Math.min(24, Math.max(0, (aggregatedEnergyData[energyView].find(d => d.label === label)?.kwh || 0) / (filteredUnits.length * 1.5) + (Math.random() * 2)))
    }));
  }, [filteredUnits, aggregatedEnergyData, energyView]);

  const faultyDevices = React.useMemo(() => {
    return filteredUnits.filter(u => u.hasFault).map(unit => {
      const venue = venues.find(v => v.id === unit.venueId);
      const org = orgs.find(o => o.id === venue?.orgId);
      return {
        ...unit,
        venueName: venue?.name || 'Unknown Venue',
        orgName: org?.name || 'Unknown Org'
      };
    });
  }, [filteredUnits, venues, orgs]);

  const handleDownloadReport = () => {
    const headers = ['Period', 'Label', 'Energy (kWh)'];
    const rows: string[] = [];
    
    (['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const).forEach((period) => {
      if (aggregatedEnergyData[period]) {
        aggregatedEnergyData[period].forEach(item => {
          rows.push(`${period},${item.label},${item.kwh.toFixed(2)}`);
        });
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filterName = selectedEnergyId === 'all' ? 'All' : 
      (energyFilterType === 'org' ? orgs.find(o => o.id === selectedEnergyId)?.name : venues.find(v => v.id === selectedEnergyId)?.name);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `energy_report_${filterName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Event Modal State
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventDeviceId, setEventDeviceId] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventTemp, setEventTemp] = useState('22');
  const [eventIsRecurring, setEventIsRecurring] = useState(false);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventDays, setEventDays] = useState<string[]>([]);
  const [eventIsOnOff, setEventIsOnOff] = useState(false);
  const [eventOnOffAction, setEventOnOffAction] = useState<'ON' | 'OFF'>('ON');
  const [eventTime, setEventTime] = useState('08:00');

  const handleAddUser = () => {
    if (addUserStep === 'details') {
      if (!newUserName || !newUserEmail) return;
      setAddUserStep('success');
      onAddUser({
        name: newUserName,
        email: newUserEmail,
        status: 'pending',
        assignedVenueIds: newUserVenues,
        managerId: 'mgr-1', // Mock manager ID
      });
      setTimeout(() => {
        closeAddUserModal();
      }, 3000);
    }
  };

  const toggleUser = (id: string) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  const toggleVenueRow = (id: string) => {
    setExpandedVenueId(expandedVenueId === id ? null : id);
  };

  const openUserDetailModal = (user: UserAccount, type: 'venues' | 'devices' | 'events') => {
    setSelectedUserForModal(user);
    setActiveDetailType(type);
  };

  const closeUserDetailModal = () => {
    setSelectedUserForModal(null);
    setActiveDetailType(null);
  };

  const closeAddUserModal = () => {
    setShowAddUser(false);
    setTimeout(() => {
      setAddUserStep('details');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserVenues([]);
    }, 300);
  };

  const handleAddOrg = () => {
    onAddOrg({
      name: newOrgName,
      address: newOrgAddress,
      description: newOrgDescription,
      managerId: 'mgr-1',
    });
    setShowAddOrg(false);
    setNewOrgName('');
    setNewOrgAddress('');
    setNewOrgDescription('');
  };

  const handleAddVenue = () => {
    onAddVenue({
      name: newVenueName,
      orgId: newVenueOrgId,
    });
    setShowAddVenue(false);
    setNewVenueName('');
  };

  const handleAddDevice = () => {
    if (!newDeviceName || !newDeviceVenueId) return;
    onAddDevice({
      name: newDeviceName,
      venueId: newDeviceVenueId,
      isOn: false,
      currentTemp: 24,
      targetTemp: 22,
      isLocked: false,
      eventLocked: false,
      hasFault: false,
      brand: newDeviceBrand,
      hasEnergySensor: newDeviceEnergySensor,
      capacityTon: newDeviceCapacity,
      events: [],
      energyConsumption: {
        hourly: [{ label: '00:00', kwh: 0 }],
        daily: [{ label: new Date().toISOString().split('T')[0], kwh: 0 }],
        weekly: [{ label: 'Week 1', kwh: 0 }],
        monthly: [{ label: new Date().toISOString().slice(0, 7), kwh: 0 }],
        yearly: [{ label: new Date().getFullYear().toString(), kwh: 0 }]
      }
    });
    setShowAddDevice(false);
    setNewDeviceName('');
  };

  const closeAddEventModal = () => {
    setShowAddEventModal(false);
    setEventDeviceId('');
    setEventName('');
    setEventTemp('22');
    setEventIsRecurring(false);
    setEventStartDate('');
    setEventEndDate('');
    setEventDays([]);
    setEventIsOnOff(false);
    setEventOnOffAction('ON');
    setEventTime('08:00');
  };

  const handleAddEvent = () => {
    if (!eventDeviceId || !eventName || !eventTime) return;
    
    const device = units.find(u => u.id === eventDeviceId);
    if (!device) return;

    const newEvent = {
      id: `evt-${Date.now()}`,
      name: eventName,
      time: eventTime,
      action: eventIsOnOff ? eventOnOffAction : 'SET_TEMP' as const,
      targetTemp: eventIsOnOff ? undefined : parseInt(eventTemp),
      isRecurring: eventIsRecurring,
      startDate: !eventIsRecurring ? eventStartDate : undefined,
      endDate: !eventIsRecurring ? eventEndDate : undefined,
      days: eventIsRecurring ? eventDays : [],
      enabled: true,
    };

    onUpdateDevice(eventDeviceId, {
      events: [...device.events, newEvent]
    });

    closeAddEventModal();
  };

  const toggleVenue = (vId: string) => {
    setNewUserVenues((prev) =>
      prev.includes(vId) ? prev.filter((id) => id !== vId) : [...prev, vId]
    );
  };

  return (
    <div className={`w-full ${
      (activeTab === 'dashboard' || activeTab === 'overview' || activeTab === 'organizations' || activeTab === 'venues' || activeTab === 'users' || activeTab === 'devices')
        ? 'max-w-none h-full flex flex-col overflow-hidden px-0 py-0 space-y-0' 
        : 'max-w-6xl mx-auto p-6 space-y-8'
    }`}>
      {activeTab === 'overview' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/15 custom-scrollbar flex flex-col min-h-0">
          
          {/* Dashboard Header Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] block mb-1">Campus Command Hub</span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600 shrink-0" />
                SSUET Central Overview
              </h1>
              <p className="text-xs text-slate-500 mt-1">Real-time centralized telemetry, environmental monitoring, and climate automation metrics</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => setShowAddUser(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Operator
              </button>
              <button
                onClick={() => setShowAddDevice(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add AC Unit
              </button>
            </div>
          </div>

          {/* Core Telemetry Stats Cards (Ribbon Layout) - Streamlined to 4 vital indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Active AC Units Ratio */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Climate Zones</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {units.filter(u => u.isOn).length} <span className="text-xs font-bold text-slate-400">/ {units.length} ON</span>
                </p>
              </div>
            </div>

            {/* Stat 2: Live Drawing Power */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Power Demand</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {(units.filter(u => u.isOn).length * 1.5).toFixed(1)} <span className="text-xs font-bold text-slate-400">kW</span>
                </p>
              </div>
            </div>

            {/* Stat 3: Average Room Temp */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mean Room Temp</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {units.filter(u => u.isOn).length > 0 
                    ? (units.filter(u => u.isOn).reduce((acc, u) => acc + u.currentTemp, 0) / units.filter(u => u.isOn).length).toFixed(1)
                    : '24.0'}°C
                </p>
              </div>
            </div>

            {/* Stat 4: Active Alerts / Faults */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
              <div { ...{ className: `p-3 rounded-xl transition-transform ${units.some(u => u.hasFault) ? 'bg-red-50 text-red-600 animate-bounce' : 'bg-emerald-50 text-emerald-600'}` } }>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grid Diagnostics</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {units.filter(u => u.hasFault).length > 0 ? (
                    <span className="text-red-600">{units.filter(u => u.hasFault).length} Faulty</span>
                  ) : (
                    <span className="text-emerald-600">100% Healthy</span>
                  )}
                </p>
              </div>
            </div>

          </div>

          {/* Primary Operations Dashboard Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (8-span) */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* Streamlined Campus Energy Analytics */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity className="w-4 h-4" />
                      </div>
                      Campus Energy Consumption Analytics
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Monitored electrical load across individual department infrastructures</p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <select
                        value={selectedEnergyId}
                        onChange={(e) => {
                          setSelectedEnergyId(e.target.value);
                          setEnergyFilterType(e.target.value === 'all' ? 'org' : 'venue');
                        }}
                        className="w-full sm:w-48 py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 appearance-none transition-all cursor-pointer text-slate-700 hover:bg-slate-100"
                      >
                        <option value="all">Entire Campus (All Rooms)</option>
                        {venues.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      CSV
                    </button>
                  </div>
                </div>

                <div className="h-[260px] w-full">
                  <EnergyChart 
                    data={aggregatedEnergyData} 
                    view={energyView}
                    onViewChange={setEnergyView}
                  />
                </div>
              </div>

              {/* Central SSUET Climate Zones Table */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MapPin className="w-4 h-4" />
                      </div>
                      Live Venue Performance Breakdown
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active rooms & department telemetries</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl">
                    {venues.length} Zones Active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider text-left">
                        <th className="py-2.5">Venue Location</th>
                        <th className="py-2.5">Operating Ratio</th>
                        <th className="py-2.5">Mean Temp</th>
                        <th className="py-2.5">Health Status</th>
                        <th className="py-2.5 text-right">Quick Power Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {venues.map(v => {
                        const venueUnits = units.filter(u => u.venueId === v.id);
                        const activeCount = venueUnits.filter(u => u.isOn).length;
                        const hasFault = venueUnits.some(u => u.hasFault);
                        const meanTempVal = activeCount > 0 
                          ? (venueUnits.filter(u => u.isOn).reduce((acc, u) => acc + u.currentTemp, 0) / activeCount).toFixed(1) + '°C'
                          : '--';
                        const isAllOn = venueUnits.length > 0 && venueUnits.every(u => u.isOn);

                        return (
                          <tr key={v.id} className="hover:bg-slate-50/50 transition-all text-xs font-bold text-slate-700">
                            <td className="py-3 font-black text-slate-900">{v.name}</td>
                            <td className="py-3 text-slate-500">
                              <span className="text-slate-800">{activeCount}</span> / {venueUnits.length} Devices
                            </td>
                            <td className="py-3 font-black text-blue-600">{meanTempVal}</td>
                            <td className="py-3">
                              {hasFault ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                                  <AlertTriangle className="w-3 h-3 animate-pulse" />
                                  Needs Maintenance
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                  <Check className="w-3 h-3" />
                                  Optimal
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    venueUnits.forEach(u => {
                                      if (onUpdateDevice) onUpdateDevice(u.id, { isOn: true });
                                    });
                                  }}
                                  disabled={isAllOn}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] uppercase font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  All ON
                                </button>
                                <button
                                  onClick={() => {
                                    venueUnits.forEach(u => {
                                      if (onUpdateDevice) onUpdateDevice(u.id, { isOn: false });
                                    });
                                  }}
                                  disabled={activeCount === 0}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] uppercase font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  All OFF
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column (4-span) - Unified Smart Campus Climate Co-Pilot widget */}
            <div className="xl:col-span-4 space-y-6">
              
              <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white p-6 rounded-3xl space-y-6 shadow-md border border-slate-800">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Smart Climate Co-Pilot</span>
                  </div>
                  <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">SSUET AI</span>
                </div>

                {(() => {
                  const coldOnUnits = units.filter(u => u.isOn && u.targetTemp < 24);
                  const isAnyCold = coldOnUnits.length > 0;
                  const faultySensorUnits = faultyDevices;
                  const hasAnyAlert = isAnyCold || faultySensorUnits.length > 0;

                  if (!hasAnyAlert) {
                    return (
                      <div className="text-center py-6 flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                          <Check className="w-8 h-8" />
                        </div>
                        <h4 className="text-sm font-black text-white">Climate Grid Optimized</h4>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                          All SSUET campus AC units are active within energy-efficient levels (≥24°C) and all hardware checks are 100% operational.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {/* Section 1: Temperature Eco Optimization */}
                      {isAnyCold && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="text-amber-400 font-extrabold">{coldOnUnits.length} SSUET zones</span> are set cooling below the recommended eco-efficient threshold (<span className="text-white font-bold">24°C</span>).
                          </p>
                          <button
                            onClick={() => {
                              units.forEach(u => {
                                if (u.isOn && u.targetTemp < 24 && onUpdateDevice) {
                                  onUpdateDevice(u.id, { targetTemp: 24 });
                                }
                              });
                            }}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center shadow-lg shadow-blue-900/30"
                          >
                            Set All to Eco-Temp (24°C)
                          </button>
                        </div>
                      )}

                      {/* Section 2: Sensor Health & Quick Fix */}
                      {faultySensorUnits.length > 0 && (
                        <div className={`space-y-3 ${isAnyCold ? 'pt-4 border-t border-slate-800' : ''}`}>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            We detected <span className="text-red-400 font-extrabold">{faultySensorUnits.length} units</span> with sensor connectivity or ventilation faults.
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                            {faultySensorUnits.map(device => (
                              <div key={device.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-all">
                                <div className="truncate max-w-[120px]">
                                  <p className="font-extrabold text-slate-200 truncate">{device.name}</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 truncate">{device.venueName || 'AC Unit'}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => onSelectUnit(device.id)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black uppercase rounded"
                                  >
                                    Diagnose
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (onUpdateDevice) {
                                        onUpdateDevice(device.id, { hasFault: false });
                                      }
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase rounded"
                                  >
                                    Calibrate
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard
          units={units}
          role="manager"
          onSelectUnit={onSelectUnit}
          onTogglePower={onTogglePower}
          orgs={orgs}
          venues={venues}
          onUpdateDevice={onUpdateDevice}
          onViewDevicesOfVenue={(venueId) => {
            setSelectedDeviceVenueId(venueId);
            if (onTabChange) {
              onTabChange('devices');
            }
          }}
        />
      )}

      {activeTab === 'reports' && <Reports units={units} />}

      {activeTab === 'ac-brands' && (
        <div className="space-y-6">
          <ACBrandManagement />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="flex-1 flex flex-col min-h-0 p-6 bg-slate-50/15 overflow-hidden select-none">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                User Management
              </h3>
            </div>
          </div>

          {/* Scrollable Table Component Box */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col scrollbar-thin">
            {users.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Users Found</span>
                <p className="text-xs text-slate-400 max-w-[200px]">Create or invite users to assign them permissions</p>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/50 sticky top-0 backdrop-blur-md z-10 text-left">
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6">Name</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 hidden sm:table-cell">Email</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 hidden sm:table-cell">Venues</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 hidden sm:table-cell">Devices</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 hidden sm:table-cell">Events</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-[11px] sm:text-xs text-slate-700">
                    {users.map((user) => {
                      const userVenues = venues.filter(v => user.assignedVenueIds.includes(v.id));
                      const userUnits = units.filter(u => user.assignedVenueIds.includes(u.venueId));
                      const userEvents = userUnits.reduce((acc, u) => acc + u.events.length, 0);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/30 transition-all">
                          <td className="py-2 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-black text-slate-900">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                              </div>
                              <div className="flex flex-col truncate max-w-[140px] sm:max-w-none">
                                <span className="font-extrabold text-slate-900">{user.name}</span>
                                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                                  {user.status === 'pending' ? 'Pending Onboarding' : user.status}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 sm:py-4 sm:px-6 text-slate-500 font-medium hidden sm:table-cell">
                            {user.email}
                          </td>
                          <td className="py-2 px-4 sm:py-4 sm:px-6 hidden sm:table-cell">
                            <button
                              onClick={() => openUserDetailModal(user, 'venues')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all text-xs font-black inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{userVenues.length}</span>
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Venues</span>
                            </button>
                          </td>
                          <td className="py-2 px-4 sm:py-4 sm:px-6 hidden sm:table-cell">
                            <button
                              onClick={() => openUserDetailModal(user, 'devices')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all text-xs font-black inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{userUnits.length}</span>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Devices</span>
                            </button>
                          </td>
                          <td className="py-2 px-4 sm:py-4 sm:px-6 hidden sm:table-cell">
                            <button
                              onClick={() => openUserDetailModal(user, 'events')}
                              className="px-2.5 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-all text-xs font-black inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{userEvents}</span>
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Events</span>
                            </button>
                          </td>
                          <td className="py-2 px-4 sm:py-4 sm:px-6 text-right">
                            <div className="flex justify-end gap-1 sm:gap-1.5">
                              <button 
                                onClick={() => setEditingUser(user)}
                                className="p-1.5 sm:px-2.5 sm:py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setDeletingId(user.id);
                                  setDeleteType('user');
                                }}
                                className="p-1.5 sm:px-2.5 sm:py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'organizations' && (
        <div className="flex-1 flex flex-col min-h-0 p-6 bg-slate-50/15 overflow-hidden select-none">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                Organization Management
              </h3>
            </div>
          </div>

          {/* Scrollable Table Component Box */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col scrollbar-thin">
            {orgs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Organizations Found</span>
                <p className="text-xs text-slate-400 max-w-[200px]">Create an organization to start mapping venues and climate zones</p>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle overflow-x-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/50 sticky top-0 backdrop-blur-md z-10 text-left">
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6">Organization</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-right">
                        <span className="hidden sm:inline">Quick </span>Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-[11px] sm:text-xs text-slate-700">
                    {orgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="py-2 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-black text-slate-900">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </div>
                            <span className="font-extrabold text-slate-900 truncate max-w-[140px] sm:max-w-none">
                              {org.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4 sm:py-4 sm:px-6 text-right">
                          <div className="flex justify-end gap-1 sm:gap-1.5">
                            <button 
                              onClick={() => setEditingOrg(org)}
                              className="p-1.5 sm:px-2.5 sm:py-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingId(org.id);
                                setDeleteType('org');
                              }}
                              className="p-1.5 sm:px-2.5 sm:py-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'venues' && (
        <div className="flex-1 flex flex-col min-h-0 p-6 bg-slate-50/15 overflow-hidden select-none">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                Venue Management
              </h3>
            </div>

            {/* Filter */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-500/80" />
              <select 
                value={selectedVenueOrgId}
                onChange={(e) => setSelectedVenueOrgId(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-blue-500 rounded-full text-xs sm:text-sm font-black text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="all">All Organizations</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-500/80 pointer-events-none" />
            </div>
          </div>

          {/* Scrollable Table Component Box */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col scrollbar-thin">
            {venues.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Venues Found</span>
                <p className="text-xs text-slate-400 max-w-[200px]">Create a venue to start mapping devices and climate zones</p>
              </div>
            ) : venues.filter((venue) => selectedVenueOrgId === 'all' || venue.orgId === selectedVenueOrgId).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Matching Venues</span>
                <p className="text-xs text-slate-400 max-w-[200px]">No venues matched your current filter criteria</p>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/50 sticky top-0 backdrop-blur-md z-10 text-left">
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6">Venue Name</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-[11px] sm:text-xs text-slate-700">
                    {venues
                      .filter((venue) => selectedVenueOrgId === 'all' || venue.orgId === selectedVenueOrgId)
                      .map((venue) => {
                        return (
                          <tr key={venue.id} className="hover:bg-slate-50/30 transition-all">
                            <td className="py-2 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-black text-slate-900">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                </div>
                                <span className="font-extrabold text-slate-900 truncate max-w-[140px] sm:max-w-none">{venue.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4 sm:py-4 sm:px-6 text-right">
                              <div className="flex justify-end gap-1 sm:gap-1.5">
                                <button 
                                  onClick={() => setEditingVenue(venue)}
                                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeletingId(venue.id);
                                    setDeleteType('venue');
                                  }}
                                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="flex-1 flex flex-col min-h-0 p-6 bg-slate-50/15 overflow-hidden select-none">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                Device Management
              </h3>
            </div>
            
            {/* Filter */}
            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedDeviceVenueId}
                onChange={(e) => setSelectedDeviceVenueId(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="all">All Venues</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Scrollable Table Component Box */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col scrollbar-thin">
            {units.filter(unit => selectedDeviceVenueId === 'all' || unit.venueId === selectedDeviceVenueId).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MonitorSmartphone className="w-12 h-12 text-slate-300 mb-3" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Devices Found</span>
                <p className="text-xs text-slate-400 max-w-[200px]">No hardware devices matched your current filter criteria</p>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/50 sticky top-0 backdrop-blur-md z-10 text-left">
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6">Device Name</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 hidden sm:table-cell">Venue</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-center hidden sm:table-cell">Temp Setpoint</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-center hidden sm:table-cell">Power Status</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-center hidden sm:table-cell">Power Draw</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-center hidden sm:table-cell">Lock Status</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-center hidden sm:table-cell">Diagnostics</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-center hidden sm:table-cell">Schedules</th>
                      <th className="py-3 px-4 sm:py-3.5 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-[11px] sm:text-xs text-slate-700">
                    {units
                      .filter(unit => selectedDeviceVenueId === 'all' || unit.venueId === selectedDeviceVenueId)
                      .map((unit) => {
                        const isExpanded = expandedDeviceId === unit.id;
                        const associatedVenue = venues.find(v => v.id === unit.venueId);
                        
                        const currentInputVal = deviceTempInputs[unit.id] ?? unit.targetTemp.toString();
                        const parsedInputVal = parseInt(currentInputVal);
                        const isTempValid = !isNaN(parsedInputVal) && parsedInputVal >= 16 && parsedInputVal <= 30;
                        const hasTempChanged = currentInputVal !== unit.targetTemp.toString();

                        const handleApplyTemp = () => {
                          if (deviceTempSuccess[unit.id]) return;
                          onUpdateDevice(unit.id, { targetTemp: parsedInputVal });
                          setDeviceTempSuccess(prev => ({ ...prev, [unit.id]: true }));
                          setDeviceTempInputs(prev => ({ ...prev, [unit.id]: parsedInputVal.toString() }));
                        };

                        return (
                          <React.Fragment key={unit.id}>
                            <tr className="hover:bg-slate-50/30 transition-all">
                              <td className="py-2 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-black text-slate-900">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <MonitorSmartphone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                  </div>
                                  <span className="font-extrabold text-slate-900 truncate max-w-[140px] sm:max-w-none">{unit.name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 text-slate-500 hidden sm:table-cell">
                                {associatedVenue?.name || <span className="text-slate-300 italic font-semibold">No Venue</span>}
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 hidden sm:table-cell">
                                <div className="flex justify-center">
                                  <div className={`flex items-center bg-slate-50 border border-slate-200 rounded-full p-0.5 shadow-sm ${!unit.isOn ? 'opacity-40 grayscale' : ''}`}>
                                    <button 
                                      onClick={() => {
                                        if (!unit.isOn) return;
                                        const currentVal = parseInt(currentInputVal) || unit.targetTemp;
                                        const newVal = Math.max(16, currentVal - 1);
                                        setDeviceTempInputs(prev => ({ ...prev, [unit.id]: newVal.toString() }));
                                        if (deviceTempSuccess[unit.id]) {
                                          setDeviceTempSuccess(prev => ({ ...prev, [unit.id]: false }));
                                        }
                                      }}
                                      disabled={!unit.isOn}
                                      className={`w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white rounded-full transition-all font-black text-xs ${!unit.isOn ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                                    >
                                      -
                                    </button>
                                    <div className="relative flex items-center justify-center w-12">
                                      <input 
                                        type="number"
                                        min="16"
                                        max="30"
                                        value={currentInputVal}
                                        disabled={!unit.isOn}
                                        onChange={(e) => {
                                          let rawVal = e.target.value;
                                          if (rawVal !== '') {
                                            const val = parseInt(rawVal);
                                            if (!isNaN(val)) {
                                              if (val > 30) rawVal = '30';
                                              else if (val < 16 && rawVal.length >= 2) rawVal = '16';
                                            }
                                          }
                                          setDeviceTempInputs(prev => ({ ...prev, [unit.id]: rawVal }));
                                          if (deviceTempSuccess[unit.id]) {
                                            setDeviceTempSuccess(prev => ({ ...prev, [unit.id]: false }));
                                          }
                                        }}
                                        onBlur={() => {
                                          let val = parseInt(currentInputVal);
                                          if (isNaN(val) || val < 16) val = 16;
                                          if (val > 30) val = 30;
                                          setDeviceTempInputs(prev => ({ ...prev, [unit.id]: val.toString() }));
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && hasTempChanged && isTempValid) {
                                            handleApplyTemp();
                                          }
                                        }}
                                        className={`w-full text-center font-black text-xs text-slate-800 bg-transparent outline-none no-spin ${!unit.isOn ? 'cursor-not-allowed' : ''} ${((hasTempChanged && isTempValid) || deviceTempSuccess[unit.id]) ? 'pr-4 pl-0.5' : 'px-0.5'}`}
                                      />
                                      <AnimatePresence>
                                        {((hasTempChanged && isTempValid) || deviceTempSuccess[unit.id]) && (
                                          <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ 
                                              opacity: 1, 
                                              scale: deviceTempSuccess[unit.id] ? [1, 1.2, 1] : 1,
                                              backgroundColor: deviceTempSuccess[unit.id] ? "#10b981" : "#d1fae5",
                                              color: deviceTempSuccess[unit.id] ? "#ffffff" : "#059669"
                                            }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.3 }}
                                            onClick={handleApplyTemp}
                                            disabled={!unit.isOn}
                                            className={`absolute right-0 p-0.5 rounded-full shadow-sm ${!unit.isOn ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            title={deviceTempSuccess[unit.id] ? "Applied!" : "Apply Temperature"}
                                          >
                                            <Check className="w-2.5 h-2.5" />
                                          </motion.button>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        if (!unit.isOn) return;
                                        const currentVal = parseInt(currentInputVal) || unit.targetTemp;
                                        const newVal = Math.min(30, currentVal + 1);
                                        setDeviceTempInputs(prev => ({ ...prev, [unit.id]: newVal.toString() }));
                                        if (deviceTempSuccess[unit.id]) {
                                          setDeviceTempSuccess(prev => ({ ...prev, [unit.id]: false }));
                                        }
                                      }}
                                      disabled={!unit.isOn}
                                      className={`w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white rounded-full transition-all font-black text-xs ${!unit.isOn ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 text-center hidden sm:table-cell">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => onTogglePower(unit.id)}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${unit.isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                  >
                                    <span className={`absolute text-[9px] font-black text-white ${unit.isOn ? 'left-2' : 'right-2'}`}>
                                      {unit.isOn ? 'ON' : 'OFF'}
                                    </span>
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${unit.isOn ? 'translate-x-8' : 'translate-x-1'}`} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 hidden sm:table-cell">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1 text-xs font-black text-slate-800">
                                    <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                                    {unit.hasEnergySensor !== false ? (
                                      <span>{getACPowerDraw(unit).power} kW</span>
                                    ) : (
                                      <span className="text-slate-400 font-semibold italic text-[10px]">Offline</span>
                                    )}
                                  </div>
                                  {unit.hasEnergySensor !== false && (
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                      {getACPowerDraw(unit).energyToday} kWh today
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 hidden sm:table-cell">
                                <div className="flex justify-center">
                                  <div className="relative inline-block w-32">
                                    <button 
                                      onClick={() => setOpenDropdownId(openDropdownId === unit.id ? null : unit.id)}
                                      disabled={!unit.isOn}
                                      className={`flex items-center justify-between w-full bg-white border border-slate-200 text-slate-700 text-[11px] font-black rounded-xl p-2 shadow-sm transition-all ${!unit.isOn ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-blue-300 cursor-pointer'}`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        {unit.isLocked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
                                        {unit.isLocked ? 'Locked' : 'Unlocked'}
                                      </span>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    
                                    <AnimatePresence>
                                      {openDropdownId === unit.id && unit.isOn && (
                                        <motion.div 
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden"
                                        >
                                          <button
                                            onClick={() => { onUpdateDevice(unit.id, { isLocked: false }); setOpenDropdownId(null); }}
                                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                          >
                                            <Unlock className="w-3.5 h-3.5 text-emerald-500" /> Unlocked
                                          </button>
                                          <button
                                            onClick={() => { onUpdateDevice(unit.id, { isLocked: true }); setOpenDropdownId(null); }}
                                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                          >
                                            <Lock className="w-3.5 h-3.5 text-red-500" /> Locked
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 text-center hidden sm:table-cell">
                                <div className="flex justify-center">
                                  {unit.hasFault ? (
                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50" title="Faulty - Control Active">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                      <span className="text-[10px] font-black uppercase">Faulty</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50" title="Healthy">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-black uppercase">Healthy</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 text-center hidden sm:table-cell">
                                <div className="flex justify-center">
                                  <button 
                                    onClick={() => setExpandedDeviceId(isExpanded ? null : unit.id)}
                                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-black inline-flex items-center gap-1 cursor-pointer ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  >
                                    <span>{unit.events?.length || 0}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Events</span>
                                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-4 sm:py-4 sm:px-6 text-right">
                                <div className="flex justify-end gap-1 sm:gap-1.5">
                                  <button onClick={() => setEditingDevice(unit)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit Device">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => { setDeletingId(unit.id); setDeleteType('device'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete Device">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Events Area */}
                            {isExpanded && (
                              <tr className="bg-slate-50/40">
                                <td colSpan={9} className="px-6 py-4 border-b border-slate-100">
                                  <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-2xl p-5 shadow-inner">
                                    <div className="flex justify-between items-center mb-4">
                                      <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        Scheduled Climatic Events ({unit.events?.length || 0})
                                      </h5>
                                      <button 
                                        onClick={() => {
                                          setEventDeviceId(unit.id);
                                          setShowAddEventModal(true);
                                        }}
                                        className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Event
                                      </button>
                                    </div>
                                    {unit.events && unit.events.length > 0 ? (
                                      <div className="space-y-2">
                                        {unit.events.map(event => (
                                          <div key={event.id} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/70 flex justify-between items-center">
                                            <div>
                                              <p className="font-bold text-slate-800 text-xs">{event.name || 'Event'} - {event.time}</p>
                                              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                                {event.isRecurring 
                                                  ? event.days.join(', ') 
                                                  : `${event.startDate || ''} to ${event.endDate || ''}`}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                                event.action === 'ON' ? 'bg-emerald-100 text-emerald-700' :
                                                event.action === 'OFF' ? 'bg-slate-200 text-slate-700' :
                                                'bg-blue-100 text-blue-700'
                                              }`}>
                                                {event.action} {event.targetTemp ? `${event.targetTemp}°C` : ''}
                                              </span>
                                              <button 
                                                onClick={() => {
                                                  onUpdateDevice(unit.id, {
                                                    events: unit.events.map(e => e.id === event.id ? { ...e, enabled: !e.enabled } : e)
                                                  });
                                                }}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${event.enabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                                              >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${event.enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 text-center font-semibold">No automated schedules configured for this device.</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals placed at root level so they can be opened from any tab */}
      <Modal
        isOpen={!!selectedUserForModal}
        onClose={closeUserDetailModal}
        title={
          activeDetailType === 'venues' ? `Assigned Venues: ${selectedUserForModal?.name}` :
          activeDetailType === 'devices' ? `Accessible Devices: ${selectedUserForModal?.name}` :
          activeDetailType === 'events' ? `Created Events: ${selectedUserForModal?.name}` :
          'Details'
        }
      >
        <div className="max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
          {activeDetailType === 'venues' && selectedUserForModal && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">List of venues this user has permission to manage.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {venues.filter(v => selectedUserForModal.assignedVenueIds.includes(v.id)).map((v) => (
                  <div key={v.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-blue-900">{v.name}</span>
                  </div>
                ))}
                {venues.filter(v => selectedUserForModal.assignedVenueIds.includes(v.id)).length === 0 && (
                  <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">No venues assigned to this user.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDetailType === 'devices' && selectedUserForModal && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">Devices available to this user based on assigned venues.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {units.filter(u => selectedUserForModal.assignedVenueIds.includes(u.venueId)).map((u) => {
                  const venue = venues.find(v => v.id === u.venueId);
                  return (
                    <div key={u.id} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                          <MonitorSmartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">{u.name}</p>
                          <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">{venue?.name}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${u.isOn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                    </div>
                  );
                })}
                {units.filter(u => selectedUserForModal.assignedVenueIds.includes(u.venueId)).length === 0 && (
                  <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">No devices accessible to this user.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDetailType === 'events' && selectedUserForModal && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">Scheduled events and automations created for accessible devices.</p>
              <div className="space-y-3">
                {units
                  .filter(u => selectedUserForModal.assignedVenueIds.includes(u.venueId))
                  .flatMap(u => u.events.map(e => ({ ...e, deviceName: u.name })))
                  .map((event, idx) => (
                    <div key={idx} className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-purple-900">{event.time}</p>
                            <span className="text-[10px] px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full font-bold uppercase tracking-wider">{event.action}</span>
                          </div>
                          <p className="text-xs text-purple-600 mt-0.5 font-medium">{event.days.join(', ')} • <span className="font-bold">{event.deviceName}</span></p>
                        </div>
                      </div>
                      {event.targetTemp && (
                        <div className="text-right">
                          <p className="text-xl font-black text-purple-700">{event.targetTemp}°</p>
                          <p className="text-[10px] text-purple-400 uppercase font-bold">Target</p>
                        </div>
                      )}
                    </div>
                  ))}
                {units.filter(u => selectedUserForModal.assignedVenueIds.includes(u.venueId)).flatMap(u => u.events).length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">No events found for this user.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAddUser}
        onClose={closeAddUserModal}
        title={
          addUserStep === 'details' ? "Create New User" :
          "Success"
        }
      >
        <div className="space-y-4">
          {addUserStep === 'details' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter user's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={newUserStatus}
                  onChange={(e) => setNewUserStatus(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Venues</label>
                <div className="flex flex-wrap gap-2">
                  {venues.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => toggleVenue(v.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        newUserVenues.includes(v.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={closeAddUserModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUserName || !newUserEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </>
          )}

          {addUserStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Invite Sent!</h3>
              <p className="text-slate-500">An onboarding link has been sent to the user's email. They will appear as "Pending Onboarding" until they join.</p>
            </div>
          )}
        </div>
      </Modal>
      
      <Modal
        isOpen={showAddOrg}
        onClose={() => setShowAddOrg(false)}
        title="Add Organization"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
            <input
              type="text"
              value={newOrgAddress}
              onChange={(e) => setNewOrgAddress(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="123 Business St, City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              value={newOrgDescription}
              onChange={(e) => setNewOrgDescription(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              placeholder="Brief description of the organization"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowAddOrg(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOrg}
              disabled={!newOrgName}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Save Organization
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddVenue}
        onClose={() => setShowAddVenue(false)}
        title="Add Venue"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name</label>
            <input
              type="text"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Main Office"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
            <select
              value={newVenueOrgId}
              onChange={(e) => setNewVenueOrgId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowAddVenue(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVenue}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Venue
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddDevice}
        onClose={setShowAddDevice}
        title="Add Device"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Device Name</label>
            <input
              type="text"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
              placeholder="e.g. SSUET Seminar Hall AC"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Select Organization</label>
            <select
              value={newDeviceOrgId}
              onChange={(e) => {
                const orgId = e.target.value;
                setNewDeviceOrgId(orgId);
                const filtered = venues.filter(v => v.orgId === orgId);
                setNewDeviceVenueId(filtered[0]?.id || '');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold cursor-pointer text-slate-800"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Select Venue</label>
            <select
              value={newDeviceVenueId}
              onChange={(e) => setNewDeviceVenueId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold cursor-pointer text-slate-800"
            >
              {venues.filter(v => v.orgId === newDeviceOrgId).map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
              {venues.filter(v => v.orgId === newDeviceOrgId).length === 0 && (
                <option value="">No venues available in this organization</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Brand</label>
            <select
              value={newDeviceBrand}
              onChange={(e) => setNewDeviceBrand(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold cursor-pointer text-slate-800"
            >
              {AC_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Capacity</label>
            <select
              value={newDeviceCapacity}
              onChange={(e) => setNewDeviceCapacity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold cursor-pointer text-slate-800"
            >
              <option value="1ton">1.0 Ton</option>
              <option value="1.5ton">1.5 Ton</option>
              <option value="2ton">2.0 Ton</option>
              <option value="2.5ton">2.5 Ton</option>
              <option value="3.5ton">3.5 Ton</option>
            </select>
          </div>
          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="newDeviceEnergySensor"
              checked={newDeviceEnergySensor}
              onChange={(e) => setNewDeviceEnergySensor(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-200 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="newDeviceEnergySensor" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer select-none">
              Enable Energy Monitoring Sensor
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowAddDevice(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDevice}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Device
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={editingUser.status}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Venues</label>
              <div className="flex flex-wrap gap-2">
                {venues.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      const newIds = editingUser.assignedVenueIds.includes(v.id)
                        ? editingUser.assignedVenueIds.filter(id => id !== v.id)
                        : [...editingUser.assignedVenueIds, v.id];
                      setEditingUser({ ...editingUser, assignedVenueIds: newIds });
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      editingUser.assignedVenueIds.includes(v.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateUser(editingUser.id, editingUser);
                  setEditingUser(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Update User
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Org Modal */}
      <Modal
        isOpen={!!editingOrg}
        onClose={() => setEditingOrg(null)}
        title="Edit Organization"
      >
        {editingOrg && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editingOrg.name}
                onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
              <input
                type="text"
                value={editingOrg.address || ''}
                onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingOrg(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateOrg(editingOrg.id, editingOrg);
                  setEditingOrg(null);
                }}
                disabled={!editingOrg.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                Update Organization
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Venue Modal */}
      <Modal
        isOpen={!!editingVenue}
        onClose={() => setEditingVenue(null)}
        title="Edit Venue"
      >
        {editingVenue && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name</label>
              <input
                type="text"
                value={editingVenue.name}
                onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
              <select
                value={editingVenue.orgId}
                onChange={(e) => setEditingVenue({ ...editingVenue, orgId: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingVenue(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateVenue(editingVenue.id, editingVenue);
                  setEditingVenue(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Update Venue
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Device Modal */}
      <Modal
        isOpen={!!editingDevice}
        onClose={() => setEditingDevice(null)}
        title="Edit Device"
      >
        {editingDevice && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Device Name</label>
              <input
                type="text"
                value={editingDevice.name}
                onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
              <select
                value={editingDevice.venueId}
                onChange={(e) => setEditingDevice({ ...editingDevice, venueId: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{orgs.find(o => o.id === v.orgId)?.name || 'Campus'} - {v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Brand</label>
              <select
                value={editingDevice.brand || 'Daikin'}
                onChange={(e) => setEditingDevice({ ...editingDevice, brand: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold cursor-pointer"
              >
                {AC_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Capacity</label>
              <select
                value={editingDevice.capacityTon || '1.5ton'}
                onChange={(e) => setEditingDevice({ ...editingDevice, capacityTon: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold cursor-pointer"
              >
                <option value="1ton">1.0 Ton</option>
                <option value="1.5ton">1.5 Ton</option>
                <option value="2ton">2.0 Ton</option>
                <option value="2.5ton">2.5 Ton</option>
                <option value="3.5ton">3.5 Ton</option>
              </select>
            </div>
            <div className="flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="editDeviceEnergySensor"
                checked={editingDevice.hasEnergySensor !== false}
                onChange={(e) => setEditingDevice({ ...editingDevice, hasEnergySensor: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-200 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="editDeviceEnergySensor" className="text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer select-none">
                Enable Energy Monitoring Sensor
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingDevice(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateDevice(editingDevice.id, editingDevice);
                  setEditingDevice(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Update Device
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => {
          setDeletingId(null);
          setDeleteType(null);
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <Activity className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">Are you sure you want to delete this {deleteType}? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setDeletingId(null);
                setDeleteType(null);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deletingId && deleteType) {
                  if (deleteType === 'user') onDeleteUser(deletingId);
                  else if (deleteType === 'org') onDeleteOrg(deletingId);
                  else if (deleteType === 'venue') onDeleteVenue(deletingId);
                  else if (deleteType === 'device') onDeleteDevice(deletingId);
                }
                setDeletingId(null);
                setDeleteType(null);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={closeAddEventModal}
        title="Add Device Event"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Morning Start"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Device</label>
            <select
              value={eventDeviceId}
              onChange={(e) => setEventDeviceId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">Select a device...</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
              ))}
            </select>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setEventIsOnOff(true)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                eventIsOnOff ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Power Event
            </button>
            <button
              onClick={() => setEventIsOnOff(false)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !eventIsOnOff ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Temperature Event
            </button>
          </div>

          {eventIsOnOff ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
              <select
                value={eventOnOffAction}
                onChange={(e) => setEventOnOffAction(e.target.value as 'ON' | 'OFF')}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="ON">Turn ON</option>
                <option value="OFF">Turn OFF</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Temperature (°C)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="16"
                  max="30"
                  value={eventTemp}
                  onChange={(e) => setEventTemp(e.target.value)}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium w-8">{eventTemp}°</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="eventIsRecurring"
              checked={eventIsRecurring}
              onChange={(e) => setEventIsRecurring(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="eventIsRecurring" className="text-sm font-medium text-slate-700">
              Recurring Event
            </label>
          </div>

          {eventIsRecurring ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      setEventDays(prev => 
                        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      eventDays.includes(day)
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
            <button
              onClick={closeAddEventModal}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEvent}
              disabled={!eventName || !eventDeviceId || !eventTime || (eventIsRecurring && eventDays.length === 0) || (!eventIsRecurring && (!eventStartDate || !eventEndDate))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Event
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
