import React from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { DevicesManagementPage } from '../../components/devices/DevicesManagementPage';

/** Manager devices page — shared management UI */
export function DevicesPage() {
  const {
    fetchMyOrganizations,
    orgsLoading,
    setUnits,
    fetchMyVenues,
  } = useAppContext();
  const workspace = useManagerWorkspace();

  return (
    <DevicesManagementPage
      workspace={workspace}
      orgsLoading={orgsLoading}
      fetchMyOrganizations={fetchMyOrganizations}
      fetchMyVenues={fetchMyVenues}
      setUnits={setUnits}
      canManage
    />
  );
}
