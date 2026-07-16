/**
 * Builds ManagerWorkspaceContext from legacy ManagerView state/handlers.
 * Run: node scripts/build-manager-context.mjs
 */
import fs from 'fs';

const src = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');
const lines = src.split(/\r?\n/);

// Extract function body internals: lines 76-417 (state + handlers before return)
const internals = lines.slice(75, 417).join('\n');

const contextFile = `import React, { createContext, useContext, useMemo, useState } from 'react';
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

${internals}

  return {
    units, users, orgs, venues, activeTab,
    onTabChange, onSelectUnit, onTogglePower,
    onAddUser, onAddOrg, onAddVenue, onAddDevice,
    onDeleteUser, onUpdateUser, onDeleteOrg, onUpdateOrg,
    onDeleteVenue, onUpdateVenue, onDeleteDevice, onUpdateDevice,
    showAddUser, setShowAddUser, addUserStep, setAddUserStep,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserStatus, setNewUserStatus, newUserVenues, setNewUserVenues,
    showAddOrg, setShowAddOrg, newOrgName, setNewOrgName,
    newOrgAddress, setNewOrgAddress, newOrgDescription, setNewOrgDescription,
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
`;

fs.writeFileSync('src/manager/context/ManagerWorkspaceContext.tsx', contextFile);
console.log('wrote ManagerWorkspaceContext.tsx');
