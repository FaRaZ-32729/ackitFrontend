import fs from 'fs';
import path from 'path';

const src = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');
const lines = src.split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

const root = 'src/manager';
const pagesDir = path.join(root, 'pages');
const componentsDir = path.join(root, 'components');
const contextDir = path.join(root, 'context');
fs.mkdirSync(pagesDir, { recursive: true });
fs.mkdirSync(componentsDir, { recursive: true });
fs.mkdirSync(contextDir, { recursive: true });

fs.writeFileSync(
  path.join(root, 'constants.ts'),
  `export const AC_BRANDS = [
  'Daikin',
  'Mitsubishi Electric',
  'Panasonic',
  'Toshiba',
  'Carrier',
  'LG',
  'Samsung',
  'Gree',
];
`
);

function unwrapTab(jsx, tab) {
  let s = jsx.trim();
  const prefix = `{activeTab === '${tab}' && (`;
  if (s.startsWith(prefix)) {
    s = s.slice(prefix.length).trim();
    if (s.endsWith(')}')) s = s.slice(0, -2).trim();
  } else if (s.startsWith(`{activeTab === '${tab}' && `)) {
    s = s.replace(`{activeTab === '${tab}' && `, '');
    if (s.endsWith('}')) s = s.slice(0, -1).trim();
  }
  return s;
}

const destructure = `  const {
    units, users, orgs, venues,
    onTabChange, onSelectUnit, onTogglePower,
    onAddUser, onAddOrg, onAddVenue, onAddDevice,
    onDeleteUser, onUpdateUser, onDeleteOrg, onUpdateOrg,
    onDeleteVenue, onUpdateVenue, onDeleteDevice, onUpdateDevice,
    showAddUser, setShowAddUser, addUserStep, setAddUserStep,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserStatus, setNewUserStatus, newUserVenues, setNewUserVenues,
    showAddOrg, setShowAddOrg, newOrgName, setNewOrgName,
    newOrgAddress, setNewOrgAddress, newOrgDescription, setNewOrgDescription,
    showAddVenue, setShowAddVenue, newVenueName, setNewVenueName, newVenueOrgId, setNewVenueOrgId,
    showAddDevice, setShowAddDevice, newDeviceName, setNewDeviceName,
    newDeviceOrgId, setNewDeviceOrgId, newDeviceVenueId, setNewDeviceVenueId,
    newDeviceBrand, setNewDeviceBrand, newDeviceEnergySensor, setNewDeviceEnergySensor,
    newDeviceCapacity, setNewDeviceCapacity,
    editingUser, setEditingUser, editingOrg, setEditingOrg,
    editingVenue, setEditingVenue, editingDevice, setEditingDevice,
    deletingId, setDeletingId, deleteType, setDeleteType,
    expandedDeviceId, setExpandedDeviceId,
    selectedDeviceVenueId, setSelectedDeviceVenueId,
    selectedVenueOrgId, setSelectedVenueOrgId,
    venueSearchQuery, setVenueSearchQuery, deviceSearchQuery, setDeviceSearchQuery,
    deviceTempInputs, setDeviceTempInputs,
    activeDetailType, setActiveDetailType, selectedUserForModal, setSelectedUserForModal,
    energyFilterType, setEnergyFilterType, selectedEnergyId, setSelectedEnergyId,
    energyView, setEnergyView,
    filteredUnits, aggregatedEnergyData, faultyDevices, handleDownloadReport,
    showAddEventModal, setShowAddEventModal,
    eventDeviceId, setEventDeviceId, eventName, setEventName, eventTemp, setEventTemp,
    eventIsRecurring, setEventIsRecurring, eventStartDate, setEventStartDate,
    eventEndDate, setEventEndDate, eventDays, setEventDays,
    eventIsOnOff, setEventIsOnOff, eventOnOffAction, setEventOnOffAction, eventTime, setEventTime,
    handleAddUser, closeAddUserModal, openUserDetailModal, closeUserDetailModal,
    handleAddOrg, handleAddVenue, handleAddDevice, closeAddEventModal, handleAddEvent,
    toggleVenue, filteredManagedVenues, filteredManagedDevices,
  } = useManagerWorkspace();`;

