import React from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { AdminLayout } from '../AdminLayout';
import { ManagersPage } from './ManagersPage';
import { OrganizationsPage } from './OrganizationsPage';
import { VenuesPage } from './VenuesPage';
import { DevicesPage } from './DevicesPage';
import { AcBrandsPage } from './AcBrandsPage';
import { PlansPage } from './PlansPage';
import { OtaManagementPage } from './OtaManagementPage';
import { createManagerByAdmin } from '../../api/authApi';

const VALID_TABS = [
  'managers',
  'organizations',
  'venues',
  'devices',
  'ac-brands',
  'plans',
  'ota-management',
] as const;

type AdminTab = (typeof VALID_TABS)[number];

function AdminTabContent({ tab }: { tab: AdminTab }) {
  switch (tab) {
    case 'managers':
      return <ManagersPage />;
    case 'organizations':
      return <OrganizationsPage />;
    case 'venues':
      return <VenuesPage />;
    case 'devices':
      return <DevicesPage />;
    case 'ac-brands':
      return <AcBrandsPage />;
    case 'plans':
      return <PlansPage />;
    case 'ota-management':
      return <OtaManagementPage />;
    default:
      return null;
  }
}

export function AdminPage() {
  const {
    role,
    logout,
    managers,
    setManagers,
    plans,
    orgs,
    venues,
    units,
    users,
    createPlan,
  } = useAppContext();

  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();

  if (role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  if (!tab || !(VALID_TABS as readonly string[]).includes(tab)) {
    return <Navigate to="/admin/managers" replace />;
  }

  const currentTab = tab as AdminTab;

  return (
    <AdminLayout
      managers={managers}
      plans={plans}
      orgs={orgs}
      venues={venues}
      units={units}
      users={users}
      activeTab={currentTab}
      onTabChange={(nextTab) => navigate(`/admin/${nextTab}`)}
      onAddManager={async ({ name, email }) => {
        const response = await createManagerByAdmin(name, email);
        setManagers((prev) => [
          ...prev,
          {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            status: 'pending',
            planId: '',
          },
        ]);
      }}
      onAddPlan={async (payload) => {
        await createPlan(payload);
      }}
      onUpdateManagerPlan={(mgrId, planId) =>
        setManagers((prev) => prev.map((m) => (m.id === mgrId ? { ...m, planId } : m)))
      }
      onLogout={() => {
        void logout().then(() => navigate('/login'));
      }}
    >
      <AdminTabContent tab={currentTab} />
    </AdminLayout>
  );
}
