import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ManagerLayout } from '../ManagerLayout';
import { OverviewPage } from './OverviewPage';
import { DashboardPage } from './DashboardPage';
import { ReportsPage } from './ReportsPage';
import { AcBrandsPage } from './AcBrandsPage';
import { UsersPage } from './UsersPage';
import { OrganizationsPage } from './OrganizationsPage';
import { VenuesPage } from './VenuesPage';
import { DevicesPage } from './DevicesPage';

const VALID_TABS = [
  'overview',
  'dashboard',
  'reports',
  'ac-brands',
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
    case 'ac-brands':
      return <AcBrandsPage />;
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
    units,
    setUnits,
    users,
    setUsers,
    orgs,
    setOrgs,
    venues,
    setVenues,
    setSelectedUnitId,
    handleTogglePower,
  } = useAppContext();

  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  if (role !== 'manager') {
    return <Navigate to="/login" replace />;
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
      onAddUser={(u) => setUsers((prev) => [...prev, { ...u, id: `usr-${Date.now()}` }])}
      onAddOrg={(o) => setOrgs((prev) => [...prev, { ...o, id: `org-${Date.now()}` }])}
      onAddVenue={(v) => setVenues((prev) => [...prev, { ...v, id: `ven-${Date.now()}` }])}
      onAddDevice={(d) => setUnits((prev) => [...prev, { ...d, id: `ac-${Date.now()}` }])}
      onDeleteUser={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
      onUpdateUser={(id, data) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
      }
      onDeleteOrg={(id) => setOrgs((prev) => prev.filter((o) => o.id !== id))}
      onUpdateOrg={(id, data) =>
        setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)))
      }
      onDeleteVenue={(id) => setVenues((prev) => prev.filter((v) => v.id !== id))}
      onUpdateVenue={(id, data) =>
        setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)))
      }
      onDeleteDevice={(id) => setUnits((prev) => prev.filter((u) => u.id !== id))}
      onUpdateDevice={(id, data) =>
        setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
      }
    >
      <ManagerTabContent tab={currentTab} />
    </ManagerLayout>
  );
}
