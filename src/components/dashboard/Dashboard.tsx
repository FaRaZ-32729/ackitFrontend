import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ACUnit, Role, Organization, Venue, ACEvent } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { getDevicesByVenue, setDevicePower, setDeviceTemperature, setDeviceMode, setDeviceFan } from '../../api/deviceApi';
import { 
  Power, 
  Thermometer, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Activity, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Fan, 
  Sparkles, 
  Snowflake, 
  Sun, 
  Droplet, 
  Wind, 
  X, 
  Check, 
  Building2, 
  MapPin, 
  Gauge, 
  ChevronDown,
  AlertCircle,
  Bell,
  Zap,
  MonitorSmartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Modal } from '../ui/Modal';
import { ACKitLogo } from '../ui/ACKitLogo';
import { CustomDropdown } from '../ui/CustomDropdown';

const TEMP_MIN = 16;
const TEMP_MAX = 30;
const TEMP_ECO = 24;
const TEMP_DEBOUNCE_MS = 2000;

function isDeviceOnline(unit: ACUnit): boolean {
  // Missing status = treat as online (legacy/static units); real API devices set status
  return unit.status !== 'offline';
}

/** Org/venue bulk: online devices that are NOT super-locked (lock + unlock are included) */
function isOrgVenueBulkTarget(unit: ACUnit): boolean {
  return isDeviceOnline(unit) && !unit.eventLocked;
}

function filterPowerTempTargets(
  units: ACUnit[],
  skipSuperlock: boolean
): ACUnit[] {
  return units.filter(
    (u) => isDeviceOnline(u) && !(skipSuperlock && u.eventLocked)
  );
}

interface DashboardProps {
  units: ACUnit[];
  role: Role;
  onSelectUnit: (id: string) => void;
  onTogglePower: (id: string) => void;
  orgs?: Organization[];
  venues?: Venue[];
  onAddDeviceClick?: () => void;
  onUpdateDevice?: (id: string, data: Partial<ACUnit>) => void;
  onViewDevicesOfVenue?: (venueId: string) => void;
}

