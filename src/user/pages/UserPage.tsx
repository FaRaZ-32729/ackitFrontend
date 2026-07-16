import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { UserLayout } from '../UserLayout';
import { UserDashboardPage } from './UserDashboardPage';
import { UserReportsPage } from './UserReportsPage';
import { UserDevicesPage } from './UserDevicesPage';
import { UserAcBrandsPage } from './UserAcBrandsPage';

const VALID_TABS = ['dashboard', 'reports', 'devices', 'ac-brands'] as const;
type UserTab = (typeof VALID_TABS)[number];

function UserTabContent({ tab }: { tab: UserTab }) {
  switch (tab) {
    case 'dashboard':
      return <UserDashboardPage />;
    case 'reports':
      return <UserReportsPage />;
    case 'devices':
      return <UserDevicesPage />;
    case 'ac-brands':
      return <UserAcBrandsPage />;
    default:
      return null;
  }
}

export function UserPage() {
  const {
    role,
    units,
    setUnits,
    users,
    orgs,
    venues,
    setSelectedUnitId,
    handleTogglePower,
  } = useAppContext();

  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  if (role !== 'user') {
    return <Navigate to="/login" replace />;
  }

  if (!tab || !(VALID_TABS as readonly string[]).includes(tab)) {
    return <Navigate to="/user/dashboard" replace />;
  }

  const currentTab = tab as UserTab;

  return (
    <UserLayout
      user={users[0]}
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