const tabMeta = [
  { file: 'OverviewPage.tsx', tab: 'overview', start: 425, end: 769, name: 'OverviewPage', extras: `import { EnergyChart } from '../../components/EnergyChart';\nimport { Activity, Download, AlertTriangle, Zap, Filter } from 'lucide-react';\nimport { CustomDropdown } from '../../components/CustomDropdown';` },
  { file: 'DashboardPage.tsx', tab: 'dashboard', start: 771, end: 787, name: 'DashboardPage', extras: `import { Dashboard } from '../../components/Dashboard';` },
  { file: 'ReportsPage.tsx', tab: 'reports', start: 789, end: 789, name: 'ReportsPage', extras: `import { Reports } from '../../components/Reports';` },
  { file: 'AcBrandsPage.tsx', tab: 'ac-brands', start: 791, end: 795, name: 'AcBrandsPage', extras: `import { ACBrandManagement } from '../../components/ACBrandManagement';` },
  { file: 'UsersPage.tsx', tab: 'users', start: 797, end: 1074, name: 'UsersPage', extras: `import { Users, User, Plus, Edit, Trash2, MapPin, MonitorSmartphone, Activity } from 'lucide-react';\nimport { MultiSelectDropdown } from '../../components/MultiSelectDropdown';\nimport { CustomDropdown } from '../../components/CustomDropdown';` },
  { file: 'OrganizationsPage.tsx', tab: 'organizations', start: 1076, end: 1294, name: 'OrganizationsPage', extras: `import { Building2, Plus, Edit, Trash2, MapPin } from 'lucide-react';` },
  { file: 'VenuesPage.tsx', tab: 'venues', start: 1296, end: 1561, name: 'VenuesPage', extras: `import { MapPin, Plus, Edit, Trash2, Search, Building2, MonitorSmartphone } from 'lucide-react';\nimport { CustomDropdown } from '../../components/CustomDropdown';` },
  { file: 'DevicesPage.tsx', tab: 'devices', start: 1563, end: 1905, name: 'DevicesPage', extras: `import { MonitorSmartphone, Plus, Edit, Trash2, Search, Check, AlertTriangle, CheckCircle2, Clock, Zap, Activity } from 'lucide-react';\nimport { CustomDropdown } from '../../components/CustomDropdown';\nimport { getACPowerDraw } from '../../types';` },
];

for (const t of tabMeta) {
  let body = unwrapTab(slice(t.start, t.end), t.tab);
  if (t.tab === 'reports') body = '<Reports units={units} />';

  const content = `import React from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
${t.extras}

/** Manager ${t.tab} page — markup/CSS preserved from legacy ManagerView */
export function ${t.name}() {
${destructure}

  return (
    <>
${body
  .split('\n')
  .map((l) => '      ' + l)
  .join('\n')}
    </>
  );
}
`;
  fs.writeFileSync(path.join(pagesDir, t.file), content);
  console.log('wrote', t.file, body.split('\n').length, 'jsx lines');
}

// Modals component
const modalsBody = slice(1907, 2757);
fs.writeFileSync(
  path.join(componentsDir, 'ManagerModals.tsx'),
  `import React from 'react';
import { Modal } from '../../components/Modal';
import { CustomDropdown } from '../../components/CustomDropdown';
import { MultiSelectDropdown } from '../../components/MultiSelectDropdown';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AC_BRANDS } from '../constants';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';

/** Shared manager modals (legacy root-level modals; CSS unchanged) */
export function ManagerModals() {
${destructure}

  return (
    <>
${modalsBody
  .split('\n')
  .map((l) => '      ' + l)
  .join('\n')}
    </>
  );
}
`
);
console.log('wrote ManagerModals.tsx');
console.log('done');
