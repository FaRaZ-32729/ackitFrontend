import React, { useMemo } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { UserLayout } from '../UserLayout';
import { UserDashboardPage } from './UserDashboardPage';
import { UserReportsPage } from './UserReportsPage';
import { UserDevicesPage } from './UserDevicesPage';
import type { UserAccount } from '../../types';

const VALID_TABS = ['dashboard', 'reports', 'devices'] as const;
type UserTab = (typeof VALID_TABS)[number];

function UserTabContent({ tab }: { tab: UserTab }) {
  switch (tab) {
    case 'dashboard':
      return <UserDashboardPage />;
    case 'reports':
      return <UserReportsPage />;
    case 'devices':
      return <UserDevicesPage />;
    default:
      return null;
  }
}

export function UserPage() {
  const {
    role,
    authLoading,
    user: authUser,
    units,
    setUnits,
    orgs,
    venues,
    setSelectedUnitId,
    handleTogglePower,
  } = useAppContext();

  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  const workspaceUser = useMemo<UserAccount | null>(() => {
    if (!authUser || authUser.role !== 'user') return null;
    return {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      status: authUser.isActive ? 'active' : 'inactive',
      assignedVenueIds: authUser.assignedVenueIds || [],
      organizationIds: authUser.organizationIds || [],
      managerId: '',
      permission:
        authUser.permission === 'manage' || authUser.permission === 'view'
          ? authUser.permission
          : 'view',
    };
  }, [authUser]);

  if (authLoading) {
    return null;
  }

  if (role !== 'user') {
    return <Navigate to="/login" replace />;
  }

  if (!workspaceUser) {
    return <Navigate to="/login" replace />;
  }

  if (!tab || !(VALID_TABS as readonly string[]).includes(tab)) {
    return <Navigate to="/user/dashboard" replace />;
  }

  const currentTab = tab as UserTab;

  return (
    <UserLayout
      user={workspaceUser}
      units={units}
      orgs={orgs}
      venues={venues}
      activeTab={currentTab}
      onTabChange={(nextTab) => navigate(`/user/${nextTab}`)}
      onSelectUnit={(id) => {
        setSelectedUnitId(id);
        navigate(`/device/${id}`);
      }}
      onTogglePower={handleTogglePower}
      onAddDevice={(d) => setUnits((prev) => [...prev, { id: d.id || `ac-${Date.now()}`, ...d }])}
      onDeleteDevice={(id) => setUnits((prev) => prev.filter((u) => u.id !== id))}
      onUpdateDevice={(id, data) =>
        setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
      }
    >
      <UserTabContent tab={currentTab} />
    </UserLayout>
  );
}
