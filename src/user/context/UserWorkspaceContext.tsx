import React, { createContext, useContext, useEffect, useState } from 'react';
import { ACUnit, Organization, Venue, UserAccount } from '../../types';
import { encodeBase32 } from '../utils';

export interface UserWorkspaceProps {
  user: UserAccount;
  units: ACUnit[];
  orgs: Organization[];
  venues: Venue[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSelectUnit: (id: string) => void;
  onTogglePower: (id: string) => void;
  onAddDevice: (d: any) => void;
  onDeleteDevice: (id: string) => void;
  onUpdateDevice: (id: string, data: any) => void;
}

type UserWorkspaceValue = ReturnType<typeof useUserWorkspaceValue>;

const UserWorkspaceContext = createContext<UserWorkspaceValue | null>(null);

function useUserWorkspaceValue(props: UserWorkspaceProps) {
  const {
    user,
    units,
    orgs,
    venues,
    activeTab,
    onTabChange,
    onSelectUnit,
    onTogglePower,
    onAddDevice,
    onDeleteDevice,
    onUpdateDevice,
  } = props;

  const assignedVenueIds = user?.assignedVenueIds || [];
  const assignedVenues = venues.filter((v) => assignedVenueIds.includes(v.id));
  const assignedUnits = units.filter((u) => assignedVenueIds.includes(u.venueId));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedDeviceVenueId, setSelectedDeviceVenueId] = useState<string>('all');

  const [deviceName, setDeviceName] = useState('');
  const [acBrand, setAcBrand] = useState('Daikin');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');

  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [revealApiKey, setRevealApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(orgs[0].id);
    }
  }, [orgs, selectedOrgId]);

  useEffect(() => {
    const filteredVenues = venues.filter((v) => v.orgId === selectedOrgId);
    if (filteredVenues.length > 0) {
      setSelectedVenueId(filteredVenues[0].id);
    } else {
      setSelectedVenueId('');
    }
  }, [selectedOrgId, venues]);

  const handleEditClick = (unit: ACUnit) => {
    setEditingUnitId(unit.id);
    setDeviceName(unit.name);
    const venue = venues.find((v) => v.id === unit.venueId);
    const brandValue = (unit as any).brand || 'Daikin';
    setAcBrand(brandValue);
    if (venue) {
      setSelectedOrgId(venue.orgId);
      setSelectedVenueId(venue.id);
    }
    setRevealApiKey(false);
    setCopied(false);
  };

  const resetForm = () => {
    setEditingUnitId(null);
    setDeviceName('');
    setAcBrand('Daikin');
    if (orgs.length > 0) {
      setSelectedOrgId(orgs[0].id);
    }
    setCopied(false);
  };

  const handleSave = () => {
    if (!deviceName.trim() || !selectedVenueId) return;

    const deviceData = {
      name: deviceName,
      venueId: selectedVenueId,
      brand: acBrand,
      isOn: editingUnitId ? units.find((u) => u.id === editingUnitId)?.isOn ?? false : false,
      currentTemp: editingUnitId
        ? units.find((u) => u.id === editingUnitId)?.currentTemp ?? 24
        : 24,
      targetTemp: editingUnitId
        ? units.find((u) => u.id === editingUnitId)?.targetTemp ?? 22
        : 22,
      isLocked: editingUnitId
        ? units.find((u) => u.id === editingUnitId)?.isLocked ?? false
        : false,
      eventLocked: editingUnitId
        ? units.find((u) => u.id === editingUnitId)?.eventLocked ?? false
        : false,
      hasFault: editingUnitId
        ? units.find((u) => u.id === editingUnitId)?.hasFault ?? false
        : false,
      energyConsumption: editingUnitId
        ? units.find((u) => u.id === editingUnitId)?.energyConsumption ?? {
            hourly: [],
            daily: [],
            weekly: [],
            monthly: [],
            yearly: [],
          }
        : {
            hourly: Array.from({ length: 24 }, (_, i) => ({
              label: `${i}:00`,
              kwh: Math.round(Math.random() * 5),
            })),
            daily: Array.from({ length: 7 }, (_, i) => ({
              label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sat'][i],
              kwh: Math.round(Math.random() * 20),
            })),
            weekly: Array.from({ length: 4 }, (_, i) => ({
              label: `Week ${i + 1}`,
              kwh: Math.round(Math.random() * 100),
            })),
            monthly: Array.from({ length: 12 }, (_, i) => ({
              label: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ][i],
              kwh: Math.round(Math.random() * 400),
            })),
            yearly: Array.from({ length: 3 }, (_, i) => ({
              label: `${2024 + i}`,
              kwh: Math.round(Math.random() * 5000),
            })),
          },
      events: editingUnitId ? units.find((u) => u.id === editingUnitId)?.events ?? [] : [],
    };

    if (editingUnitId) {
      onUpdateDevice(editingUnitId, deviceData);
      resetForm();
    } else {
      const generatedId = `ac-${Date.now()}`;
      onAddDevice({ ...deviceData, id: generatedId });
      setEditingUnitId(generatedId);
      setRevealApiKey(true);
      setCopied(false);
    }
  };

  const generateApiKey = (id: string): string => {
    return `IOTFIY_AC_${encodeBase32(id)}`;
  };

  const currentApiKey = editingUnitId ? generateApiKey(editingUnitId) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.id.toLowerCase().includes(searchQuery.toLowerCase());
    const brandValue = (unit as any).brand || 'Daikin';
    const matchesBrand = selectedBrandFilter === 'All' || brandValue === selectedBrandFilter;
    const matchesVenue = selectedDeviceVenueId === 'all' || unit.venueId === selectedDeviceVenueId;
    return matchesSearch && matchesBrand && matchesVenue;
  });

  return {
    user,
    units,
    orgs,
    venues,
    activeTab,
    onTabChange,
    onSelectUnit,
    onTogglePower,
    onAddDevice,
    onDeleteDevice,
    onUpdateDevice,
    searchQuery,
    setSearchQuery,
    selectedBrandFilter,
    setSelectedBrandFilter,
    selectedDeviceVenueId,
    setSelectedDeviceVenueId,
    deviceName,
    setDeviceName,
    acBrand,
    setAcBrand,
    selectedOrgId,
    setSelectedOrgId,
    selectedVenueId,
    setSelectedVenueId,
    editingUnitId,
    setEditingUnitId,
    revealApiKey,
    setRevealApiKey,
    copied,
    setCopied,
    assignedVenues,
    assignedUnits,
    filteredUnits,
    currentApiKey,
    handleEditClick,
    resetForm,
    handleSave,
    generateApiKey,
    handleCopy,
  };
}

export function UserWorkspaceProvider({
  children,
  ...props
}: UserWorkspaceProps & { children: React.ReactNode }) {
  const value = useUserWorkspaceValue(props);
  return (
    <UserWorkspaceContext.Provider value={value}>{children}</UserWorkspaceContext.Provider>
  );
}

export function useUserWorkspace() {
  const ctx = useContext(UserWorkspaceContext);
  if (!ctx) {
    throw new Error('useUserWorkspace must be used within UserWorkspaceProvider');
  }
  return ctx;
}
