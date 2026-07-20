import React, { createContext, useContext, useMemo, useState } from 'react';
import { ACUnit, UserAccount, Organization, Venue, EnergyData } from '../../types';

export interface ManagerWorkspaceProps {
  units: ACUnit[];
  users: UserAccount[];
  orgs: Organization[];
  venues: Venue[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSelectUnit: (id: string) => void;
  onTogglePower: (id: string) => void;
  onAddUser: (user: Omit<UserAccount, 'id'>) => void | Promise<void | UserAccount>;
  onAddOrg: (org: Omit<Organization, 'id'>) => void | Promise<void | Organization>;
  onAddVenue: (venue: Omit<Venue, 'id'>) => void | Promise<void | Venue>;
  onAddDevice: (device: Omit<ACUnit, 'id'>) => void;
  onDeleteUser: (id: string) => void | Promise<void>;
  onUpdateUser: (id: string, data: Partial<UserAccount>) => void | Promise<void>;
  onDeleteOrg: (id: string) => void | Promise<void>;
  onUpdateOrg: (id: string, data: Partial<Organization>) => void | Promise<void>;
  onDeleteVenue: (id: string) => void | Promise<void>;
  onUpdateVenue: (id: string, data: Partial<Venue>) => void | Promise<void>;
  onDeleteDevice: (id: string) => void;
  onUpdateDevice: (id: string, data: Partial<ACUnit>) => void;
}

type ManagerWorkspaceValue = ReturnType<typeof useManagerWorkspaceValue>;

const ManagerWorkspaceContext = createContext<ManagerWorkspaceValue | null>(null);

function useManagerWorkspaceValue(props: ManagerWorkspaceProps) {
  const {
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
  } = props;

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserStep, setAddUserStep] = useState<'details' | 'success'>('details');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<'view' | 'manage'>('view');
  const [newUserOrgs, setNewUserOrgs] = useState<string[]>([]);
  const [newUserVenues, setNewUserVenues] = useState<string[]>([]);

