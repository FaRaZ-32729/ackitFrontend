import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ManagerLayout } from '../ManagerLayout';
import { OverviewPage } from './OverviewPage';
import { DashboardPage } from './DashboardPage';
import { ReportsPage } from './ReportsPage';
import { UsersPage } from './UsersPage';
import { OrganizationsPage } from './OrganizationsPage';
import { VenuesPage } from './VenuesPage';
import { DevicesPage } from './DevicesPage';

const VALID_TABS = [
  'overview',
  'dashboard',
  'reports',
  'users',
  'organizations',
  'venues',
  'devices',
] as const;

type ManagerTab = (typeof VALID_TABS)[number];

function ManagerTabContent({ tab }: { tab: ManagerTab }) {
  switch (tab) {
    case 'overview':
      return <OverviewPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'reports':
      return <ReportsPage />;
    case 'users':
      return <UsersPage />;
    case 'organizations':
      return <OrganizationsPage />;
    case 'venues':
      return <VenuesPage />;
    case 'devices':
      return <DevicesPage />;
    default:
      return null;
  }
}

export function ManagerPage() {
  const {
    role,
    hasActiveSubscription,
    authLoading,
    units,
    setUnits,
    users,
    orgs,
    venues,
    setSelectedUnitId,
    handleTogglePower,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    createVenue,
    updateVenue,
    deleteVenue,
    createSubUser,
    updateSubUser,
    deleteSubUser,
  } = useAppContext();

  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  if (authLoading) {
    return null;
  }

  if (role !== 'manager') {
    return <Navigate to="/login" replace />;
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/subscribe" replace />;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const defaultTab = isMobile ? 'dashboard' : 'overview';

  if (!tab || !(VALID_TABS as readonly string[]).includes(tab) || (tab === 'overview' && isMobile)) {
    return <Navigate to={`/manager/${defaultTab}`} replace />;
  }

  const currentTab = tab as ManagerTab;

  return (
    <ManagerLayout
      units={units}
      users={users}
      orgs={orgs}
      venues={venues}
      activeTab={currentTab}
      onTabChange={(nextTab) => navigate(`/manager/${nextTab}`)}
      onSelectUnit={(id) => {
        setSelectedUnitId(id);
        navigate(`/device/${id}`);
      }}
      onTogglePower={handleTogglePower}
      onAddUser={async (u) => {
        const organizationIds = u.organizationIds || [];
        if (organizationIds.length === 0) {
          throw new Error('At least one organization is required');
        }
        return createSubUser({
          name: u.name.trim(),
          email: u.email.trim(),
          organizations: organizationIds,
          venues: u.assignedVenueIds || [],
          permission: u.permission || 'view',
        });
      }}
      onAddOrg={async (o) => {
        return createOrganization(o.name.trim(), o.address?.trim() || undefined);
      }}
      onAddVenue={async (v) => {
        return createVenue(v.name.trim(), v.orgId);
      }}
      onAddDevice={(d) => setUnits((prev) => [...prev, { ...d, id: `ac-${Date.now()}` }])}
      onDeleteUser={async (id) => {
        await deleteSubUser(id);
      }}
      onUpdateUser={async (id, data) => {
        await updateSubUser(id, {
          organizations: data.organizationIds,
          venues: data.assignedVenueIds,
          permission: data.permission,
        });
      }}
      onDeleteOrg={async (id) => {
        await deleteOrganization(id);
      }}
      onUpdateOrg={async (id, data) => {
        if (!data.name?.trim()) return;
        await updateOrganization(
          id,
          data.name.trim(),
          data.address?.trim() ?? ''
        );
      }}
      onDeleteVenue={async (id) => {
        await deleteVenue(id);
      }}
      onUpdateVenue={async (id, data) => {
        await updateVenue(id, {
          name: data.name?.trim(),
          organizationId: data.orgId,
        });
      }}
      onDeleteDevice={(id) => setUnits((prev) => prev.filter((u) => u.id !== id))}
      onUpdateDevice={(id, data) =>
        setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
      }
    >
      <ManagerTabContent tab={currentTab} />
    </ManagerLayout>
  );
}
