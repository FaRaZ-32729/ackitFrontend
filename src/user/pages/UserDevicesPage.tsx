import React, { useCallback } from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { DevicesManagementPage } from '../../components/devices/DevicesManagementPage';
import type { Venue } from '../../types';

/** User devices page — same UI as manager, scoped to assigned orgs/venues */
export function UserDevicesPage() {
  const { setUnits } = useAppContext();
  const workspace = useUserWorkspace();

  const filterOrgVenues = useCallback(
    (list: Venue[]) => {
      const allowed = new Set(workspace.assignedVenueIds || []);
      if (allowed.size === 0) return list;
      return list.filter((v) => allowed.has(v.id));
    },
    [workspace.assignedVenueIds]
  );

  return (
    <DevicesManagementPage
      workspace={workspace}
      skipOrgFetch
      setUnits={setUnits}
      filterOrgVenues={filterOrgVenues}
      canManage={workspace.canManage}
    />
  );
}
