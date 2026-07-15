import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { UserView } from '../../components/UserView';

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

  // Route protection
  if (role !== 'user') {
    return <Navigate to="/login" replace />;
  }

  const validTabs = ['dashboard', 'reports', 'devices'];
  const currentTab = tab && validTabs.includes(tab) ? tab : 'dashboard';

  // If no tab is specified in the URL, redirect to default
  if (!tab || !validTabs.includes(tab)) {
    return <Navigate to="/user/dashboard" replace />;
  }

  return (
    <UserView
      user={users[0]} // Mocking logged-in user
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
      onUpdateDevice={(id, data) => setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))}
    />
  );
}
