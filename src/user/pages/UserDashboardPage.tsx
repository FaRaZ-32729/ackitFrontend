import React, { useEffect } from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { Dashboard } from '../../components/dashboard/Dashboard';

/** User dashboard page — markup/CSS preserved from legacy UserView */
export function UserDashboardPage() {
  const { fetchMyVenues } = useAppContext();
  const {
    orgs,
    onTabChange,
    onSelectUnit,
    onTogglePower,
    onUpdateDevice,
    setSelectedDeviceVenueId,
    setShowAddDevice,
    assignedVenues,
    assignedUnits,
    canManage,
  } = useUserWorkspace();

  useEffect(() => {
    void fetchMyVenues().catch(() => {});
  }, [fetchMyVenues]);

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
          if (!canManage) return;
          if (onTabChange) onTabChange('devices');
          setShowAddDevice(true);
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
