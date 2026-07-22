import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { ACUnit, UserAccount, Organization, Venue, EnergyData } from '../../types';
import {
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceBrandOptions,
  parseCapacityTon,
  type DeviceBrandOption,
} from '../../api/deviceApi';
import { getVenuesByOrganization } from '../../api/venueApi';

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
  onAddDevice: (device: ACUnit) => void;
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

  // Listeners so DevicesPage (API-loaded list) stays in sync with modal actions
  const deviceEventListeners = useRef(
    new Set<(deviceId: string, event: ACUnit['events'][number]) => void>()
  );
  const deviceDeletedListeners = useRef(new Set<(deviceId: string) => void>());
  const deviceUpdatedListeners = useRef(new Set<(device: ACUnit) => void>());

  const subscribeDeviceEventAdd = (
    listener: (deviceId: string, event: ACUnit['events'][number]) => void
  ) => {
    deviceEventListeners.current.add(listener);
    return () => {
      deviceEventListeners.current.delete(listener);
    };
  };

  const subscribeDeviceDeleted = (listener: (deviceId: string) => void) => {
    deviceDeletedListeners.current.add(listener);
    return () => {
      deviceDeletedListeners.current.delete(listener);
    };
  };

  const subscribeDeviceUpdated = (listener: (device: ACUnit) => void) => {
    deviceUpdatedListeners.current.add(listener);
    return () => {
      deviceUpdatedListeners.current.delete(listener);
    };
  };

  const handleDeleteDeviceLocal = (id: string) => {
    onDeleteDevice(id);
    deviceDeletedListeners.current.forEach((fn) => fn(id));
  };

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
  const [newDeviceBrand, setNewDeviceBrand] = useState('');
  const [newDeviceEnergySensor, setNewDeviceEnergySensor] = useState(true);
  const [newDeviceCapacity, setNewDeviceCapacity] = useState('1.5');
  const [newDeviceVenues, setNewDeviceVenues] = useState<Venue[]>([]);
  const [newDeviceBrands, setNewDeviceBrands] = useState<DeviceBrandOption[]>([]);
  const [newDeviceError, setNewDeviceError] = useState('');
  const [deviceToast, setDeviceToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showDeviceToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'error'
  ) => {
    setDeviceToast({ message, type });
    window.setTimeout(() => setDeviceToast(null), 3500);
  };
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  // Edit Device Form State
  const [editDeviceVenues, setEditDeviceVenues] = useState<Venue[]>([]);
  const [editDeviceBrands, setEditDeviceBrands] = useState<DeviceBrandOption[]>([]);
  const [editDeviceError, setEditDeviceError] = useState('');
  const [isUpdatingDevice, setIsUpdatingDevice] = useState(false);
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
      setNewDeviceVenueId('');
      setNewDeviceName('');
      setNewDeviceBrand('');
      setNewDeviceEnergySensor(true);
      setNewDeviceCapacity('1.5');
      setNewDeviceError('');

      getDeviceBrandOptions()
        .then((brands) => {
          setNewDeviceBrands(brands);
          setNewDeviceBrand(brands[0]?.id || '');
        })
        .catch(() => setNewDeviceError('Failed to load AC brands'));
    }
  }, [showAddDevice, orgs]);

  React.useEffect(() => {
    if (!showAddDevice || !newDeviceOrgId) {
      setNewDeviceVenues([]);
      setNewDeviceVenueId('');
      return;
    }

    let active = true;
    setNewDeviceVenueId('');
    setNewDeviceVenues([]);

    getVenuesByOrganization(newDeviceOrgId)
      .then((list) => {
        if (!active) return;
        setNewDeviceVenues(list);
        setNewDeviceVenueId(list[0]?.id || '');
      })
      .catch(() => {
        if (!active) return;
        setNewDeviceVenues([]);
        setNewDeviceVenueId('');
        setNewDeviceError('Failed to load venues for this organization');
      });

    return () => {
      active = false;
    };
  }, [showAddDevice, newDeviceOrgId]);

  // Prefill edit modal when a device is opened
  React.useEffect(() => {
    if (!editingDevice) {
      setEditDeviceVenues([]);
      setEditDeviceBrands([]);
      setEditDeviceError('');
      return;
    }

    setEditDeviceError('');
    getDeviceBrandOptions()
      .then((brands) => {
        setEditDeviceBrands(brands);
        setEditingDevice((prev) => {
          if (!prev) return prev;
          const brandId =
            prev.brandId ||
            brands.find((b) => b.name === prev.brand)?.id ||
            brands[0]?.id ||
            '';
          return { ...prev, brandId };
        });
      })
      .catch(() => setEditDeviceError('Failed to load AC brands'));
  }, [editingDevice?.id]);

  React.useEffect(() => {
    if (!editingDevice?.organizationId) {
      setEditDeviceVenues([]);
      return;
    }

    const orgId = editingDevice.organizationId;
    getVenuesByOrganization(orgId)
      .then((list) => {
        setEditDeviceVenues(list);
        setEditingDevice((prev) => {
          if (!prev || prev.organizationId !== orgId) return prev;
          const venueStillValid = list.some((v) => v.id === prev.venueId);
          return {
            ...prev,
            venueId: venueStillValid ? prev.venueId : list[0]?.id || '',
          };
        });
      })
      .catch(() => {
        setEditDeviceVenues([]);
        setEditDeviceError('Failed to load venues for this organization');
      });
  }, [editingDevice?.organizationId]);

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

  const handleAddDevice = async () => {
    if (
      !newDeviceName.trim() ||
      !newDeviceOrgId ||
      !newDeviceVenueId ||
      !newDeviceBrand
    ) return;

    // Guard against stale venue after org switch
    const venueBelongsToOrg = newDeviceVenues.some((v) => v.id === newDeviceVenueId);
    if (venueBelongsToOrg === false) {
      const message = 'Please select a venue that belongs to the selected organization';
      setNewDeviceError(message);
      showDeviceToast(message, 'error');
      return;
    }

    if (newDeviceName.trim().length < 2) {
      const message = 'Device name must be at least 2 characters';
      setNewDeviceError(message);
      showDeviceToast(message, 'error');
      return;
    }

    const nameExistsLocally = units.some(
      (u) =>
        u.venueId === newDeviceVenueId &&
        u.name.trim().toLowerCase() === newDeviceName.trim().toLowerCase()
    );
    if (nameExistsLocally) {
      const message = 'This name is already present in this venue';
      setNewDeviceError(message);
      showDeviceToast(message, 'error');
      return;
    }

    setIsAddingDevice(true);
    setNewDeviceError('');
    try {
      const device = await createDevice({
        name: newDeviceName.trim(),
        organization: String(newDeviceOrgId),
        venue: String(newDeviceVenueId),
        brand: String(newDeviceBrand),
        capacity: Number(newDeviceCapacity),
      });
      onAddDevice(device);
      setShowAddDevice(false);
      setNewDeviceName('');
      showDeviceToast('Device created successfully', 'success');
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = String(error?.response?.data?.message || '');
      const apiErrors = error?.response?.data?.errors;
      const details =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors.map((e: { message?: string }) => e.message).filter(Boolean).join(' · ')
          : '';

      const isNameTaken =
        status === 409 &&
        (/already exists/i.test(apiMessage) ||
          /deviceName/i.test(apiMessage) ||
          /name is already/i.test(apiMessage) ||
          /name already/i.test(details));

      const message = isNameTaken
        ? 'This name is already present in this venue'
        : details || apiMessage || error?.message || 'Failed to create device';

      setNewDeviceError(message);
      showDeviceToast(message, 'error');
    } finally {
      setIsAddingDevice(false);
    }
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    if (
      !editingDevice.name.trim() ||
      !editingDevice.organizationId ||
      !editingDevice.venueId ||
      !editingDevice.brandId
    ) {
      return;
    }

    setIsUpdatingDevice(true);
    setEditDeviceError('');
    try {
      const updated = await updateDevice(editingDevice.id, {
        name: editingDevice.name.trim(),
        organization: editingDevice.organizationId,
        venue: editingDevice.venueId,
        brand: editingDevice.brandId,
        capacity: parseCapacityTon(editingDevice.capacityTon),
      });
      // Preserve client-only fields (events, live toggles) where possible
      const merged: ACUnit = {
        ...editingDevice,
        ...updated,
        events: editingDevice.events || [],
        isOn: editingDevice.isOn,
        isLocked: editingDevice.isLocked,
        eventLocked: editingDevice.eventLocked,
        targetTemp: editingDevice.targetTemp,
        currentTemp: editingDevice.currentTemp,
      };
      onUpdateDevice(merged.id, merged);
      deviceUpdatedListeners.current.forEach((fn) => fn(merged));
      setEditingDevice(null);
    } catch (error: any) {
      setEditDeviceError(
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update device'
      );
    } finally {
      setIsUpdatingDevice(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId || !deleteType) return;
    setDeleteError('');
    try {
      if (deleteType === 'user') await onDeleteUser(deletingId);
      else if (deleteType === 'org') await onDeleteOrg(deletingId);
      else if (deleteType === 'venue') await onDeleteVenue(deletingId);
      else if (deleteType === 'device') {
        setIsDeletingDevice(true);
        await deleteDevice(deletingId);
        handleDeleteDeviceLocal(deletingId);
      }
      setDeletingId(null);
      setDeleteType(null);
    } catch (error: any) {
      if (deleteType === 'device') {
        setDeleteError(
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete device'
        );
      }
      // Keep confirm open on failure
    } finally {
      setIsDeletingDevice(false);
    }
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

    const device = units.find((u) => u.id === eventDeviceId);

    const newEvent = {
      id: `evt-${Date.now()}`,
      name: eventName,
      time: eventTime,
      action: eventIsOnOff ? eventOnOffAction : ('SET_TEMP' as const),
      targetTemp: eventIsOnOff ? undefined : parseInt(eventTemp),
      isRecurring: eventIsRecurring,
      startDate: !eventIsRecurring ? eventStartDate : undefined,
      endDate: !eventIsRecurring ? eventEndDate : undefined,
      days: eventIsRecurring ? eventDays : [],
      enabled: true,
    };

    if (device) {
      onUpdateDevice(eventDeviceId, {
        events: [...(device.events || []), newEvent],
      });
    }

    // Always notify DevicesPage local list (API-loaded devices may not be in units)
    deviceEventListeners.current.forEach((fn) => fn(eventDeviceId, newEvent));

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
    onDeleteVenue, onUpdateVenue, onDeleteDevice: handleDeleteDeviceLocal, onUpdateDevice,
    showAddUser, setShowAddUser, addUserStep, setAddUserStep,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserPermission, setNewUserPermission, newUserOrgs, setNewUserOrgs, newUserVenues, setNewUserVenues,
    showAddOrg, setShowAddOrg, newOrgName, setNewOrgName,
    newOrgAddress, setNewOrgAddress,
    showAddVenue, setShowAddVenue, newVenueName, setNewVenueName, newVenueOrgId, setNewVenueOrgId,
    showAddDevice, setShowAddDevice, newDeviceName, setNewDeviceName,
    newDeviceOrgId, setNewDeviceOrgId, newDeviceVenueId, setNewDeviceVenueId,
    newDeviceBrand, setNewDeviceBrand, newDeviceEnergySensor, setNewDeviceEnergySensor,
    newDeviceCapacity, setNewDeviceCapacity, newDeviceVenues, newDeviceBrands,
    newDeviceError, isAddingDevice, deviceToast, setDeviceToast,
    editDeviceVenues, editDeviceBrands, editDeviceError, isUpdatingDevice,
    isDeletingDevice, deleteError, setDeleteError,
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
    handleUpdateDevice, handleConfirmDelete,
    closeAddEventModal, handleAddEvent, toggleVenue,
    subscribeDeviceEventAdd, subscribeDeviceDeleted, subscribeDeviceUpdated,
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
