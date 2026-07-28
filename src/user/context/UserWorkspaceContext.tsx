import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { ACUnit, Organization, Venue, UserAccount } from '../../types';
import { useDeviceCrudWorkspace } from '../../hooks/useDeviceCrudWorkspace';

export interface UserWorkspaceProps {
  user: UserAccount;
  units: ACUnit[];
  orgs: Organization[];
  venues: Venue[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSelectUnit: (id: string) => void;
  onTogglePower: (id: string) => void;
  onAddDevice: (d: ACUnit) => void;
  onDeleteDevice: (id: string) => void;
  onUpdateDevice: (id: string, data: Partial<ACUnit>) => void;
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
  const organizationIds = user?.organizationIds || [];

  const scopedOrgs = useMemo(
    () =>
      organizationIds.length > 0
        ? orgs.filter((o) => organizationIds.includes(o.id))
        : orgs,
    [orgs, organizationIds]
  );

  const scopedVenues = useMemo(
    () =>
      assignedVenueIds.length > 0
        ? venues.filter((v) => assignedVenueIds.includes(v.id))
        : venues,
    [venues, assignedVenueIds]
  );

  const assignedVenues = scopedVenues;
  const assignedUnits = units.filter((u) =>
    assignedVenueIds.length > 0
      ? assignedVenueIds.includes(u.venueId)
      : true
  );

  const filterVenuesForOrg = useCallback(
    (_orgId: string, list: Venue[]) => {
      if (assignedVenueIds.length === 0) return list;
      return list.filter((v) => assignedVenueIds.includes(v.id));
    },
    [assignedVenueIds]
  );

  const deviceCrud = useDeviceCrudWorkspace({
    units,
    orgs: scopedOrgs,
    venues: scopedVenues,
    onAddDevice,
    onUpdateDevice,
    onDeleteDevice,
    filterVenuesForOrg,
  });

  return {
    user,
    units,
    orgs: scopedOrgs,
    venues: scopedVenues,
    activeTab,
    onTabChange,
    onSelectUnit,
    onTogglePower,
    onAddDevice,
    onDeleteDevice,
    onUpdateDevice,
    assignedVenues,
    assignedUnits,
    assignedVenueIds,
    canManage: user?.permission === 'manage',
    ...deviceCrud,
  };
}

export function UserWorkspaceProvider({
  children,
  ...props
}: UserWorkspaceProps & { children: React.ReactNode }) {
  const value = useUserWorkspaceValue(props);
  return (
    <UserWorkspaceContext.Provider value={value}>
      {children}
    </UserWorkspaceContext.Provider>
  );
}

export function useUserWorkspace() {
  const ctx = useContext(UserWorkspaceContext);
  if (!ctx) {
    throw new Error('useUserWorkspace must be used within UserWorkspaceProvider');
  }
  return ctx;
}
