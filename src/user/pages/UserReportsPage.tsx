import React from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
import { Reports } from '../../components/reports/Reports';

/** User reports page — markup/CSS preserved from legacy UserView */
export function UserReportsPage() {
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
      <Reports units={assignedUnits} />
    </>
  );
}