export function Dashboard({ 
  units, 
  role, 
  onSelectUnit, 
  onTogglePower, 
  orgs = [], 
  venues = [], 
  onAddDeviceClick,
  onUpdateDevice,
  onViewDevicesOfVenue
}: DashboardProps) {
  const isManager = role === 'manager';

  const { 
    selectedVenueId: globalVenueId, 
    setSelectedVenueId: setGlobalVenueId, 
    selectedUnitId: globalUnitId, 
    setSelectedUnitId: setGlobalUnitId,
    selectedOrgId: globalOrgId,
    setSelectedOrgId: setGlobalOrgId,
    setUnits,
    units: contextUnits,
  } = useAppContext();

  // Prefer live units from context (dashboard page may pass stale/mock list)
  const liveUnits = contextUnits.length > 0 ? contextUnits : units;

  const selectedVenueId = globalVenueId || 'all';
  const setSelectedVenueId = (val: string) => {
    setGlobalVenueId(val === 'all' ? null : val);
    setGlobalUnitId(null);
  };

  // 2. Chart Active Tab
  const [activeChartTab, setActiveChartTab] = useState<'hours' | 'energy' | 'maintenance'>('hours');

  // 3. Maintenance List Expansion State
  const [expandedMaintenanceVenueId, setExpandedMaintenanceVenueId] = useState<string | null>(null);

  // 4. State for Schedule Creator Form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('10:30');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('04:00');
  const [newScheduleAction, setNewScheduleAction] = useState<'ON' | 'OFF' | 'SET_TEMP'>('OFF');
  const [newScheduleTemp, setNewScheduleTemp] = useState(26);
  const [newScheduleDays, setNewScheduleDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  // Dropdown states for AC Operations and Fan Speed
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showFanDropdown, setShowFanDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Layout density mode: 'standard' or 'dense'
  const [gridDensity, setGridDensity] = useState<'standard' | 'dense'>('standard');
  const mobileArcSvgRef = useRef<SVGSVGElement>(null);
  const isDraggingMobileArc = useRef(false);
  const [loadingOrgDevices, setLoadingOrgDevices] = useState(false);
  /** Draft temperatures while user adjusts before the 2s debounce apply */
  const [draftTemps, setDraftTemps] = useState<Record<string, number>>({});
  const tempDebounceTimers = useRef<Record<string, number>>({});
  const [bulkToast, setBulkToast] = useState<{
    message: string;
    type: 'error' | 'info';
  } | null>(null);
  const bulkToastTimer = useRef<number | null>(null);
  const [bulkPowerPending, setBulkPowerPending] = useState(false);

  const showBulkToast = useCallback(
    (message: string, type: 'error' | 'info' = 'error') => {
      if (bulkToastTimer.current) window.clearTimeout(bulkToastTimer.current);
      setBulkToast({ message, type });
      bulkToastTimer.current = window.setTimeout(() => {
        setBulkToast(null);
        bulkToastTimer.current = null;
      }, 3500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (bulkToastTimer.current) window.clearTimeout(bulkToastTimer.current);
    };
  }, []);

  // Default / keep valid selected organization
  useEffect(() => {
    if (orgs.length === 0) {
      if (globalOrgId) setGlobalOrgId(null);
      return;
    }
    const stillValid = globalOrgId && orgs.some((o) => o.id === globalOrgId);
    if (!stillValid) {
      setGlobalOrgId(orgs[0].id);
    }
  }, [orgs, globalOrgId, setGlobalOrgId]);

  const activeOrg =
    orgs.find((o) => o.id === globalOrgId) || orgs[0] || ({ id: '', name: 'Organization' } as Organization);

  const orgVenues = useMemo(
    () => (globalOrgId ? venues.filter((v) => v.orgId === globalOrgId) : venues),
    [venues, globalOrgId]
  );

  // If selected venue is not in current org, fall back to All Venues
  useEffect(() => {
    if (!globalVenueId) return;
    const ok = orgVenues.some((v) => v.id === globalVenueId);
    if (!ok) {
      setGlobalVenueId(null);
      setGlobalUnitId(null);
    }
  }, [orgVenues, globalVenueId, setGlobalVenueId, setGlobalUnitId]);

  const handleOrgChange = useCallback(
    (orgId: string) => {
      setGlobalOrgId(orgId);
      setGlobalVenueId(null);
      setGlobalUnitId(null);
    },
    [setGlobalOrgId, setGlobalVenueId, setGlobalUnitId]
  );

  // Load devices for venues of the active organization
  useEffect(() => {
    let active = true;
    if (!globalOrgId || orgVenues.length === 0) {
      setLoadingOrgDevices(false);
      return () => {
        active = false;
      };
    }

    setLoadingOrgDevices(true);
    Promise.all(orgVenues.map((v) => getDevicesByVenue(v.id).catch(() => [] as ACUnit[])))
      .then((lists) => {
        if (!active) return;
        const merged = lists.flat();
        setUnits((prev) => {
          const real = prev.filter((u) => /^[a-fA-F0-9]{24}$/.test(u.id));
          const byId = new Map(real.map((u) => [u.id, u]));
          // Drop devices that belong to venues of this org (refresh), keep other orgs
          const orgVenueIds = new Set(orgVenues.map((v) => v.id));
          for (const [id, unit] of [...byId.entries()]) {
            if (orgVenueIds.has(unit.venueId)) byId.delete(id);
          }
          merged.forEach((device) => {
            const existing = byId.get(device.id);
            byId.set(device.id, existing ? { ...existing, ...device } : device);
          });
          return Array.from(byId.values());
        });
      })
      .finally(() => {
        if (active) setLoadingOrgDevices(false);
      });

    return () => {
      active = false;
    };
  }, [globalOrgId, orgVenues, setUnits]);

  // 6. Filtering units based on selected venue or device (scoped to active org)
  const selectedUnits = useMemo(() => {
    const orgVenueIds = new Set(orgVenues.map((v) => v.id));
    const orgScoped = liveUnits.filter((u) => orgVenueIds.has(u.venueId));

    if (globalUnitId) {
      const fromOrg = orgScoped.filter((u) => u.id === globalUnitId);
      if (fromOrg.length > 0) return fromOrg;
      // Fallback: device may be selected before venueId is hydrated
      return liveUnits.filter((u) => u.id === globalUnitId);
    }
    if (selectedVenueId === 'all') {
      return orgScoped;
    }
    return orgScoped.filter((u) => u.venueId === selectedVenueId);
  }, [liveUnits, globalUnitId, selectedVenueId, orgVenues]);

  const orgUnits = useMemo(() => {
    const orgVenueIds = new Set(orgVenues.map((v) => v.id));
    return liveUnits.filter((u) => orgVenueIds.has(u.venueId));
  }, [liveUnits, orgVenues]);

  const sumLivePowerKw = useCallback((unitsList: ACUnit[]) => {
    return Number(
      unitsList
        .reduce((acc, u) => acc + (Number(u.powerConsumption) || 0), 0)
        .toFixed(2)
    );
  }, []);

  // Live power sum for organization card (all devices in selected org)
  const orgPowerKw = useMemo(
    () => sumLivePowerKw(orgUnits),
    [orgUnits, sumLivePowerKw]
  );

  // Aggregate stats for selected units
  const totalUnitsCount = selectedUnits.length;
  const activeUnitsCount = selectedUnits.filter(u => u.isOn).length;
  const faultUnitsCount = selectedUnits.filter(u => u.hasFault).length;
  const totalEnergy = useMemo(() => {
    return Number(selectedUnits.reduce((acc, u) => {
      const lastMonthData = u.energyConsumption?.monthly;
      const kwh = lastMonthData && lastMonthData.length > 0 
        ? lastMonthData[lastMonthData.length - 1].kwh 
        : 12;
      return acc + kwh;
    }, 0).toFixed(1));
  }, [selectedUnits]);

  const orgTempScopeKey = `org:${globalOrgId || 'none'}`;
  const frameTempScopeKey = globalUnitId
    ? `device:${globalUnitId}`
    : selectedVenueId === 'all'
      ? orgTempScopeKey
      : `venue:${selectedVenueId}`;

  const getVenueTempScopeKey = useCallback(
    (venueId: string) => `venue:${venueId}`,
    []
  );

  const resolveDisplayTemp = useCallback(
    (units: ACUnit[], scopeKey: string): number | 'Mixed' => {
      if (draftTemps[scopeKey] != null) return draftTemps[scopeKey];
      if (units.length === 0) return TEMP_ECO;
      const firstTemp = units[0].targetTemp;
      const allSame = units.every((u) => u.targetTemp === firstTemp);
      return allSame ? firstTemp : 'Mixed';
    },
    [draftTemps]
  );

  // Determine target temperature of selected venue (or "Mixed")
  const targetTempState = useMemo(
    () => resolveDisplayTemp(selectedUnits, frameTempScopeKey),
    [selectedUnits, frameTempScopeKey, resolveDisplayTemp]
  );

  const orgCardTempState = useMemo(
    () => resolveDisplayTemp(orgUnits, orgTempScopeKey),
    [orgUnits, orgTempScopeKey, resolveDisplayTemp]
  );

  // Clear draft when org/venue/device selection changes
  useEffect(() => {
    setDraftTemps({});
    Object.values(tempDebounceTimers.current).forEach((id) => window.clearTimeout(id));
    tempDebounceTimers.current = {};
  }, [globalOrgId, selectedVenueId, globalUnitId]);

  useEffect(() => {
    return () => {
      Object.values(tempDebounceTimers.current).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Determine lock status of selected venue
  const lockState = useMemo(() => {
    if (selectedUnits.length === 0) return 'Unlocked';
    const allSuperLocked = selectedUnits.every(u => u.isLocked && u.eventLocked);
    if (allSuperLocked) return 'Super Locked';
    const allLocked = selectedUnits.every(u => u.isLocked);
    if (allLocked) return 'Locked';
    const allUnlocked = selectedUnits.every(u => !u.isLocked);
    if (allUnlocked) return 'Unlocked';
    return 'Mixed';
  }, [selectedUnits]);

  // Dropdown states
  const [showLockDropdown, setShowLockDropdown] = useState(false);
  const [showVenueLockDropdownId, setShowVenueLockDropdownId] = useState<string | null>(null);

  const applyBulkPower = useCallback(
    async (units: ACUnit[], turnOn: boolean, skipSuperlock = true) => {
      const targets = filterPowerTempTargets(units, skipSuperlock);
      if (targets.length === 0) {
        const online = units.filter(isDeviceOnline);
        const onlySuper =
          skipSuperlock &&
          online.length > 0 &&
          online.every((u) => u.eventLocked);
        showBulkToast(
          onlySuper
            ? 'Super-locked devices were skipped'
            : 'No online devices available to control',
          'error'
        );
        return;
      }
      setBulkPowerPending(true);
      const state: 'on' | 'off' = turnOn ? 'on' : 'off';
      const results = await Promise.allSettled(
        targets.map((u) => setDevicePower(u.id, state))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        showBulkToast(
          failed === results.length
            ? 'Failed to send power command'
            : `Power sent to ${results.length - failed}/${results.length} devices`,
          failed === results.length ? 'error' : 'info'
        );
      }
      // Actual isOn updates arrive via device:state socket
      setBulkPowerPending(false);
    },
    [showBulkToast]
  );

  const applyBulkTemperature = useCallback(
    async (units: ACUnit[], temperature: number, skipSuperlock = true) => {
      const clamped = Math.max(TEMP_MIN, Math.min(TEMP_MAX, Math.round(temperature)));
      const targets = filterPowerTempTargets(units, skipSuperlock);
      if (targets.length === 0) {
        const online = units.filter(isDeviceOnline);
        const onlySuper =
          skipSuperlock &&
          online.length > 0 &&
          online.every((u) => u.eventLocked);
        showBulkToast(
          onlySuper
            ? 'Super-locked devices were skipped'
            : 'No online devices available to set temperature',
          'error'
        );
        return;
      }
      // Optimistic local update while ESP confirms over socket
      targets.forEach((u) => {
        if (onUpdateDevice) onUpdateDevice(u.id, { targetTemp: clamped, currentTemp: clamped });
        else {
          setUnits((prev) =>
            prev.map((item) =>
              item.id === u.id
                ? { ...item, targetTemp: clamped, currentTemp: clamped }
                : item
            )
          );
        }
      });
      const results = await Promise.allSettled(
        targets.map((u) => setDeviceTemperature(u.id, clamped))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        showBulkToast(
          failed === results.length
            ? 'Failed to send temperature command'
            : `Temp sent to ${results.length - failed}/${results.length} devices`,
          failed === results.length ? 'error' : 'info'
        );
      }
    },
    [onUpdateDevice, setUnits, showBulkToast]
  );

  const scheduleBulkTemperature = useCallback(
    (scopeKey: string, units: ACUnit[], temperature: number, skipSuperlock = true) => {
      const existing = tempDebounceTimers.current[scopeKey];
      if (existing) window.clearTimeout(existing);

      tempDebounceTimers.current[scopeKey] = window.setTimeout(() => {
        void applyBulkTemperature(units, temperature, skipSuperlock).finally(() => {
          delete tempDebounceTimers.current[scopeKey];
          setDraftTemps((prev) => {
            const next = { ...prev };
            delete next[scopeKey];
            return next;
          });
        });
      }, TEMP_DEBOUNCE_MS);
    },
    [applyBulkTemperature]
  );

  const handleScopeTempAdjust = useCallback(
    (scopeKey: string, units: ACUnit[], increment: number, skipSuperlock = true) => {
      if (units.length === 0) return;
      const current = resolveDisplayTemp(units, scopeKey);

      // Mixed → first snap UI to eco 24; further +/- (or wait 2s at 24) apply via debounce
      if (current === 'Mixed') {
        setDraftTemps((prev) => ({ ...prev, [scopeKey]: TEMP_ECO }));
        scheduleBulkTemperature(scopeKey, units, TEMP_ECO, skipSuperlock);
        return;
      }

      const next = Math.max(TEMP_MIN, Math.min(TEMP_MAX, current + increment));
      setDraftTemps((prev) => ({ ...prev, [scopeKey]: next }));
      scheduleBulkTemperature(scopeKey, units, next, skipSuperlock);
    },
    [resolveDisplayTemp, scheduleBulkTemperature]
  );

  const handleScopeTempSet = useCallback(
    (scopeKey: string, units: ACUnit[], temperature: number, skipSuperlock = true) => {
      if (units.length === 0) return;
      const clamped = Math.max(TEMP_MIN, Math.min(TEMP_MAX, Math.round(temperature)));
      setDraftTemps((prev) => ({ ...prev, [scopeKey]: clamped }));
      scheduleBulkTemperature(scopeKey, units, clamped, skipSuperlock);
    },
    [scheduleBulkTemperature]
  );

  const handleScopeEco = useCallback(
    (scopeKey: string, units: ACUnit[], skipSuperlock = true) => {
      if (units.length === 0) return;
      const existing = tempDebounceTimers.current[scopeKey];
      if (existing) {
        window.clearTimeout(existing);
        delete tempDebounceTimers.current[scopeKey];
      }
      setDraftTemps((prev) => ({ ...prev, [scopeKey]: TEMP_ECO }));
      void applyBulkTemperature(units, TEMP_ECO, skipSuperlock).finally(() => {
        setDraftTemps((prev) => {
          const next = { ...prev };
          delete next[scopeKey];
          return next;
        });
      });
    },
    [applyBulkTemperature]
  );

  // Active Control Frame — skip superlock for org/venue; allow direct control of a single device
  const skipSuperlockForFrame = !globalUnitId;

  const handleBulkPowerToggle = (forceState?: boolean) => {
    if (bulkPowerPending) return;
    const targets = filterPowerTempTargets(selectedUnits, skipSuperlockForFrame);
    const newState =
      forceState !== undefined
        ? forceState
        : !targets.every((u) => u.isOn);
    void applyBulkPower(selectedUnits, newState, skipSuperlockForFrame);
  };

  const handleBulkTempAdjust = (increment: number) => {
    handleScopeTempAdjust(
      frameTempScopeKey,
      selectedUnits,
      increment,
      skipSuperlockForFrame
    );
  };

  const handleBulkTempSet = (temp: number) => {
    handleScopeTempSet(
      frameTempScopeKey,
      selectedUnits,
      temp,
      skipSuperlockForFrame
    );
  };

  const handleBulkEco = () => {
    handleScopeEco(frameTempScopeKey, selectedUnits, skipSuperlockForFrame);
  };

  const handleOrgPowerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bulkPowerPending) return;
    const targets = orgUnits.filter(isOrgVenueBulkTarget);
    const allOn = targets.length > 0 && targets.every((u) => u.isOn);
    void applyBulkPower(orgUnits, !allOn, true);
  };

  const handleOrgTempAdjust = (increment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    handleScopeTempAdjust(orgTempScopeKey, orgUnits, increment, true);
  };

  const tempFromMobileArcPoint = (clientX: number, clientY: number): number | null => {
    const svg = mobileArcSvgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    const dx = local.x - 110;
    const dy = local.y - 110;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    // Arc runs 140° → 400° (wraps past 360 to 40°)
    let progress: number;
    if (deg >= 140) {
      progress = (deg - 140) / 260;
    } else if (deg <= 40) {
      progress = (deg + 220) / 260;
    } else {
      // Bottom gap outside the arc — snap to nearest end
      progress = deg < 90 ? 1 : 0;
    }
    progress = Math.max(0, Math.min(1, progress));
    return Math.round(TEMP_MIN + progress * (TEMP_MAX - TEMP_MIN));
  };

  const framePowerTargets = filterPowerTempTargets(
    selectedUnits,
    skipSuperlockForFrame
  );

  const isMobilePowerOn =
    framePowerTargets.length > 0 && framePowerTargets.every((u) => u.isOn);

  const handleMobileArcPointerDown = (e: React.PointerEvent) => {
    if (!isMobilePowerOn) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingMobileArc.current = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const next = tempFromMobileArcPoint(e.clientX, e.clientY);
    if (next != null) handleBulkTempSet(next);
  };

  const handleMobileArcPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingMobileArc.current || !isMobilePowerOn) return;
    e.preventDefault();
    const next = tempFromMobileArcPoint(e.clientX, e.clientY);
    if (next != null) handleBulkTempSet(next);
  };

  const handleMobileArcPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingMobileArc.current) return;
    isDraggingMobileArc.current = false;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const handleBulkLockChange = (status: 'Unlocked' | 'Locked' | 'Super Locked') => {
    selectedUnits.forEach(u => {
      if (onUpdateDevice) {
        const isLocked = status !== 'Unlocked';
        const eventLocked = status === 'Super Locked';
        onUpdateDevice(u.id, { isLocked, eventLocked });
      }
    });
    setShowLockDropdown(false);
  };

  // Bulk actions for individual venues from grid cards — never touch super-locked devices
  const handleVenuePowerToggle = (venueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bulkPowerPending) return;
    const venueUnits = liveUnits.filter((u) => u.venueId === venueId);
    const targets = venueUnits.filter(isOrgVenueBulkTarget);
    const anyOn = targets.some((u) => u.isOn);
    void applyBulkPower(venueUnits, !anyOn, true);
  };

  const handleVenueTempAdjust = (venueId: string, increment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const venueUnits = liveUnits.filter((u) => u.venueId === venueId);
    handleScopeTempAdjust(getVenueTempScopeKey(venueId), venueUnits, increment, true);
  };

  const handleVenueLockChange = (venueId: string, status: 'Unlocked' | 'Locked' | 'Super Locked') => {
    const venueUnits = liveUnits.filter(u => u.venueId === venueId);
    venueUnits.forEach(u => {
      if (onUpdateDevice) {
        const isLocked = status !== 'Unlocked';
        const eventLocked = status === 'Super Locked';
        onUpdateDevice(u.id, { isLocked, eventLocked });
      }
    });
    setShowVenueLockDropdownId(null);
  };

  const handleBulkModeChange = (modeLabel: string) => {
    const mode = modeLabel.toLowerCase() as 'cool' | 'heat' | 'dry' | 'fan' | 'auto';
    const targets = filterPowerTempTargets(selectedUnits, skipSuperlockForFrame);
    if (targets.length === 0) {
      showBulkToast('No online devices available for mode control', 'error');
      return;
    }

    void (async () => {
      const results = await Promise.allSettled(
        targets.map(async (u) => {
          const result = await setDeviceMode(u.id, mode);
          if (result.applied && onUpdateDevice) {
            onUpdateDevice(u.id, { mode: modeLabel });
          }
          return result;
        })
      );

      const applied = results.filter(
        (r) => r.status === 'fulfilled' && r.value.applied
      ).length;
      const skipped = results.filter(
        (r) => r.status === 'fulfilled' && r.value.skipped
      ).length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (applied === 0 && skipped > 0 && failed === 0) {
        showBulkToast('No devices have this mode IR command', 'info');
      } else if (skipped > 0 || failed > 0) {
        showBulkToast(
          `Mode set on ${applied}/${targets.length} devices` +
            (skipped ? ` · ${skipped} skipped (no IR)` : '') +
            (failed ? ` · ${failed} failed` : ''),
          failed === targets.length ? 'error' : 'info'
        );
      }
    })();
  };

  const handleBulkFanSpeedChange = (fanLabel: string) => {
    const fan = fanLabel.toLowerCase() as
      | 'low'
      | 'medium'
      | 'high'
      | 'ultra'
      | 'turbo';
    const targets = filterPowerTempTargets(selectedUnits, skipSuperlockForFrame);
    if (targets.length === 0) {
      showBulkToast('No online devices available for fan control', 'error');
      return;
    }

    void (async () => {
      const results = await Promise.allSettled(
        targets.map(async (u) => {
          const result = await setDeviceFan(u.id, fan);
          if (result.applied && onUpdateDevice) {
            onUpdateDevice(u.id, { fanSpeed: fanLabel });
          }
          return result;
        })
      );

      const applied = results.filter(
        (r) => r.status === 'fulfilled' && r.value.applied
      ).length;
      const skipped = results.filter(
        (r) => r.status === 'fulfilled' && r.value.skipped
      ).length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (applied === 0 && skipped > 0 && failed === 0) {
        showBulkToast('No devices have this fan IR command', 'info');
      } else if (skipped > 0 || failed > 0) {
        showBulkToast(
          `Fan set on ${applied}/${targets.length} devices` +
            (skipped ? ` · ${skipped} skipped (no IR)` : '') +
            (failed ? ` · ${failed} failed` : ''),
          failed === targets.length ? 'error' : 'info'
        );
      }
    })();
  };

  // Add event/schedule for selected venue
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim()) return;

    selectedUnits.forEach(u => {
      const newEvent: ACEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: newScheduleName,
        time: newScheduleTime,
        endTime: newScheduleEndTime || undefined,
        action: newScheduleAction,
        targetTemp: newScheduleAction === 'SET_TEMP' ? newScheduleTemp : undefined,
        isRecurring: true,
        days: newScheduleDays,
        enabled: true,
      };

      const updatedEvents = [...(u.events || []), newEvent];
      if (onUpdateDevice) {
        onUpdateDevice(u.id, { events: updatedEvents });
      }
    });

    // Reset Form
    setNewScheduleName('');
    setShowScheduleForm(false);
  };

  const handleToggleSchedule = (eventId: string, currentEnabled: boolean) => {
    selectedUnits.forEach(u => {
      const updatedEvents = (u.events || []).map(evt => {
        if (evt.id === eventId || evt.name === eventId) {
          return { ...evt, enabled: !currentEnabled };
        }
        return evt;
      });
      if (onUpdateDevice) {
        onUpdateDevice(u.id, { events: updatedEvents });
      }
    });
  };

  // Weekday picker toggle
  const toggleDay = (day: string) => {
    if (newScheduleDays.includes(day)) {
      setNewScheduleDays(newScheduleDays.filter(d => d !== day));
    } else {
      setNewScheduleDays([...newScheduleDays, day]);
    }
  };

  // Aggregated schedules for right panel list (groups schedules by name or time)
  const aggregatedEvents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; time: string; endTime?: string; action: string; temp?: number; days: string[]; enabled: boolean }>();
    selectedUnits.forEach(u => {
      (u.events || []).forEach(evt => {
        const key = `${evt.name}-${evt.time}-${evt.endTime || ''}-${evt.action}-${evt.targetTemp || ''}`;
        if (!map.has(key)) {
          map.set(key, {
            id: evt.id,
            name: evt.name,
            time: evt.time,
            endTime: evt.endTime,
            action: evt.action,
            temp: evt.targetTemp,
            days: evt.days,
            enabled: evt.enabled,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [selectedUnits]);

  // Chart data calculation
  const chartData = useMemo(() => {
    return orgVenues.map(v => {
      const venueUnits = liveUnits.filter(u => u.venueId === v.id);
      
      // Calculate Hours
      const activeCount = venueUnits.filter(u => u.isOn).length;
      const hoursValue = activeCount * 8 + Math.round(Math.random() * 4); // mocked hours

      // Calculate Energy
      const energySum = venueUnits.reduce((acc, u) => {
        const lastMonthData = u.energyConsumption?.monthly;
        return acc + (lastMonthData && lastMonthData.length > 0 ? lastMonthData[lastMonthData.length - 1].kwh : 12);
      }, 0);

      // Calculate Faults
      const faultsValue = venueUnits.filter(u => u.hasFault).length;

      return {
        name: v.name.replace('SSUET_', ''),
        'No.of Hours': hoursValue,
        'Energy (kWh)': Math.round(energySum),
        'Need maintenance': faultsValue,
      };
    });
  }, [liveUnits, orgVenues]);

  // Time Formatter for AM/PM format matching image (e.g. 10:30 PM)
  const formatTimeAMPM = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  // Default end time offset calculator (e.g. 6 hours offset)
  const calculateDefaultEndTime = (startTime: string) => {
    if (!startTime) return '04:00';
    const [h, m] = startTime.split(':').map(Number);
    const endH = (h + 6) % 24;
    return `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
  };

  // Days Formatter to match image (e.g. Mon Tue ... Sun)
  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return 'None';
    if (days.length === 7) return 'Mon Tue ... Sun';
    if (days.length === 5 && days.includes('Mon') && days.includes('Fri')) return 'Mon Tue ... Fri';
    return days.join(' ');
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col">
      <AnimatePresence>
        {bulkToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-16 lg:top-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[9999] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur ${
              bulkToast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <span className="text-xs font-bold">{bulkToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* DESKTOP DASHBOARD VIEW */}
      <div className="hidden lg:flex w-full h-full flex-col xl:flex-row gap-4 max-w-full px-2.5 md:px-4 py-2 md:py-3 bg-slate-50/10 overflow-hidden">
        
        {/* LEFT SECTION (65% width on desktop) */}
        <div className="flex-1 h-full overflow-y-auto pr-1.5 space-y-5 min-w-0 custom-scrollbar pb-4">
        
        {/* Dynamic Organization Title Header with Space-saving Density Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white px-5 py-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest block mb-0.5">Campus Air Control</span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
              {globalUnitId ? (
                <>
                  <MonitorSmartphone className="w-6 h-6 text-blue-600 shrink-0" />
                  <span className="truncate">Device: {selectedUnits[0]?.name || 'Device'}</span>
                </>
              ) : globalVenueId ? (
                <>
                  <MapPin className="w-6 h-6 text-blue-600 shrink-0" />
                  <span className="truncate">Venue: {orgVenues.find(v => v.id === globalVenueId)?.name || 'Venue'}</span>
                </>
              ) : (
                <>
                  <Building2 className="w-6 h-6 text-blue-600 shrink-0" />
                  <span className="truncate">Organization: {activeOrg.name}</span>
                </>
              )}
            </h1>
            {orgs.length > 1 && !globalUnitId && (
              <div className="mt-3 max-w-xs">
                <CustomDropdown
                  icon={Building2}
                  value={activeOrg.id || ''}
                  onChange={handleOrgChange}
                  placeholder="Select organization"
                  options={orgs.map((org) => ({ value: org.id, label: org.name }))}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Grid Density Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGridDensity('standard')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  gridDensity === 'standard' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Standard Grid
              </button>
              <button
                type="button"
                onClick={() => setGridDensity('dense')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  gridDensity === 'dense' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Dense Row List
              </button>
            </div>

            {/* Notifications Bell — real device health alerts */}
            <div className="relative">
              {(() => {
                const alertUnits = orgUnits.filter((u) => u.hasFault);
                const hasAlerts = alertUnits.length > 0;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex items-center justify-center ${
                        showNotifications 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80'
                      }`}
                      title="System Alerts"
                    >
                      <Bell className="w-5 h-5" />
                      {hasAlerts && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-bounce">
                          {alertUnits.length}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alerts</span>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            Close
                          </button>
                        </div>

                        {hasAlerts ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
                            {alertUnits.map((unit) => {
                              const venueName =
                                orgVenues.find((v) => v.id === unit.venueId)?.name ||
                                'Venue';
                              const reason =
                                unit.healthAlert ||
                                (typeof unit.ventTemperature === 'number'
                                  ? `Vent ${unit.ventTemperature.toFixed(1)}°C above set ${unit.targetTemp}°C`
                                  : 'Vent temperature above set point');
                              return (
                                <button
                                  key={unit.id}
                                  type="button"
                                  onClick={() => {
                                    onSelectUnit(unit.id);
                                    setShowNotifications(false);
                                  }}
                                  className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-2xl hover:bg-red-50/80 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                >
                                  <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0 mt-0.5">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider truncate">
                                      {unit.name}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 truncate">
                                      {venueName}
                                    </p>
                                    <p className="text-[11px] text-amber-700 font-medium mt-1 leading-snug">
                                      {reason}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">No active alerts</p>
                            <p className="text-[10px] text-slate-400 mt-1">All devices are healthy.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Venue Cards Grid with layout density support */}
        {gridDensity === 'standard' ? (
          <div className="flex overflow-x-auto gap-4 pb-4 pt-1 px-1 custom-scrollbar w-full">
            
            {/* 1. ALL VENUES SPECIAL CARD */}
            <div 
              onClick={() => setSelectedVenueId('all')}
              className={`p-5 rounded-3xl cursor-pointer border transition-all duration-300 relative group flex flex-col justify-between h-[180px] w-[280px] shrink-0 ${
                selectedVenueId === 'all' 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest block ${selectedVenueId === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
                      GLOBAL OVERRIDE
                    </span>
                    <h3 className={`text-lg font-black tracking-tight ${selectedVenueId === 'all' ? 'text-white' : 'text-slate-900'}`}>
                      ALL VENUES
                    </h3>
                  </div>
                  
                  {/* Switch Slider */}
                  <div 
                    onClick={handleOrgPowerToggle}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                      orgUnits.filter(isOrgVenueBulkTarget).length > 0 &&
                      orgUnits.filter(isOrgVenueBulkTarget).every((u) => u.isOn)
                        ? 'bg-emerald-500' 
                        : selectedVenueId === 'all' ? 'bg-blue-800' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform ${
                      orgUnits.filter(isOrgVenueBulkTarget).length > 0 &&
                      orgUnits.filter(isOrgVenueBulkTarget).every((u) => u.isOn)
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }`} />
                  </div>
                </div>

                {/* Temp adjust row */}
                <div className="flex items-center gap-3 my-2">
                  <button 
                    type="button"
                    onClick={(e) => handleOrgTempAdjust(-1, e)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      selectedVenueId === 'all' 
                        ? 'bg-blue-500/40 hover:bg-blue-500/60 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold'
                    }`}
                  >
                    -
                  </button>
                  <span className="text-xl font-black min-w-[50px] text-center tracking-tight leading-none">
                    {orgCardTempState === 'Mixed' ? 'Mixed' : orgUnits.length ? `${orgCardTempState}°` : '—'}
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => handleOrgTempAdjust(1, e)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      selectedVenueId === 'all' 
                        ? 'bg-blue-500/40 hover:bg-blue-500/60 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex justify-between items-center mt-3 border-t pt-2.5 border-slate-100/10">
                <span className={`text-xs font-bold flex items-center gap-1 ${selectedVenueId === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  {orgUnits.filter(u => u.isOn).length} ON / {orgUnits.length}
                </span>
                <span className={`text-xs font-black ${selectedVenueId === 'all' ? 'text-yellow-300' : 'text-blue-600'}`}>
                  {orgPowerKw.toFixed(2)} kW
                </span>
              </div>
            </div>

            {/* 2. DYNAMIC VENUES CARDS */}
            {orgVenues.length === 0 && (
              <div className="p-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 h-[180px] w-[280px] shrink-0 flex items-center justify-center">
                <p className="text-xs font-bold text-slate-400 text-center px-4">
                  {loadingOrgDevices ? 'Loading…' : 'No venues in this organization yet'}
                </p>
              </div>
            )}
            {orgVenues.map(v => {
              const isSelected = selectedVenueId === v.id;
              const venueUnits = liveUnits.filter(u => u.venueId === v.id);
              const activeCount = venueUnits.filter(u => u.isOn).length;
              const hasFault = venueUnits.some(u => u.hasFault);
              const isAllOn = venueUnits.every(u => u.isOn) && venueUnits.length > 0;
              const isAllLocked = venueUnits.every(u => u.isLocked) && venueUnits.length > 0;
              const firstUnit = venueUnits[0];

              // Target temp representation (includes draft while adjusting)
              const venueTempValue = resolveDisplayTemp(
                venueUnits,
                getVenueTempScopeKey(v.id)
              );
              const venueTargetTemp =
                venueTempValue === 'Mixed'
                  ? 'Mixed'
                  : venueUnits.length
                    ? `${venueTempValue}°`
                    : '—';

              // Live power sum for this venue's devices
              const venuePowerKw = sumLivePowerKw(venueUnits);

              return (
                <div 
                  key={v.id}
                  onClick={() => setSelectedVenueId(v.id)}
                  className={`p-5 rounded-3xl cursor-pointer border transition-all duration-300 relative group flex flex-col justify-between h-[180px] w-[280px] shrink-0 ${
                    isSelected 
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">
                          VENUE UNIT
                        </span>
                        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                          {v.name}
                          {hasFault && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </h3>
                      </div>

                      {/* Switch Toggler */}
                      <div 
                        onClick={(e) => handleVenuePowerToggle(v.id, e)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                          anyOnVenue(v.id) ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform ${
                          anyOnVenue(v.id) ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>

                    {/* Temperature inline controller */}
                    <div className="flex items-center gap-3 my-2">
                      <button 
                        type="button"
                        onClick={(e) => handleVenueTempAdjust(v.id, -1, e)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center transition-all active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-xl font-black min-w-[50px] text-center tracking-tight leading-none text-slate-800">
                        {venueTargetTemp}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleVenueTempAdjust(v.id, 1, e)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center mt-3 border-t pt-2.5 border-slate-100/60">
                    {firstUnit ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewDevicesOfVenue) {
                            onViewDevicesOfVenue(v.id);
                          } else {
                            onSelectUnit(firstUnit.id);
                          }
                        }}
                        className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5 group-hover:translate-x-0.5 duration-200 cursor-pointer"
                      >
                        View Devices
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">No Devices</span>
                    )}

                    <span className="text-xs font-black text-slate-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      {venuePowerKw.toFixed(2)} kW
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            
            {/* 1. ALL VENUES SPECIAL ROW - DENSE */}
            <div 
              onClick={() => setSelectedVenueId('all')}
              className={`p-3.5 rounded-2xl cursor-pointer border transition-all duration-300 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 ${
                selectedVenueId === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md shadow-blue-500/15' 
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${selectedVenueId === 'all' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  Global Override
                </span>
                <div>
                  <h3 className="text-sm font-black tracking-tight leading-none">
                    ALL {activeOrg.name.toUpperCase()} VENUES
                  </h3>
                  <span className={`text-[9px] font-extrabold mt-1.5 block uppercase tracking-wide ${selectedVenueId === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {orgUnits.filter(u => u.isOn).length} ON / {orgUnits.length} Devices Active
                  </span>
                </div>
              </div>

              {/* Adjust and Info */}
              <div className="flex items-center justify-between sm:justify-end gap-5">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={(e) => handleOrgTempAdjust(-1, e)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs font-black ${
                      selectedVenueId === 'all' 
                        ? 'bg-blue-500/40 hover:bg-blue-500/60 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    -
                  </button>
                  <span className="text-xs font-black min-w-[36px] text-center tracking-tight">
                    {orgCardTempState === 'Mixed' ? 'Mixed' : orgUnits.length ? `${orgCardTempState}°` : '—'}
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => handleOrgTempAdjust(1, e)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs font-black ${
                      selectedVenueId === 'all' 
                        ? 'bg-blue-500/40 hover:bg-blue-500/60 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${selectedVenueId === 'all' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-slate-150 text-slate-600'}`}>
                    {orgPowerKw.toFixed(2)} kW
                  </span>
                  
                  {/* Switch Slider */}
                  <div 
                    onClick={handleOrgPowerToggle}
                    className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                      orgUnits.filter(isOrgVenueBulkTarget).length > 0 &&
                      orgUnits.filter(isOrgVenueBulkTarget).every((u) => u.isOn)
                        ? 'bg-emerald-500' 
                        : selectedVenueId === 'all' ? 'bg-blue-800' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                      orgUnits.filter(isOrgVenueBulkTarget).length > 0 &&
                      orgUnits.filter(isOrgVenueBulkTarget).every((u) => u.isOn)
                        ? 'translate-x-4.5'
                        : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC VENUES DENSE LIST ROWS */}
            {orgVenues.map(v => {
              const isSelected = selectedVenueId === v.id;
              const venueUnits = liveUnits.filter(u => u.venueId === v.id);
              const activeCount = venueUnits.filter(u => u.isOn).length;
              const hasFault = venueUnits.some(u => u.hasFault);
              const isAllOn = venueUnits.every(u => u.isOn) && venueUnits.length > 0;
              const firstUnit = venueUnits[0];

              const venueTempValue = resolveDisplayTemp(
                venueUnits,
                getVenueTempScopeKey(v.id)
              );
              const venueTargetTemp =
                venueTempValue === 'Mixed'
                  ? 'Mixed'
                  : venueUnits.length
                    ? `${venueTempValue}°`
                    : '—';

              const venuePowerKw = sumLivePowerKw(venueUnits);

              return (
                <div 
                  key={v.id}
                  onClick={() => setSelectedVenueId(v.id)}
                  className={`p-3 rounded-2xl cursor-pointer border transition-all duration-300 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 ${
                    isSelected 
                      ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-500/20' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      hasFault ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {hasFault ? 'Fault (Active)' : 'Healthy'}
                    </span>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        {v.name}
                        {hasFault && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </h3>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">{venueUnits.length} Devices Active • {activeCount} ON</p>
                    </div>
                  </div>

                  {/* Temperature inline controller */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={(e) => handleVenueTempAdjust(v.id, -1, e)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center transition-all active:scale-95 text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-black min-w-[36px] text-center tracking-tight text-slate-800">
                        {venueTargetTemp}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleVenueTempAdjust(v.id, 1, e)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center transition-all active:scale-95 text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <span className="text-[10px] font-black text-slate-800 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {venuePowerKw.toFixed(2)} kW
                      </span>

                      {/* Switch Toggler */}
                      <div 
                        onClick={(e) => handleVenuePowerToggle(v.id, e)}
                        className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                          anyOnVenue(v.id) ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                          anyOnVenue(v.id) ? 'translate-x-4.5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM METRICS PANEL: Need Maintenance Accordion & Recharts Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Block: "Need Maintenance" list */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Need Maintenance</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vent temp & device health alerts</p>
                </div>
              </div>

              {/* Accordion / List of alerts */}
              <div className="space-y-2">
                {orgVenues.map(v => {
                  const venueUnits = liveUnits.filter(u => u.venueId === v.id);
                  const faultyUnits = venueUnits.filter(u => u.hasFault);
                  const faultCount = faultyUnits.length;
                  const isExpanded = expandedMaintenanceVenueId === v.id;

                  return (
                    <div 
                      key={v.id} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        faultCount > 0 
                          ? 'border-red-100 bg-red-50/10' 
                          : 'border-slate-100 bg-slate-50/20'
                      }`}
                    >
                      <div 
                        onClick={() => setExpandedMaintenanceVenueId(isExpanded ? null : v.id)}
                        className="flex justify-between items-center p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-xs font-extrabold text-slate-800">{v.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            faultCount > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                          }`}>
                            ! {String(faultCount).padStart(2, '0')}
                          </span>
                          <span className="text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4 transform rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>

                      {/* Expandable sub-list of actual faulty devices */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border-t border-slate-100 px-4 py-2.5 divide-y divide-slate-50"
                          >
                            {faultCount > 0 ? (
                              faultyUnits.map(unit => {
                                const reason =
                                  unit.healthAlert ||
                                  (typeof unit.ventTemperature === 'number'
                                    ? `Vent ${unit.ventTemperature.toFixed(1)}°C above set ${unit.targetTemp}°C`
                                    : 'Vent temperature above set point');
                                return (
                                <div key={unit.id} className="py-2 flex justify-between items-center gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{unit.name}</p>
                                    <p className="text-[9px] font-medium mt-0.5 text-amber-600 leading-snug">{reason}</p>
                                  </div>
                                  <button 
                                    onClick={() => onSelectUnit(unit.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-all text-[10px] font-black uppercase shrink-0"
                                    title="Go to device"
                                  >
                                    View
                                  </button>
                                </div>
                              );})
                            ) : (
                              <p className="text-[11px] text-slate-400 py-2 italic font-bold">All hardware healthy in this venue.</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-extrabold mt-4 pt-3 border-t border-slate-100 text-center uppercase tracking-widest">
              Live Hardware Heartbeat Status
            </div>
          </div>

          {/* Right Block: Recharts Interactive Chart */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Analytical Insights</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metrics per block</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {(['hours', 'energy', 'maintenance'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveChartTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        activeChartTab === tab 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      {tab === 'hours' ? 'No.of Hours' : tab === 'energy' ? 'Energy' : 'Need Maintenance'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart container */}
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#64748B' }} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#64748B' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'black', fontSize: '11px', color: '#0F172A' }}
                    />
                    <Bar 
                      dataKey={activeChartTab === 'hours' ? 'No.of Hours' : activeChartTab === 'energy' ? 'Energy (kWh)' : 'Need maintenance'} 
                      radius={[6, 6, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={activeChartTab === 'hours' ? '#2563EB' : activeChartTab === 'energy' ? '#F59E0B' : '#EF4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4 pt-2.5 border-t border-slate-50">
              <span>Updated: Just Now</span>
              <span>Venues: {orgVenues.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR PANEL (35% width on desktop) */}
      <div className="w-full xl:w-[400px] flex-shrink-0 h-full overflow-y-auto pr-1.5 custom-scrollbar pb-4">
        
        {/* Detail Panel Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-6 flex flex-col justify-between">
          
          <div>
            {/* Header / Venue identity */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Active Control Frame
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Gauge className="w-5.5 h-5.5 text-blue-600 animate-pulse" />
                  {selectedVenueId === 'all' ? `All ${activeOrg.name} Venues` : orgVenues.find(v => v.id === selectedVenueId)?.name || 'Venue'}
                </h2>
              </div>

              {/* Lock Dropdown Override */}
              <div className="relative">
                <button 
                  onClick={() => setShowLockDropdown(!showLockDropdown)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-black text-[10px] uppercase rounded-xl flex items-center gap-1 transition-all"
                >
                  <Lock className="w-3 h-3 text-blue-600" />
                  <span>{lockState}</span>
                </button>

                {showLockDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-1.5 space-y-1">
                    <button 
                      onClick={() => handleBulkLockChange('Unlocked')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      Unlocked
                    </button>
                    <button 
                      onClick={() => handleBulkLockChange('Locked')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Locked
                    </button>
                    <button 
                      onClick={() => handleBulkLockChange('Super Locked')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-700 flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-red-600" />
                      Super Locked
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Core Widget / Metadata Row */}
            <div className="grid grid-cols-3 gap-2.5 border-b border-slate-100 pb-5 pt-1 my-1">
              {/* Devices Card */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-blue-50/45 border border-blue-100/50 rounded-2xl hover:bg-blue-50 hover:shadow-sm transition-all group">
                <div className="p-1.5 bg-blue-100/60 text-blue-600 rounded-xl mb-1 group-hover:scale-110 transition-transform">
                  <MonitorSmartphone className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block text-center">Devices</span>
                <span className="text-xs font-black text-slate-800 mt-0.5"># {totalUnitsCount}</span>
              </div>

              {/* Energy Card */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-amber-50/45 border border-amber-100/50 rounded-2xl hover:bg-amber-50 hover:shadow-sm transition-all group">
                <div className="p-1.5 bg-amber-100/60 text-amber-600 rounded-xl mb-1 group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block text-center">Energy</span>
                <span className="text-xs font-black text-amber-700 mt-0.5">{totalEnergy} kW</span>
              </div>

              {/* Faults Card */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-rose-50/45 border border-rose-100/50 rounded-2xl hover:bg-rose-50 hover:shadow-sm transition-all group">
                <div className="p-1.5 bg-rose-100/60 text-rose-600 rounded-xl mb-1 group-hover:scale-110 transition-transform">
                  <AlertTriangle className={`w-4 h-4 ${faultUnitsCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block text-center">Faults</span>
                <span className="text-xs font-black text-rose-700 mt-0.5">{faultUnitsCount}</span>
              </div>
            </div>

            {/* Premium Interactive Dial Climate Circle */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-52 h-52 flex items-center justify-center">
                
                {/* SVG circular track with glow */}
                <svg className="w-full h-full transform -rotate-90 absolute">
                  <circle 
                    cx="104" 
                    cy="104" 
                    r="92" 
                    stroke="#F1F5F9" 
                    strokeWidth="10" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="104" 
                    cy="104" 
                    r="92" 
                    stroke="url(#blueGradient)" 
                    strokeWidth="10" 
                    strokeDasharray="578" 
                    strokeDashoffset={578 - (578 * (typeof targetTempState === 'number' ? targetTempState - TEMP_MIN : TEMP_ECO - TEMP_MIN)) / (TEMP_MAX - TEMP_MIN)} 
                    fill="transparent" 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inner Dial Value */}
                <div className="text-center z-10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">COOLING Mode</span>
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => handleBulkTempAdjust(-1)}
                      className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors text-lg font-black"
                    >
                      -
                    </button>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                      {targetTempState}
                    </span>
                    <button 
                      onClick={() => handleBulkTempAdjust(1)}
                      className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors text-lg font-black"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">°C Climate</p>

                  <button 
                    onClick={handleBulkEco}
                    className="mt-2 text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors"
                  >
                    Auto Adjust Eco
                  </button>
                </div>

                {/* Bound Labels */}
                <span className="absolute bottom-3 left-3 text-[10px] font-black text-slate-400">16°C</span>
                <span className="absolute bottom-3 right-3 text-[10px] font-black text-slate-400">30°C</span>
              </div>
                   {/* CONTROL ROW (Power, Mode, Fan) */}
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {/* Power Toggle Column */}
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate" title="Power">Power</label>
                {(() => {
                  const onlineSelected = framePowerTargets;
                  const isBulkOn =
                    onlineSelected.length > 0 && onlineSelected.some((u) => u.isOn);
                  return (
                    <button
                      type="button"
                      disabled={bulkPowerPending || onlineSelected.length === 0}
                      onClick={() => handleBulkPowerToggle(!isBulkOn)}
                      className={`w-full py-3 px-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex justify-center items-center gap-1 shadow-sm border cursor-pointer h-11 ${
                        isBulkOn
                          ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/10'
                          : 'bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-red-500/10'
                      } ${bulkPowerPending || onlineSelected.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <Power className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{isBulkOn ? 'ON' : 'OFF'}</span>
                    </button>
                  );
                })()}
              </div>

              {/* AC OPERATIONS MODE SELECTOR DROPDOWN */}
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate" title="AC Mode">AC Mode</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModeDropdown(!showModeDropdown);
                      setShowFanDropdown(false);
                    }}
                    className="w-full flex justify-between items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl p-3 transition-all focus:ring-2 focus:ring-blue-500/20 text-left cursor-pointer h-11"
                  >
                    <span className="flex items-center gap-1 min-w-0">
                      {(() => {
                        const currentMode = selectedUnits.length > 0 && selectedUnits.every(u => (u as any).mode === selectedUnits[0]?.mode) 
                          ? (selectedUnits[0] as any).mode || 'Cool' 
                          : 'Mixed';

                        const modeIcons: Record<string, any> = {
                          Cool: Snowflake,
                          Heat: Sun,
                          Dry: Droplet,
                          Fan: Wind,
                          Auto: Sparkles,
                        };

                        const IconComp = modeIcons[currentMode] || Sparkles;

                        return (
                          <>
                            <IconComp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider truncate">{currentMode}</span>
                          </>
                        );
                      })()}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${showModeDropdown ? 'transform rotate-180' : ''}`} />
                  </button>

                  {showModeDropdown && (
                    <div className="absolute right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-1.5 space-y-1 w-[140px]">
                      {[
                        { mode: 'Cool', label: 'Cool', icon: Snowflake },
                        { mode: 'Heat', label: 'Heat', icon: Sun },
                        { mode: 'Dry', label: 'Dry', icon: Droplet },
                        { mode: 'Fan', label: 'Fan Only', icon: Wind },
                        { mode: 'Auto', label: 'Auto', icon: Sparkles }
                      ].map(m => {
                        const IconComp = m.icon;
                        const isActive = selectedUnits.length > 0 && selectedUnits.every(u => (u as any).mode === m.mode);
                        return (
                          <button
                            key={m.mode}
                            type="button"
                            onClick={() => {
                              handleBulkModeChange(m.mode);
                              setShowModeDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                              isActive 
                                ? 'bg-blue-600 text-white' 
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                              <span className="truncate">{m.label}</span>
                            </span>
                            {isActive && <Check className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* UNIFIED FAN SPEED SELECTOR DROPDOWN */}
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate" title="Fan Speed">Fan Speed</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFanDropdown(!showFanDropdown);
                      setShowModeDropdown(false);
                    }}
                    className="w-full flex justify-between items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl p-3 transition-all focus:ring-2 focus:ring-blue-500/20 text-left cursor-pointer h-11"
                  >
                    <span className="flex items-center gap-1 min-w-0">
                      <Fan className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider truncate">
                        {selectedUnits.length > 0 && selectedUnits.every(u => (u as any).fanSpeed === selectedUnits[0]?.fanSpeed) 
                          ? `${(selectedUnits[0] as any).fanSpeed || 'Medium'}` 
                          : 'Mixed'}
                      </span>
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${showFanDropdown ? 'transform rotate-180' : ''}`} />
                  </button>

                  {showFanDropdown && (
                    <div className="absolute right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-1.5 space-y-1 w-[120px]">
                      {['Low', 'Medium', 'High', 'Ultra', 'Turbo'].map(speed => {
                        const isActive = selectedUnits.length > 0 && selectedUnits.every(u => (u as any).fanSpeed === speed);
                        return (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => {
                              handleBulkFanSpeedChange(speed);
                              setShowFanDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                              isActive 
                                ? 'bg-slate-900 text-white' 
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{speed}</span>
                            {isActive && <Check className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>       </div>

          </div>



          {/* EVENTS / SCHEDULING INTERFACE */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-800 uppercase tracking-wider">EVENTS</span>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer"
                title="Schedule bulk event"
              >
                <Plus className="w-4 h-4 text-slate-800" />
              </button>
            </div>

            {/* SCHEDULE ITEMS CARDS HORIZONTAL SCROLLER */}
            <div className="flex overflow-x-auto gap-4 pb-4 pt-1 px-1 custom-scrollbar">
              {aggregatedEvents.length > 0 ? (
                aggregatedEvents.map(evt => {
                  const startTimeStr = formatTimeAMPM(evt.time);
                  const endTimeStr = evt.endTime ? formatTimeAMPM(evt.endTime) : formatTimeAMPM(calculateDefaultEndTime(evt.time));

                  return (
                    <div 
                      key={evt.id}
                      className="border border-slate-200 rounded-[28px] p-4 flex flex-col justify-between w-[220px] shrink-0 h-[155px] bg-white relative hover:shadow-md transition-shadow duration-300"
                    >
                      {/* Event Time Heading */}
                      <div>
                        <div className="text-sm font-black text-slate-800 tracking-tight flex items-center justify-between">
                          <span>{startTimeStr}</span>
                          <span className="text-slate-300 font-medium px-0.5">—</span>
                          <span>{endTimeStr}</span>
                        </div>
                        
                        {/* Time labels underneath */}
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 px-0.5">
                          <span>Start Time</span>
                          <span>End Time</span>
                        </div>

                        {/* Command Badge matching mockup style */}
                        {evt.action === 'OFF' ? (
                          <div className="bg-red-50 text-red-700 border border-red-100/60 rounded-full px-3 py-1 flex items-center justify-center text-[10px] font-bold gap-1 mt-3">
                            <span>Command:</span>
                            <span className="font-black text-red-800 bg-red-100/70 px-1.5 py-0.5 rounded-md">OFF</span>
                          </div>
                        ) : evt.action === 'SET_TEMP' ? (
                          <div className="bg-blue-50 text-blue-600 border border-blue-100/60 rounded-full px-3 py-1 flex items-center justify-center text-[10px] font-bold gap-1 mt-3">
                            <span>Command:</span>
                            <span className="font-black text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md">{evt.temp}°C</span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100/60 rounded-full px-3 py-1 flex items-center justify-center text-[10px] font-bold gap-1 mt-3">
                            <span>Command:</span>
                            <span className="font-black text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">ON</span>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: Days & Enable button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate max-w-[100px]" title={evt.name}>
                          {formatDays(evt.days)}
                        </span>

                        <button
                          onClick={() => handleToggleSchedule(evt.id, evt.enabled)}
                          className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
                            evt.enabled 
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border-slate-200'
                          }`}
                        >
                          {evt.enabled ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 w-full border border-dashed border-slate-100 rounded-[28px] bg-slate-50/20 flex flex-col items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-300 mb-1.5" />
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">No active schedules found</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Click the "+" button to schedule a venue event</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>

      {/* MOBILE FIGMA-MATCHING VIEW */}
      {(() => {
        const tempValue = typeof targetTempState === 'number' ? targetTempState : TEMP_ECO;
        const startAngle = 140;
        const totalAngle = 260;
        const angleDeg = startAngle + (totalAngle * (tempValue - TEMP_MIN)) / (TEMP_MAX - TEMP_MIN);
        const angleRad = (angleDeg * Math.PI) / 180;
        const cx = 110 + 92 * Math.cos(angleRad);
        const cy = 110 + 92 * Math.sin(angleRad);

        // Org/venue: skip superlock. Single device: allow direct control even if superlocked.
        const controllableUnits = framePowerTargets;
        const allUnitsOn =
          controllableUnits.length > 0 && controllableUnits.every((u) => u.isOn);
        const arcActiveColor = allUnitsOn ? '#4f46e5' : '#94a3b8';
        const handleArrow = allUnitsOn ? '#4f46e5' : '#94a3b8';

        return (
          <div className="flex lg:hidden flex-col h-full w-full bg-[#f3f4f6] text-slate-800 select-none overflow-hidden justify-between p-4 pb-1">
            
            {/* Top Entity Name */}
            <div className="text-center text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 mb-2 shrink-0">
              {globalUnitId ? (
                <>
                  Device: <span className="text-blue-600">{selectedUnits[0]?.name || 'Device'}</span>
                </>
              ) : globalVenueId ? (
                <>
                  Venue: <span className="text-blue-600">{orgVenues.find(v => v.id === globalVenueId)?.name || 'Venue'}</span>
                </>
              ) : (
                <>
                  Organization: <span className="text-blue-600">{activeOrg.name}</span>
                </>
              )}
            </div>

            {/* Metrics Row (3 Cards Grid matching figma) */}
            <div className="grid grid-cols-3 gap-2 flex-none shrink-0">
              
              {/* Card 1: Energy */}
              <div className="bg-slate-100/80 rounded-2xl p-3 flex flex-col justify-between border border-slate-200/40">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">ENERGY</span>
                <div className="flex items-center gap-1 mt-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-xs font-black text-slate-800 tracking-tight">{totalEnergy} <span className="text-[8px] font-bold text-slate-400">kW</span></span>
                </div>
              </div>

              {/* Card 2: Devices & Faults */}
              <div className="bg-slate-100/80 rounded-2xl p-2 flex flex-col justify-between border border-slate-200/40 leading-none">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black text-emerald-500">#</span>
                  <span className="text-xs font-black text-emerald-600">{totalUnitsCount}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 block">No. of devices</span>
                
                <div className="h-px bg-slate-200/60 my-1 shrink-0" />
                
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-black text-red-600">{faultUnitsCount}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 block">Fault Devices</span>
              </div>

              {/* Card 3: Lock State — custom dropdown (opens downward) */}
              <div className="min-w-0 h-full">
                <CustomDropdown
                  placement="down"
                  value={lockState === 'Mixed' ? '' : lockState}
                  placeholder="Mixed"
                  onChange={(v) => {
                    if (v === 'Unlocked' || v === 'Locked' || v === 'Super Locked') {
                      handleBulkLockChange(v);
                    }
                  }}
                  options={[
                    { value: 'Unlocked', label: 'Unlock' },
                    { value: 'Locked', label: 'Lock' },
                    { value: 'Super Locked', label: 'Super Lock' },
                  ]}
                  className="h-full"
                  triggerClassName="h-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-3 flex-col justify-between items-stretch border border-blue-500/10 shadow-sm text-left"
                  triggerContent={
                    <>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-black uppercase text-blue-100 tracking-wider">
                          Lock State
                        </span>
                        <ChevronDown className="w-3 h-3 text-blue-200 shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 min-w-0">
                        {lockState === 'Unlocked' ? (
                          <Unlock className="w-4 h-4 text-yellow-300 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-white shrink-0" />
                        )}
                        <span className="text-[11px] font-black tracking-tight truncate leading-none text-white">
                          {lockState}
                        </span>
                      </div>
                    </>
                  }
                />
              </div>

            </div>

            {/* Circular Dial Temp Area (No overflow, responsive) */}
            <div className="flex-1 min-h-0 flex items-center justify-center relative py-3 max-h-[35vh]">
              <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                
                {/* SVG Temperature Arc Semicircle */}
                <svg
                  ref={mobileArcSvgRef}
                  viewBox="0 0 220 220"
                  className="w-full h-full select-none overflow-visible touch-none"
                >
                  {/* Background Track */}
                  <path 
                    d="M 39.5 169.1 A 92 92 0 1 1 180.5 169.1" 
                    stroke="#eaecef" 
                    strokeWidth="8.5" 
                    strokeLinecap="round" 
                    fill="none" 
                  />
                  {/* Active Fill Arc — blue when ON, gray when OFF */}
                  <path 
                    d="M 39.5 169.1 A 92 92 0 1 1 180.5 169.1" 
                    stroke={arcActiveColor}
                    strokeWidth="8.5" 
                    strokeLinecap="round" 
                    strokeDasharray="417.5"
                    strokeDashoffset={417.5 - (417.5 * (tempValue - TEMP_MIN) / (TEMP_MAX - TEMP_MIN))}
                    fill="none" 
                    className="transition-colors duration-300"
                  />
                  
                  {/* Hit area along arc for easier dragging */}
                  <path 
                    d="M 39.5 169.1 A 92 92 0 1 1 180.5 169.1" 
                    stroke="transparent"
                    strokeWidth="28" 
                    strokeLinecap="round" 
                    fill="none"
                    style={{ cursor: allUnitsOn ? 'grab' : 'not-allowed', touchAction: 'none' }}
                    onPointerDown={handleMobileArcPointerDown}
                    onPointerMove={handleMobileArcPointerMove}
                    onPointerUp={handleMobileArcPointerUp}
                    onPointerCancel={handleMobileArcPointerUp}
                  />

                  {/* Handle knob — draggable when ON */}
                  <g
                    transform={`translate(${cx}, ${cy})`}
                    style={{ cursor: allUnitsOn ? 'grab' : 'not-allowed', touchAction: 'none' }}
                    onPointerDown={handleMobileArcPointerDown}
                    onPointerMove={handleMobileArcPointerMove}
                    onPointerUp={handleMobileArcPointerUp}
                    onPointerCancel={handleMobileArcPointerUp}
                  >
                    <circle 
                      r="16" 
                      fill="transparent"
                    />
                    <circle 
                      r="13" 
                      fill="#e2e8f0"
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      className="transition-colors duration-300"
                    />
                    {/* Left triangle */}
                    <path d="M -2.5 -3.5 L -6.5 0 L -2.5 3.5 Z" fill={handleArrow} className="transition-colors duration-300" />
                    {/* Right triangle */}
                    <path d="M 2.5 -3.5 L 6.5 0 L 2.5 3.5 Z" fill={handleArrow} className="transition-colors duration-300" />
                  </g>

                  {/* Arc Limit Labels */}
                  <text x="39.5" y="194" fill="#94a3b8" fontSize="11" fontWeight="500" textAnchor="middle">16°C</text>
                  <text x="180.5" y="194" fill="#94a3b8" fontSize="11" fontWeight="500" textAnchor="middle">30°C</text>
                </svg>

                {/* Inner Content Controller - perfectly fits inside the arc */}
                <div className="absolute inset-0 flex flex-col items-center justify-center -mt-1 pointer-events-none">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.25em] mb-1">COOL</span>
                  
                  <div className="flex items-center justify-center gap-3 my-0.5 pointer-events-auto">
                    {/* Minus Button */}
                    <button 
                      type="button" 
                      disabled={!allUnitsOn}
                      onClick={() => {
                        if (!allUnitsOn) return;
                        handleBulkTempAdjust(-1);
                      }}
                      className={`w-9 h-9 rounded-full bg-[#f1f3f5] text-slate-900 font-light flex items-center justify-center transition-all text-lg shadow-sm border border-slate-200/10 shrink-0 select-none ${
                        allUnitsOn
                          ? 'hover:bg-slate-200 active:bg-slate-300 active:scale-90'
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      -
                    </button>
                    
                    {/* Temp Value */}
                    <div className="flex flex-col items-center justify-center min-w-[65px] text-center">
                      <span className={`font-extrabold text-slate-900 tracking-tight leading-none ${
                        targetTempState === 'Mixed' ? 'text-base' : 'text-[36px]'
                      }`}>
                        {targetTempState}
                      </span>
                    </div>

                    {/* Plus Button */}
                    <button 
                      type="button" 
                      disabled={!allUnitsOn}
                      onClick={() => {
                        if (!allUnitsOn) return;
                        handleBulkTempAdjust(1);
                      }}
                      className={`w-9 h-9 rounded-full bg-[#f1f3f5] text-slate-900 font-light flex items-center justify-center transition-all text-lg shadow-sm border border-slate-200/10 shrink-0 select-none ${
                        allUnitsOn
                          ? 'hover:bg-[#eaecef] active:bg-slate-300 active:scale-90'
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  
                  {targetTempState !== 'Mixed' && (
                    <span className="text-sm font-medium text-slate-400">°C</span>
                  )}
                  
                  <button 
                    type="button"
                    onClick={handleBulkEco}
                    className="mt-3 px-5 py-2 rounded-full text-[12px] font-semibold tracking-wide transition-colors pointer-events-auto bg-[#e0e5f8] hover:bg-indigo-100 text-[#4f46e5]"
                  >
                    Auto Adjust
                  </button>
                </div>

              </div>
            </div>

            {/* ON | OFF Toggle Capsule (matching Figma outline style) */}
            <div className="flex justify-center mb-3 flex-none shrink-0">
              <div className="bg-white border border-slate-400 rounded-full flex items-center h-12 shadow-sm max-w-[200px] w-full px-5">
                <button
                  type="button"
                  onClick={() => handleBulkPowerToggle(true)}
                  className={`flex-1 text-center text-sm tracking-widest uppercase transition-all py-2 rounded-full ${
                    allUnitsOn 
                      ? 'text-slate-900 font-extrabold' 
                      : 'text-slate-400 font-medium hover:text-slate-600'
                  }`}
                >
                  ON
                </button>
                <div className="w-px h-5 bg-slate-300 mx-2 shrink-0" />
                <button
                  type="button"
                  onClick={() => handleBulkPowerToggle(false)}
                  className={`flex-1 text-center text-sm tracking-widest uppercase transition-all py-2 rounded-full ${
                    !allUnitsOn 
                      ? 'text-slate-900 font-extrabold' 
                      : 'text-slate-400 font-medium hover:text-slate-600'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* EVENTS Horizontal Scroller Section */}
            <div className="flex flex-col flex-none min-h-0 bg-slate-50/50 p-2.5 rounded-[2rem] border border-slate-100 shrink-0">
              
              {/* Event Header */}
              <div className="flex justify-between items-center px-2 mb-2 flex-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EVENTS</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowScheduleForm(true);
                  }}
                  className="relative z-10 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-90 transition-all shadow-md shadow-blue-500/15 flex items-center justify-center"
                  aria-label="Add event"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event Horizontal Row */}
              <div className="flex overflow-x-auto gap-3 pb-1 pt-0.5 px-1 scrollbar-none snap-x w-full">
                {aggregatedEvents.length > 0 ? (
                  aggregatedEvents.map(evt => {
                    const startTimeStr = formatTimeAMPM(evt.time);
                    const endTimeStr = evt.endTime ? formatTimeAMPM(evt.endTime) : formatTimeAMPM(calculateDefaultEndTime(evt.time));

                    return (
                      <div 
                        key={evt.id}
                        className="border border-slate-100 rounded-2xl p-3 flex flex-col justify-between w-[150px] shrink-0 h-[85px] bg-white shadow-sm snap-start relative"
                      >
                        <div>
                          <div className="text-[10px] font-black text-slate-800 tracking-tight flex items-center justify-between">
                            <span>{startTimeStr}</span>
                            <span className="text-slate-300 font-medium">—</span>
                            <span>{endTimeStr}</span>
                          </div>
                          <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider mt-0.5">
                            {evt.action === 'OFF' ? 'OFF' : evt.action === 'SET_TEMP' ? `${evt.temp}°C` : 'ON'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider truncate max-w-[70px]">
                            {formatDays(evt.days)}
                          </span>
                          <button
                            onClick={() => handleToggleSchedule(evt.id, evt.enabled)}
                            className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded transition-all border cursor-pointer ${
                              evt.enabled 
                                ? 'bg-emerald-500 text-white border-emerald-500' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            {evt.enabled ? 'On' : 'Off'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 w-full border border-dashed border-slate-200/60 rounded-2xl bg-white flex flex-col items-center justify-center h-[85px]">
                    <Calendar className="w-4 h-4 text-slate-300 mb-1" />
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">No active schedules</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        );
      })()}

      {/* Schedule modal — rendered at root so it works on mobile + desktop
          (desktop branch is display:none on small screens, which hid the old modal) */}
      <Modal
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        title="Add New Venue Schedule"
        subtitle={`For ${selectedVenueId === 'all' ? `All ${activeOrg.name} Venues` : orgVenues.find(v => v.id === selectedVenueId)?.name || 'Selected Venue'} · ${totalUnitsCount} unit${totalUnitsCount === 1 ? '' : 's'}`}
      >
        <form onSubmit={handleAddSchedule} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Event Name</label>
            <input
              type="text"
              value={newScheduleName}
              onChange={(e) => setNewScheduleName(e.target.value)}
              placeholder="e.g. Eco Night"
              className="w-full px-3.5 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Start Time</label>
              <input
                type="time"
                value={newScheduleTime}
                onChange={(e) => setNewScheduleTime(e.target.value)}
                className="w-full min-w-0 px-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                required
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">End Time</label>
              <input
                type="time"
                value={newScheduleEndTime}
                onChange={(e) => setNewScheduleEndTime(e.target.value)}
                className="w-full min-w-0 px-3 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                required
              />
            </div>
          </div>

          <div className={`grid gap-3 ${newScheduleAction === 'SET_TEMP' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-1.5 min-w-0">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Action / Command</label>
              <CustomDropdown
                value={newScheduleAction}
                onChange={(v) => setNewScheduleAction(v as 'ON' | 'OFF' | 'SET_TEMP')}
                options={[
                  { value: 'ON', label: 'Power ON' },
                  { value: 'OFF', label: 'Power OFF' },
                  { value: 'SET_TEMP', label: 'Set Temp' },
                ]}
                placement="down"
              />
            </div>
            {newScheduleAction === 'SET_TEMP' && (
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Target Temp (°C)</label>
                <input
                  type="number"
                  min="16"
                  max="31"
                  value={newScheduleTemp}
                  onChange={(e) => setNewScheduleTemp(Number(e.target.value))}
                  className="w-full px-3.5 py-3 sm:py-2.5 border border-slate-200 rounded-xl text-sm sm:text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Active Days</label>
            <div className="flex gap-1.5 sm:gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const isActive = newScheduleDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 min-w-0 h-11 sm:h-10 rounded-xl text-[11px] sm:text-[10px] font-black uppercase transition-all active:scale-95 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {day.slice(0, 1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1 sm:pt-2 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              className="flex-1 py-3.5 sm:py-2.5 border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 sm:py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/15 cursor-pointer active:scale-[0.99]"
            >
              Save Event
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );

  // Helper utility to check if any online device is on in venue
  function anyOnVenue(venueId: string) {
    return liveUnits
      .filter((u) => u.venueId === venueId && isOrgVenueBulkTarget(u))
      .some((u) => u.isOn);
  }
}