  // New Org Form State
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgAddress, setNewOrgAddress] = useState('');

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
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
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

  const handleAddUser = async () => {
    if (addUserStep !== 'details') return;
    if (!newUserName.trim() || !newUserEmail.trim() || newUserOrgs.length === 0) return;

    await onAddUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      status: 'pending',
      assignedVenueIds: newUserVenues,
      organizationIds: newUserOrgs,
      permission: newUserPermission,
      managerId: '',
    });
    setAddUserStep('success');
    window.setTimeout(() => {
      closeAddUserModal();
    }, 3000);
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
      setNewUserPermission('view');
      setNewUserOrgs([]);
      setNewUserVenues([]);
    }, 300);
  };

  const handleAddOrg = async () => {
    if (!newOrgName.trim()) return;
    await onAddOrg({
      name: newOrgName.trim(),
      address: newOrgAddress.trim() || undefined,
      managerId: '',
    });
    setShowAddOrg(false);
    setNewOrgName('');
    setNewOrgAddress('');
  };

  const handleAddVenue = async () => {
    if (!newVenueName.trim() || !newVenueOrgId) return;
    await onAddVenue({
      name: newVenueName.trim(),
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

  const normalizedVenueSearch = venueSearchQuery.trim().toLowerCase();
  const normalizedDeviceSearch = deviceSearchQuery.trim().toLowerCase();

  const filteredManagedVenues = venues.filter((venue) => {
    const matchesOrg = selectedVenueOrgId === 'all' || venue.orgId === selectedVenueOrgId;
    const matchesSearch =
      !normalizedVenueSearch || venue.name.toLowerCase().includes(normalizedVenueSearch);
    return matchesOrg && matchesSearch;
  });

  const filteredManagedDevices = units.filter((unit) => {
    const matchesVenue = selectedDeviceVenueId === 'all' || unit.venueId === selectedDeviceVenueId;
    const matchesSearch =
      !normalizedDeviceSearch || unit.name.toLowerCase().includes(normalizedDeviceSearch);
    return matchesVenue && matchesSearch;
  });

  return {
    units, users, orgs, venues, activeTab,
    onTabChange, onSelectUnit, onTogglePower,
    onAddUser, onAddOrg, onAddVenue, onAddDevice,
    onDeleteUser, onUpdateUser, onDeleteOrg, onUpdateOrg,
    onDeleteVenue, onUpdateVenue, onDeleteDevice, onUpdateDevice,
    showAddUser, setShowAddUser, addUserStep, setAddUserStep,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserPermission, setNewUserPermission, newUserOrgs, setNewUserOrgs, newUserVenues, setNewUserVenues,
    showAddOrg, setShowAddOrg, newOrgName, setNewOrgName,
    newOrgAddress, setNewOrgAddress,
    showAddVenue, setShowAddVenue, newVenueName, setNewVenueName, newVenueOrgId, setNewVenueOrgId,
    showAddDevice, setShowAddDevice, newDeviceName, setNewDeviceName,
    newDeviceOrgId, setNewDeviceOrgId, newDeviceVenueId, setNewDeviceVenueId,
    newDeviceBrand, setNewDeviceBrand, newDeviceEnergySensor, setNewDeviceEnergySensor,
    newDeviceCapacity, setNewDeviceCapacity,
    editingUser, setEditingUser, editingOrg, setEditingOrg,
    editingVenue, setEditingVenue, editingDevice, setEditingDevice,
    deletingId, setDeletingId, deleteType, setDeleteType,
    expandedUserId, setExpandedUserId, expandedVenueId, setExpandedVenueId,
    expandedDeviceId, setExpandedDeviceId,
    selectedDeviceVenueId, setSelectedDeviceVenueId,
    selectedVenueOrgId, setSelectedVenueOrgId,
    venueSearchQuery, setVenueSearchQuery, deviceSearchQuery, setDeviceSearchQuery,
    venueTempInputs, setVenueTempInputs, tempSuccess, setTempSuccess,
    deviceTempInputs, setDeviceTempInputs, deviceTempSuccess, setDeviceTempSuccess,
    openDropdownId, setOpenDropdownId,
    activeDetailType, setActiveDetailType, selectedUserForModal, setSelectedUserForModal,
    energyFilterType, setEnergyFilterType, selectedEnergyId, setSelectedEnergyId,
    energyView, setEnergyView,
    filteredUnits, aggregatedEnergyData, runtimeStats, faultyDevices, handleDownloadReport,
    showAddEventModal, setShowAddEventModal,
    eventDeviceId, setEventDeviceId, eventName, setEventName, eventTemp, setEventTemp,
    eventIsRecurring, setEventIsRecurring, eventStartDate, setEventStartDate,
    eventEndDate, setEventEndDate, eventDays, setEventDays,
    eventIsOnOff, setEventIsOnOff, eventOnOffAction, setEventOnOffAction, eventTime, setEventTime,
    handleAddUser, toggleUser, toggleVenueRow, openUserDetailModal, closeUserDetailModal,
    closeAddUserModal, handleAddOrg, handleAddVenue, handleAddDevice,
    closeAddEventModal, handleAddEvent, toggleVenue,
    filteredManagedVenues, filteredManagedDevices,
  };
}

export function ManagerWorkspaceProvider({
  children,
  ...props
}: ManagerWorkspaceProps & { children: React.ReactNode }) {
  const value = useManagerWorkspaceValue(props);
  return (
    <ManagerWorkspaceContext.Provider value={value}>
      {children}
    </ManagerWorkspaceContext.Provider>
  );
}

export function useManagerWorkspace() {
  const ctx = useContext(ManagerWorkspaceContext);
  if (!ctx) {
    throw new Error('useManagerWorkspace must be used within ManagerWorkspaceProvider');
  }
  return ctx;
}
