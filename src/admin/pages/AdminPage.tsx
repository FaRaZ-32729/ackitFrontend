import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { AdminView } from '../../components/AdminView';

export function AdminPage() {
  const { 
    role, 
    setRole,
    managers, 
    setManagers,
    plans, 
    setPlans,
    orgs, 
    venues, 
    units, 
    users,
    setSelectedUnitId 
  } = useAppContext();

  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  // Route protection
  if (role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const validTabs = ['managers', 'organizations', 'venues', 'devices', 'ac-brands', 'plans', 'ota-management'];
  const currentTab = tab && validTabs.includes(tab) ? tab : 'managers';

  // If no tab is specified in the URL, redirect to default
  if (!tab || !validTabs.includes(tab)) {
    return <Navigate to="/admin/managers" replace />;
  }

  return (
    <AdminView
      managers={managers}
      plans={plans}
      orgs={orgs}
      venues={venues}
      units={units}
      users={users}
      activeTab={currentTab}
      onAddManager={(m) => setManagers((prev) => [...prev, { ...m, id: `mgr-${Date.now()}` }])}
      onAddPlan={(p) => setPlans((prev) => [...prev, { ...p, id: `plan-${Date.now()}` }])}
      onUpdateManagerPlan={(mgrId, planId) => 
        setManagers((prev) => prev.map((m) => (m.id === mgrId ? { ...m, planId } : m)))
      }
      onLogout={() => {
        setRole(null);
        setSelectedUnitId(null);
        navigate('/login');
      }}
    />
  );
}
