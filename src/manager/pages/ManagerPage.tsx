import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ManagerView } from '../../components/ManagerView';

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

  // Route protection
  if (role !== 'manager') {
    return <Navigate to="/login" replace />;
  }

  const validTabs = ['overview', 'dashboard', 'reports', 'ac-brands', 'users', 'organizations', 'venues', 'devices'];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const defaultTab = isMobile ? 'dashboard' : 'overview';

  // If no tab is specified in the URL, or if it is an invalid tab, or if trying to access overview on mobile, redirect
  if (!tab || !validTabs.includes(tab) || (tab === 'overview' && isMobile)) {
    return <Navigate to={`/manager/${defaultTab}`} replace />;
  }

  const currentTab = tab;

  return (
    <ManagerView
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
      onUpdateUser={(id, data) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))}
      onDeleteOrg={(id) => setOrgs((prev) => prev.filter((o) => o.id !== id))}
      onUpdateOrg={(id, data) => setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)))}
      onDeleteVenue={(id) => setVenues((prev) => prev.filter((v) => v.id !== id))}
      onUpdateVenue={(id, data) => setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)))}
      onDeleteDevice={(id) => setUnits((prev) => prev.filter((u) => u.id !== id))}
      onUpdateDevice={(id, data) => setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))}
    />
  );
}
