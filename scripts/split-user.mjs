import fs from 'fs';
import path from 'path';

const src = fs.readFileSync('src/components/UserView.tsx', 'utf8');
const lines = src.split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

const root = 'src/user';
const pagesDir = path.join(root, 'pages');
const contextDir = path.join(root, 'context');
fs.mkdirSync(pagesDir, { recursive: true });
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

// Extract helpers from UserView (encodeBase32 etc) - lines 40-67 approx
const helpers = `export function encodeBase32(str: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < str.length; i++) {
    bits += str.charCodeAt(i).toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}
`;

fs.writeFileSync(path.join(root, 'utils.ts'), helpers);

// Build context from UserView state (lines ~69-208 before return)
// Read UserView to get exact ranges
const userView = fs.readFileSync('src/components/UserView.tsx', 'utf8');
const uvLines = userView.split(/\r?\n/);

// Find export function UserView and return (
let startBody = -1;
let returnLine = -1;
for (let i = 0; i < uvLines.length; i++) {
  if (uvLines[i].includes('export function UserView')) startBody = i + 1;
  if (startBody > 0 && uvLines[i].trim() === 'return (') {
    returnLine = i;
    break;
  }
}
console.log('UserView body', startBody + 1, 'to', returnLine);

const propsDestructure = uvLines.slice(startBody, returnLine).join('\n');
// The body includes props destructuring from the function - we need only inside the function after props

fs.writeFileSync(
  'src/user/_debug_body.txt',
  propsDestructure.slice(0, 500) + '\n---\nstart:' + startBody + ' return:' + returnLine
);

function unwrap(jsx, tab) {
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
    user, units, orgs, venues, activeTab,
    onTabChange, onSelectUnit, onTogglePower,
    onAddDevice, onDeleteDevice, onUpdateDevice,
    searchQuery, setSearchQuery,
    selectedBrandFilter, setSelectedBrandFilter,
    selectedDeviceVenueId, setSelectedDeviceVenueId,
    deviceName, setDeviceName, acBrand, setAcBrand,
    selectedOrgId, setSelectedOrgId, selectedVenueId, setSelectedVenueId,
    editingUnitId, setEditingUnitId, revealApiKey, setRevealApiKey, copied, setCopied,
    assignedVenues, assignedUnits, filteredUnits, currentApiKey,
    handleEditClick, resetForm, handleSave, generateApiKey, handleCopy,
  } = useUserWorkspace();`;

const tabs = [
  { file: 'UserDashboardPage.tsx', tab: 'dashboard', start: 217, end: 237, name: 'UserDashboardPage', extras: `import { Dashboard } from '../../components/Dashboard';` },
  { file: 'UserReportsPage.tsx', tab: 'reports', start: 239, end: 239, name: 'UserReportsPage', extras: `import { Reports } from '../../components/Reports';` },
  { file: 'UserDevicesPage.tsx', tab: 'devices', start: 241, end: 546, name: 'UserDevicesPage', extras: `import { MonitorSmartphone, Plus, Edit, Trash2, Check, Copy, Building2, MapPin, Sparkles, Search, Eye, EyeOff, Zap } from 'lucide-react';\nimport { getACPowerDraw } from '../../types';\nimport { AC_BRANDS } from '../constants';` },
];

for (const t of tabs) {
  let body = unwrap(slice(t.start, t.end), t.tab);
  if (t.tab === 'reports') body = '<Reports units={assignedUnits} />';
  fs.writeFileSync(
    path.join(pagesDir, t.file),
    `import React from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
${t.extras}

/** User ${t.tab} page — markup/CSS preserved from legacy UserView */
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
`
  );
  console.log('wrote', t.file);
}

console.log('user pages done');
