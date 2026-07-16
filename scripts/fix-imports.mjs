import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const map = {
  'components/Modal': 'components/ui/Modal',
  'components/CustomDropdown': 'components/ui/CustomDropdown',
  'components/MultiSelectDropdown': 'components/ui/MultiSelectDropdown',
  'components/ACKitLogo': 'components/ui/ACKitLogo',
  'components/ConsoleLayout': 'components/layout/ConsoleLayout',
  'components/Sidebar': 'components/layout/Sidebar',
  'components/AddOrgOverlayPage': 'components/overlays/AddOrgOverlayPage',
  'components/AddVenueOverlayPage': 'components/overlays/AddVenueOverlayPage',
  'components/AddDeviceOverlayPage': 'components/overlays/AddDeviceOverlayPage',
  'components/AddUserOverlayPage': 'components/overlays/AddUserOverlayPage',
  'components/OrgOverlayPage': 'components/overlays/OrgOverlayPage',
  'components/Dashboard': 'components/dashboard/Dashboard',
  'components/Reports': 'components/reports/Reports',
  'components/EnergyChart': 'components/reports/EnergyChart',
  'components/ACDetail': 'components/devices/ACDetail',
  'components/EventScheduler': 'components/devices/EventScheduler',
  'components/ACBrandManagement': 'components/devices/ACBrandManagement',
  'components/Login': 'components/auth/Login',
};

const files = walk('src');
let changed = 0;

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const orig = s;
  for (const [from, to] of Object.entries(map)) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(from ['"][^'"]*)${escaped}(['"])`, 'g');
    s = s.replace(re, `$1${to}$2`);
  }
  if (s !== orig) {
    fs.writeFileSync(f, s);
    changed++;
    console.log('updated', f);
  }
}
console.log('files updated', changed);
