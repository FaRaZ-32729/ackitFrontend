import fs from 'fs';
import path from 'path';

const fixes = [
  // layout
  {
    file: 'src/components/layout/ConsoleLayout.tsx',
    replacements: [
      ["./'", "never"],
      ["from './Sidebar'", "from './Sidebar'"],
      ["from './OrgOverlayPage'", "from '../overlays/OrgOverlayPage'"],
      ["from './AddOrgOverlayPage'", "from '../overlays/AddOrgOverlayPage'"],
      ["from './AddVenueOverlayPage'", "from '../overlays/AddVenueOverlayPage'"],
      ["from './AddDeviceOverlayPage'", "from '../overlays/AddDeviceOverlayPage'"],
      ["from './AddUserOverlayPage'", "from '../overlays/AddUserOverlayPage'"],
      ["from './ACKitLogo'", "from '../ui/ACKitLogo'"],
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
    ],
  },
  {
    file: 'src/components/layout/Sidebar.tsx',
    replacements: [
      ["from '../types'", "from '../../types'"],
      ["from './ACKitLogo'", "from '../ui/ACKitLogo'"],
    ],
  },
  {
    file: 'src/components/auth/Login.tsx',
    replacements: [
      ["from '../types'", "from '../../types'"],
      ["from './ACKitLogo'", "from '../ui/ACKitLogo'"],
    ],
  },
  {
    file: 'src/components/dashboard/Dashboard.tsx',
    replacements: [
      ["from '../types'", "from '../../types'"],
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
      ["from './Modal'", "from '../ui/Modal'"],
      ["from './ACKitLogo'", "from '../ui/ACKitLogo'"],
      ["from './CustomDropdown'", "from '../ui/CustomDropdown'"],
    ],
  },
  {
    file: 'src/components/devices/ACDetail.tsx',
    replacements: [
      ["from '../types'", "from '../../types'"],
      ["from './EnergyChart'", "from '../reports/EnergyChart'"],
    ],
  },
  {
    file: 'src/components/devices/EventScheduler.tsx',
    replacements: [["from '../types'", "from '../../types'"]],
  },
  {
    file: 'src/components/reports/EnergyChart.tsx',
    replacements: [["from '../types'", "from '../../types'"]],
  },
  {
    file: 'src/components/reports/Reports.tsx',
    replacements: [
      ["from '../types'", "from '../../types'"],
      ["from './EnergyChart'", "from './EnergyChart'"],
      ["from './CustomDropdown'", "from '../ui/CustomDropdown'"],
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
    ],
  },
  {
    file: 'src/components/overlays/AddDeviceOverlayPage.tsx',
    replacements: [
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
      ["from './CustomDropdown'", "from '../ui/CustomDropdown'"],
    ],
  },
  {
    file: 'src/components/overlays/AddOrgOverlayPage.tsx',
    replacements: [["from '../context/AppContext'", "from '../../context/AppContext'"]],
  },
  {
    file: 'src/components/overlays/AddUserOverlayPage.tsx',
    replacements: [
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
      ["from './CustomDropdown'", "from '../ui/CustomDropdown'"],
    ],
  },
  {
    file: 'src/components/overlays/AddVenueOverlayPage.tsx',
    replacements: [
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
      ["from './CustomDropdown'", "from '../ui/CustomDropdown'"],
    ],
  },
  {
    file: 'src/components/overlays/OrgOverlayPage.tsx',
    replacements: [["from '../context/AppContext'", "from '../../context/AppContext'"]],
  },
];

// Also fix ui components that import from ../types or ../index.css paths
for (const name of ['Modal.tsx', 'CustomDropdown.tsx', 'MultiSelectDropdown.tsx', 'ACKitLogo.tsx']) {
  const file = `src/components/ui/${name}`;
  if (!fs.existsSync(file)) continue;
  fixes.push({
    file,
    replacements: [
      ["from '../types'", "from '../../types'"],
      ["from '../context/AppContext'", "from '../../context/AppContext'"],
    ],
  });
}

for (const { file, replacements } of fixes) {
  if (!fs.existsSync(file)) {
    console.log('skip missing', file);
    continue;
  }
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  for (const [from, to] of replacements) {
    if (from === "from './'" || from.includes('never')) continue;
    s = s.split(from).join(to);
  }
  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log('fixed', file);
  } else {
    console.log('no change', file);
  }
}
