import React, { useEffect } from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { Dashboard } from '../../components/dashboard/Dashboard';

/** Manager dashboard page — markup/CSS preserved from legacy ManagerView */
export function DashboardPage() {
  const { fetchMyVenues, units } = useAppContext();
  const {
    orgs, venues,
    onTabChange, onSelectUnit, onTogglePower,
    onUpdateDevice,
    setSelectedDeviceVenueId,
  } = useManagerWorkspace();

  // Load organizations + venues for dashboard cards
  useEffect(() => {
    void fetchMyVenues().catch(() => {
      // empty state handled in UI
    });
  }, [fetchMyVenues]);

  return (
    <>
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
    </>
  );
}
