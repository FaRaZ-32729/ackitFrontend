import fs from 'fs';
import path from 'path';

const src = fs.readFileSync('src/components/AdminView.tsx', 'utf8');
const lines = src.split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

const root = 'src/admin';
const pagesDir = path.join(root, 'pages');
const componentsDir = path.join(root, 'components');
fs.mkdirSync(pagesDir, { recursive: true });
fs.mkdirSync(componentsDir, { recursive: true });

const ALL_ICONS = [
  'Users', 'Building2', 'MapPin', 'MonitorSmartphone', 'CreditCard', 'Cpu', 'ChevronDown', 'ChevronUp',
  'Activity', 'Menu', 'Bell', 'Search', 'LogOut', 'Plus', 'Sparkles', 'Crown', 'Gift', 'Shield', 'X', 'Check',
  'ChevronRight', 'Info', 'ShieldAlert', 'Settings', 'Layers', 'Sliders', 'Play', 'Trash2', 'Zap', 'CloudUpload', 'RefreshCw',
];

function usedIcons(body) {
  return ALL_ICONS.filter((icon) => new RegExp(`\\b${icon}\\b`).test(body));
}

function unwrapTab(jsx, tab) {
  let s = jsx.trim();
  const prefix = `{currentTab === '${tab}' && (`;
  if (s.startsWith(prefix)) {
    s = s.slice(prefix.length).trim();
    if (s.endsWith(')}')) s = s.slice(0, -2).trim();
  }
  return s;
}

const destructure = `  const {
    managers, plans, orgs, venues, units, users, activeTab, onTabChange,
    onAddManager, onUpdateManagerPlan, onAddPlan, onLogout,
    currentTab, setCurrentTab,
    managementDropdownOpen, setManagementDropdownOpen,
    mobileSidebarOpen, setMobileSidebarOpen,
    expandedManagerId, setExpandedManagerId,
    selectedManagerId, setSelectedManagerId,
    managerDetailTab, setManagerDetailTab,
    selectedOtaVersion, setSelectedOtaVersion,
    otaVersions, setOtaVersions,
    deviceSearchQuery, setDeviceSearchQuery,
    selectedDeviceIds, setSelectedDeviceIds,
    uploadVersionId, setUploadVersionId,
    uploadFile, setUploadFile,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    otaStatus, setOtaStatus,
    otaProgress, setOtaProgress,
    onlineDevices, setOnlineDevices,
    handleStartOta, handleUploadFirmware,
    showAddManager, setShowAddManager,
    addManagerStep, setAddManagerStep,
    showAddPlan, setShowAddPlan,
    newManagerName, setNewManagerName,
    newManagerEmail, setNewManagerEmail,
    newManagerPlan, setNewManagerPlan,
    newPlanName, setNewPlanName,
    newPlanType, setNewPlanType,
    newPlanDescription, setNewPlanDescription,
    newPlanPrice, setNewPlanPrice,
    newPlanDuration, setNewPlanDuration,
    newPlanMaxOrgs, setNewPlanMaxOrgs,
    newPlanMaxVenues, setNewPlanMaxVenues,
    newPlanMaxDevices, setNewPlanMaxDevices,
    newPlanMaxUsers, setNewPlanMaxUsers,
    newPlanVisibility, setNewPlanVisibility,
    handleAddManager, closeAddManagerModal, handleAddPlan,
    toggleVisibility, toggleManager,
    totalManagersCount, activeManagersCount, inactiveManagersCount,
  } = useAdminWorkspace();`;

const tabMeta = [
  { file: 'ManagersPage.tsx', tab: 'managers', start: 502, end: 1036, name: 'ManagersPage' },
  { file: 'OrganizationsPage.tsx', tab: 'organizations', start: 1039, end: 1123, name: 'OrganizationsPage' },
  { file: 'VenuesPage.tsx', tab: 'venues', start: 1126, end: 1208, name: 'VenuesPage' },
  { file: 'DevicesPage.tsx', tab: 'devices', start: 1211, end: 1311, name: 'DevicesPage' },
  { file: 'AcBrandsPage.tsx', tab: 'ac-brands', start: 1314, end: 1318, name: 'AcBrandsPage', extras: `import { ACBrandManagement } from '../../components/ACBrandManagement';` },
  { file: 'PlansPage.tsx', tab: 'plans', start: 1321, end: 1417, name: 'PlansPage' },
  { file: 'OtaManagementPage.tsx', tab: 'ota-management', start: 1420, end: 1855, name: 'OtaManagementPage' },
];

for (const t of tabMeta) {
  const body = unwrapTab(slice(t.start, t.end), t.tab);
  const icons = usedIcons(body);
  const iconImport = icons.length ? `import { ${icons.join(', ')} } from 'lucide-react';\n` : '';
  const extras = t.extras ? t.extras + '\n' : '';

  const content = `import React from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
${iconImport}${extras}
/** Admin ${t.tab} page — markup/CSS preserved from legacy AdminView */
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

// Root drawers (AddPlanDrawer, AddManagerDrawer)
const drawerMeta = [
  { file: 'AddPlanDrawer.tsx', name: 'AddPlanDrawer', start: 1860, end: 2115 },
  { file: 'AddManagerDrawer.tsx', name: 'AddManagerDrawer', start: 2118, end: 2243 },
];

for (const d of drawerMeta) {
  const body = slice(d.start, d.end);
  const icons = usedIcons(body);
  const iconImport = icons.length ? `import { ${icons.join(', ')} } from 'lucide-react';\n` : '';

  const content = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
${iconImport}import { useAdminWorkspace } from '../context/AdminWorkspaceContext';

/** Root-level admin drawer (legacy markup/CSS unchanged) */
export function ${d.name}() {
${destructure}

  return (
${body
  .split('\n')
  .map((l) => '    ' + l)
  .join('\n')}
  );
}
`;
  fs.writeFileSync(path.join(componentsDir, d.file), content);
  console.log('wrote', d.file);
}

console.log('done');
