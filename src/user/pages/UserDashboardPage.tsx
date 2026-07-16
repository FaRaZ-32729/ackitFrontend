import React from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
import { Dashboard } from '../../components/dashboard/Dashboard';

/** User dashboard page — markup/CSS preserved from legacy UserView */
export function UserDashboardPage() {
  const {
    user, units, orgs, venues, activeTab,
    onTabChange, onSelectUnit, onTogglePower,
    onAddDevice, onDeleteDevice, onUpdateDevice,
    searchQuery, setSearchQuery,
    selectedBrandFilter, setSelectedBrandFilter,
    selectedDeviceVenueId, setSelectedDeviceVenueId,
    deviceName, setDeviceName, acBrand, setAcBrand,
    selectedOrgId, setSelectedOrgId, selectedVenueId, setSelectedVenueId,
    editingUnitId, setEditingUnitId, revealApiKey, setRevealApiKey, copied, setCopied,
    assignedVenues, assignedUnits, filteredUnits, currentApiKey,
    handleEditClick, resetForm, handleSave, generateApiKey, handleCopy,
  } = useUserWorkspace();

  return (
    <>
      <Dashboard
                units={assignedUnits}
                role="user"
                onSelectUnit={onSelectUnit}
                onTogglePower={onTogglePower}
                orgs={orgs}
                venues={assignedVenues}
                onAddDeviceClick={() => {
                  if (onTabChange) onTabChange('devices');
                  resetForm();
                }}
                onUpdateDevice={onUpdateDevice}
                onViewDevicesOfVenue={(venueId) => {
                  setSelectedDeviceVenueId(venueId);
                  if (onTabChange) {
                    onTabChange('devices');
                  }
                }}
              />
    </>
  );
}
