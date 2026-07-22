import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import {
  MonitorSmartphone,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Building2,
  MapPin,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { type ACUnit } from '../../types';
import { getDevicesByVenue, setDevicePower, setDeviceRemote, setDeviceTemperature } from '../../api/deviceApi';
import { getVenuesByOrganization } from '../../api/venueApi';
import { getAppSocket } from '../../api/brandSocket';
import type { Venue } from '../../types';

/** Manager devices page — markup/CSS preserved from legacy ManagerView */
export function DevicesPage() {
  const {
    fetchMyOrganizations, orgsLoading, setUnits,
  } = useAppContext();
  const {
    orgs, venues,
    onTogglePower,
    onUpdateDevice,
    setShowAddDevice,
    expandedDeviceId, setExpandedDeviceId,
    deviceTempInputs, setDeviceTempInputs,
    setEditingDevice,
    setDeletingId, setDeleteType, setDeleteError,
    setShowAddEventModal,
    setEventDeviceId,
    showAddDevice,
    subscribeDeviceEventAdd,
    subscribeDeviceDeleted,
    subscribeDeviceUpdated,
  } = useManagerWorkspace();

  const [selectedOrgId, setSelectedOrgId] = useState(orgs[0]?.id || '');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [orgVenues, setOrgVenues] = useState<Venue[]>([]);
  const [venueDevices, setVenueDevices] = useState<ACUnit[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState('');
  const [powerPendingId, setPowerPendingId] = useState<string | null>(null);
  const [powerError, setPowerError] = useState('');
  const prevShowAddDevice = useRef(showAddDevice);
  const tempDebounceTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(tempDebounceTimers.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  // Ensure orgs are loaded on first visit (not only after Org/Venue pages)
  useEffect(() => {
    void fetchMyOrganizations().catch(() => {
      // surfaced via empty org dropdown / devicesError
    });
  }, [fetchMyOrganizations]);

  // Default org for logged-in manager once orgs are available
  useEffect(() => {
    if (orgs.length === 0) {
      if (selectedOrgId) setSelectedOrgId('');
      return;
    }
    const stillValid = orgs.some((org) => org.id === selectedOrgId);
    if (!selectedOrgId || !stillValid) {
      setSelectedOrgId(orgs[0].id);
    }
  }, [orgs, selectedOrgId]);

  // Load venues for selected organization; default to first venue
  useEffect(() => {
    let active = true;
    setSelectedVenueId('');
    setOrgVenues([]);
    setVenueDevices([]);
    setDevicesError('');

    if (!selectedOrgId) {
      setLoadingVenues(false);
      return () => { active = false; };
    }

    setLoadingVenues(true);
    getVenuesByOrganization(selectedOrgId)
      .then((list) => {
        if (!active) return;
        setOrgVenues(list);
        setSelectedVenueId(list[0]?.id || '');
      })
      .catch(() => {
        if (!active) return;
        setOrgVenues([]);
        setDevicesError('Failed to load venues for this organization');
      })
      .finally(() => {
        if (active) setLoadingVenues(false);
      });

    return () => { active = false; };
  }, [selectedOrgId]);

  // Load devices when venue changes
  useEffect(() => {
    let active = true;
    setVenueDevices([]);
    setDevicesError('');

    if (!selectedVenueId) {
      setLoadingDevices(false);
      return () => { active = false; };
    }

    setLoadingDevices(true);
    getDevicesByVenue(selectedVenueId)
      .then((list) => {
        if (!active) return;
        setVenueDevices(list);
        // Keep dashboard/overview `units` in sync with real devices (drop mock units)
        setUnits((prev) => {
          const real = prev.filter((u) => /^[a-fA-F0-9]{24}$/.test(u.id));
          const byId = new Map(real.map((u) => [u.id, u]));
          list.forEach((device) => {
            const existing = byId.get(device.id);
            byId.set(device.id, existing ? { ...existing, ...device } : device);
          });
          return Array.from(byId.values());
        });
      })
      .catch((err: any) => {
        if (!active) return;
        setDevicesError(
          err?.response?.data?.message || err?.message || 'Failed to load devices'
        );
      })
      .finally(() => {
        if (active) setLoadingDevices(false);
      });

    return () => { active = false; };
  }, [selectedVenueId, setUnits]);

  // Refresh list after Add Device modal closes successfully
  useEffect(() => {
    if (prevShowAddDevice.current && !showAddDevice && selectedVenueId) {
      getDevicesByVenue(selectedVenueId)
        .then(setVenueDevices)
        .catch(() => {});
    }
    prevShowAddDevice.current = showAddDevice;
  }, [showAddDevice, selectedVenueId]);

  // Keep local list in sync with add-event / delete / update from shared modals
  useEffect(() => {
    const unsubEvent = subscribeDeviceEventAdd((deviceId, event) => {
      setVenueDevices((prev) =>
        prev.map((u) =>
          u.id === deviceId ? { ...u, events: [...(u.events || []), event] } : u
        )
      );
    });
    const unsubDelete = subscribeDeviceDeleted((deviceId) => {
      setVenueDevices((prev) => prev.filter((u) => u.id !== deviceId));
    });
    const unsubUpdate = subscribeDeviceUpdated((device) => {
      setVenueDevices((prev) => {
        // Moved to another venue — drop from current list
        if (selectedVenueId && device.venueId !== selectedVenueId) {
          return prev.filter((u) => u.id !== device.id);
        }
        const exists = prev.some((u) => u.id === device.id);
        if (!exists) {
          if (!selectedVenueId || device.venueId === selectedVenueId) {
            return [device, ...prev];
          }
          return prev;
        }
        return prev.map((u) => (u.id === device.id ? { ...u, ...device } : u));
      });
    });
    return () => {
      unsubEvent();
      unsubDelete();
      unsubUpdate();
    };
  }, [subscribeDeviceEventAdd, subscribeDeviceDeleted, subscribeDeviceUpdated, selectedVenueId]);

  // Live power state from ESP via Socket.IO
  useEffect(() => {
    const socket = getAppSocket();
    const onDeviceState = (payload: {
      id?: string;
      deviceId?: string;
      state?: 'on' | 'off';
      isOn?: boolean;
      temperature?: number;
    }) => {
      if (!payload?.id) return;
      const patch: Partial<ACUnit> = {};
      if (typeof payload.isOn === 'boolean') {
        patch.isOn = payload.isOn;
      } else if (payload.state === 'on' || payload.state === 'off') {
        patch.isOn = payload.state === 'on';
      }
      if (
        typeof payload.temperature === 'number' &&
        payload.temperature >= 16 &&
        payload.temperature <= 30
      ) {
        patch.targetTemp = payload.temperature;
        patch.currentTemp = payload.temperature;
        setDeviceTempInputs((prev) => ({
          ...prev,
          [payload.id!]: String(payload.temperature),
        }));
      }
      if (Object.keys(patch).length === 0) return;

      setVenueDevices((prev) =>
        prev.map((u) => (u.id === payload.id ? { ...u, ...patch } : u))
      );
      onUpdateDevice(payload.id, patch);
      setPowerPendingId((current) => (current === payload.id ? null : current));
      setPowerError('');
    };

    socket.on('device:state', onDeviceState);

    const onDeviceRemote = (payload: {
      id?: string;
      remote?: 'unlock' | 'lock' | 'superlock';
      isLocked?: boolean;
      eventLocked?: boolean;
    }) => {
      if (!payload?.id) return;
      const patch: Partial<ACUnit> = {
        isLocked: Boolean(payload.isLocked),
        eventLocked: Boolean(payload.eventLocked),
      };
      if (payload.remote === 'unlock') {
        patch.isLocked = false;
        patch.eventLocked = false;
      } else if (payload.remote === 'lock') {
        patch.isLocked = true;
        patch.eventLocked = false;
      } else if (payload.remote === 'superlock') {
        patch.isLocked = true;
        patch.eventLocked = true;
      }
      setVenueDevices((prev) =>
        prev.map((u) => (u.id === payload.id ? { ...u, ...patch } : u))
      );
      onUpdateDevice(payload.id, patch);
    };

    socket.on('device:remote', onDeviceRemote);
    return () => {
      socket.off('device:state', onDeviceState);
      socket.off('device:remote', onDeviceRemote);
    };
  }, [onUpdateDevice]);

  const selectedVenueName = useMemo(
    () =>
      orgVenues.find((v) => v.id === selectedVenueId)?.name ||
      venues.find((v) => v.id === selectedVenueId)?.name ||
      '—',
    [orgVenues, venues, selectedVenueId]
  );

  const updateLocalDevice = (id: string, data: Partial<ACUnit>) => {
    setVenueDevices((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    onUpdateDevice(id, data);
  };

  const changeDeviceLock = async (
    id: string,
    lockLabel: 'Unlocked' | 'Locked' | 'Super Locked'
  ) => {
    const remote =
      lockLabel === 'Super Locked'
        ? 'superlock'
        : lockLabel === 'Locked'
          ? 'lock'
          : 'unlock';

    const prev = venueDevices.find((u) => u.id === id);
    // Optimistic UI
    updateLocalDevice(id, {
      isLocked: remote === 'lock' || remote === 'superlock',
      eventLocked: remote === 'superlock',
    });

    try {
      setPowerError('');
      await setDeviceRemote(id, remote);
    } catch (err: any) {
      if (prev) {
        updateLocalDevice(id, {
          isLocked: prev.isLocked,
          eventLocked: prev.eventLocked,
        });
      }
      setPowerError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update lock mode'
      );
    }
  };

  const toggleLocalPower = async (id: string) => {
    const unit = venueDevices.find((u) => u.id === id);
    if (!unit || powerPendingId === id) return;
    if (unit.eventLocked) {
      setPowerError('Device is Super Locked. Change lock mode first.');
      return;
    }

    const nextState: 'on' | 'off' = unit.isOn ? 'off' : 'on';
    setPowerError('');
    setPowerPendingId(id);

    try {
      await setDevicePower(id, nextState);
      // Button updates when ESP reports actual state over socket
    } catch (err: any) {
      setPowerPendingId(null);
      setPowerError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to send power command'
      );
    }
  };

  const scheduleTemperatureSend = (id: string, temperature: number) => {
    const unit = venueDevices.find((u) => u.id === id);
    if (unit?.eventLocked) {
      setPowerError('Device is Super Locked. Change lock mode first.');
      return;
    }

    const existing = tempDebounceTimers.current[id];
    if (existing) window.clearTimeout(existing);

    tempDebounceTimers.current[id] = window.setTimeout(() => {
      void (async () => {
        try {
          setPowerError('');
          await setDeviceTemperature(id, temperature);
        } catch (err: any) {
          setPowerError(
            err?.response?.data?.message ||
              err?.message ||
              'Failed to send temperature command'
          );
        } finally {
          delete tempDebounceTimers.current[id];
        }
      })();
    }, 2000);
  };

  const isBootstrapping =
    orgsLoading ||
    (orgs.length > 0 && !selectedOrgId) ||
    loadingVenues ||
    (!!selectedVenueId && loadingDevices);

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-5 bg-slate-50/15 overflow-hidden select-none">
                {/* Header row */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 shrink-0 mb-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
                    <MonitorSmartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span className="truncate">Device Management</span>
                  </h3>
                  
                  <div className="flex items-center gap-2 w-full lg:w-auto min-w-0 flex-wrap lg:flex-nowrap">
                    <div className="flex-1 min-w-0 lg:w-44">
                      <CustomDropdown
                        icon={Building2}
                        value={selectedOrgId}
                        onChange={setSelectedOrgId}
                        placeholder="Select organization"
                        disabled={orgsLoading || orgs.length === 0}
                        options={
                          orgs.length > 0
                            ? orgs.map((org) => ({ value: org.id, label: org.name }))
                            : [{ value: '', label: orgsLoading ? 'Loading…' : 'No organizations', disabled: true }]
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0 lg:w-40">
                      <CustomDropdown
                        icon={MapPin}
                        value={selectedVenueId}
                        onChange={setSelectedVenueId}
                        placeholder="Select venue"
                        disabled={!selectedOrgId || loadingVenues || orgVenues.length === 0}
                        options={
                          orgVenues.length > 0
                            ? orgVenues.map((v) => ({ value: v.id, label: v.name }))
                            : [{ value: '', label: loadingVenues ? 'Loading…' : 'No venues available', disabled: true }]
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddDevice(true)}
                      className="hidden sm:inline-flex shrink-0 items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-sm shadow-blue-600/15 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Device</span>
                    </button>
                  </div>
                </div>

                {powerError && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600">
                    {powerError}
                  </div>
                )}
      
                {/* Devices table card */}
                <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
                    {isBootstrapping ? (
                      <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Loading devices…</span>
                      </div>
                    ) : devicesError ? (
                      <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                        <span className="text-sm font-black text-slate-600">{devicesError}</span>
                      </div>
                    ) : venueDevices.length === 0 ? (
                      <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <MonitorSmartphone className="w-12 h-12 text-slate-300 mb-3" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Devices Found</span>
                        <p className="text-xs text-slate-400 max-w-[200px]">
                          {selectedVenueId
                            ? 'No devices registered for this venue yet'
                            : orgs.length === 0
                              ? 'No organizations available yet'
                              : 'Select an organization and venue to view devices'}
                        </p>
                      </div>
                    ) : (
                      <table className="w-full table-fixed border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                          <tr className="border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider text-left">
                            <th className="py-2.5 pl-5 pr-0 w-[18%]">Name</th>
                            <th className="py-2.5 px-0.5 w-[9%] hidden sm:table-cell">Venue</th>
                            <th className="py-2.5 px-0.5 w-[12%] text-center hidden sm:table-cell">Temp</th>
                            <th className="py-2.5 px-0.5 w-[9%] text-center hidden sm:table-cell">Status</th>
                            <th className="py-2.5 px-0.5 w-[9%] text-center hidden md:table-cell">Power</th>
                            <th className="py-2.5 px-0.5 w-[13%] text-center hidden sm:table-cell">Lock</th>
                            <th className="py-2.5 px-0.5 w-[6%] text-center hidden sm:table-cell">Diag</th>
                            <th className="py-2.5 px-0.5 w-[7%] text-center hidden md:table-cell">Event</th>
                            <th className="py-2.5 pl-0 pr-5 w-[12%] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                          {venueDevices.map((unit) => {
                            const isExpanded = expandedDeviceId === unit.id;
                            const currentInputVal = deviceTempInputs[unit.id] ?? unit.targetTemp.toString();
                            const displayName = unit.name.length > 6 ? `${unit.name.slice(0, 6)}...` : unit.name;
      
                            const lockValue =
                              unit.isLocked && unit.eventLocked
                                ? 'Super Locked'
                                : unit.isLocked
                                  ? 'Locked'
                                  : 'Unlocked';
                            const controlsDisabled = !unit.isOn || unit.eventLocked;
      
                            const applyTemp = (next: number) => {
                              if (unit.eventLocked) {
                                setPowerError('Device is Super Locked. Change lock mode first.');
                                return;
                              }
                              const clamped = Math.max(16, Math.min(30, next));
                              setDeviceTempInputs(prev => ({ ...prev, [unit.id]: clamped.toString() }));
                              updateLocalDevice(unit.id, {
                                targetTemp: clamped,
                                currentTemp: clamped,
                              });
                              // Wait 2s after last change, then send to ESP
                              scheduleTemperatureSend(unit.id, clamped);
                            };
      
                            return (
                              <React.Fragment key={unit.id}>
                                <tr className="hover:bg-slate-50/40 transition-colors">
                                  <td className="py-2 pl-5 pr-0 align-middle">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                        <MonitorSmartphone className="w-3.5 h-3.5" />
                                      </div>
                                      <span
                                        className="font-extrabold text-slate-900 truncate cursor-default"
                                        title={unit.name}
                                      >
                                        {displayName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 align-middle hidden sm:table-cell">
                                    <span className="block truncate text-slate-500 font-semibold" title={selectedVenueName}>
                                      {selectedVenueName}
                                    </span>
                                  </td>
                                  <td className="py-2 px-0.5 hidden sm:table-cell">
                                    <div className="flex justify-center">
                                      <div className={`flex items-center bg-slate-50 border border-slate-200 rounded-full p-0.5 ${controlsDisabled ? 'opacity-40 grayscale' : ''}`}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (controlsDisabled) return;
                                            const currentVal = parseInt(currentInputVal) || unit.targetTemp;
                                            applyTemp(currentVal - 1);
                                          }}
                                          disabled={controlsDisabled}
                                          className={`w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded-full font-black text-xs ${controlsDisabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="16"
                                          max="30"
                                          value={currentInputVal}
                                          disabled={controlsDisabled}
                                          onChange={(e) => {
                                            if (unit.eventLocked) return;
                                            let rawVal = e.target.value;
                                            if (rawVal !== '') {
                                              const val = parseInt(rawVal);
                                              if (!isNaN(val)) {
                                                if (val > 30) rawVal = '30';
                                                else if (val < 16 && rawVal.length >= 2) rawVal = '16';
                                              }
                                            }
                                            setDeviceTempInputs(prev => ({ ...prev, [unit.id]: rawVal }));
                                            const parsed = parseInt(rawVal);
                                            if (!isNaN(parsed) && parsed >= 16 && parsed <= 30 && unit.isOn) {
                                              updateLocalDevice(unit.id, {
                                                targetTemp: parsed,
                                                currentTemp: parsed,
                                              });
                                              scheduleTemperatureSend(unit.id, parsed);
                                            }
                                          }}
                                          onBlur={() => {
                                            if (controlsDisabled) return;
                                            let val = parseInt(currentInputVal);
                                            if (isNaN(val) || val < 16) val = 16;
                                            if (val > 30) val = 30;
                                            applyTemp(val);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !controlsDisabled) {
                                              let val = parseInt(currentInputVal);
                                              if (isNaN(val) || val < 16) val = 16;
                                              if (val > 30) val = 30;
                                              applyTemp(val);
                                            }
                                          }}
                                          className={`w-8 text-center font-black text-xs text-slate-800 bg-transparent outline-none no-spin ${controlsDisabled ? 'cursor-not-allowed' : ''}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (controlsDisabled) return;
                                            const currentVal = parseInt(currentInputVal) || unit.targetTemp;
                                            applyTemp(currentVal + 1);
                                          }}
                                          disabled={controlsDisabled}
                                          className={`w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded-full font-black text-xs ${controlsDisabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 text-center hidden sm:table-cell">
                                    <div className="flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => void toggleLocalPower(unit.id)}
                                        disabled={powerPendingId === unit.id || unit.eventLocked}
                                        title={
                                          unit.eventLocked
                                            ? 'Super Locked'
                                            : powerPendingId === unit.id
                                              ? 'Waiting for device…'
                                              : 'Toggle power'
                                        }
                                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
                                          powerPendingId === unit.id || unit.eventLocked
                                            ? 'opacity-60 cursor-not-allowed'
                                            : 'cursor-pointer'
                                        } ${unit.isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                      >
                                        <span className={`absolute text-[8px] font-black text-white ${unit.isOn ? 'left-1.5' : 'right-1.5'}`}>
                                          {powerPendingId === unit.id ? '…' : unit.isOn ? 'ON' : 'OFF'}
                                        </span>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${unit.isOn ? 'translate-x-7' : 'translate-x-1'}`} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 hidden md:table-cell">
                                    <div className="flex flex-col items-center min-w-0">
                                      <div className="flex items-center gap-0.5 text-[11px] font-black text-slate-800">
                                        <Zap className="w-3 h-3 text-blue-500 fill-blue-500 shrink-0" />
                                        <span className="tabular-nums">{unit.powerConsumption ?? 0}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 hidden sm:table-cell">
                                    <div className="min-w-0 max-w-[8.5rem] mx-auto">
                                      <CustomDropdown
                                        value={lockValue}
                                        placement="down"
                                        onChange={(v) => {
                                          void changeDeviceLock(
                                            unit.id,
                                            v as 'Unlocked' | 'Locked' | 'Super Locked'
                                          );
                                        }}
                                        options={[
                                          { value: 'Unlocked', label: 'Unlock' },
                                          { value: 'Locked', label: 'Lock' },
                                          { value: 'Super Locked', label: 'Super Lock' },
                                        ]}
                                        triggerClassName="!py-1.5 !pl-2.5 !pr-2 !rounded-xl !text-[10px]"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 text-center hidden sm:table-cell">
                                    <div className="flex justify-center">
                                      {unit.hasFault ? (
                                        <span
                                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60"
                                          title="Faulty"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                        </span>
                                      ) : (
                                        <span
                                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-200/60"
                                          title="Healthy"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 text-center hidden md:table-cell">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedDeviceId(isExpanded ? null : unit.id)}
                                      className={`px-2 py-1 rounded-lg transition-all text-[11px] font-black inline-flex items-center gap-0.5 cursor-pointer tabular-nums ${
                                        isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                      title="Events"
                                    >
                                      {unit.events?.length || 0}
                                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  </td>
                                  <td className="py-2 pl-0 pr-5 text-right align-middle">
                                    <div className="flex justify-end gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingDevice({
                                            ...unit,
                                            organizationId:
                                              unit.organizationId || selectedOrgId || '',
                                          })
                                        }
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                        title="Edit Device"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteError('');
                                          setDeletingId(unit.id);
                                          setDeleteType('device');
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                        title="Delete Device"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
      
                                {isExpanded && (
                                  <tr className="bg-slate-50/40">
                                    <td colSpan={9} className="px-3 py-3 border-b border-slate-100">
                                      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-inner">
                                        <div className="flex justify-between items-center mb-3 gap-2">
                                          <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-2 min-w-0">
                                            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                            <span className="truncate">Schedules ({unit.events?.length || 0})</span>
                                          </h5>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEventDeviceId(unit.id);
                                              setShowAddEventModal(true);
                                            }}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-all cursor-pointer shrink-0"
                                          >
                                            <Plus className="w-3 h-3 stroke-[2.5]" /> Add Event
                                          </button>
                                        </div>
                                        {unit.events && unit.events.length > 0 ? (
                                          <div className="space-y-2">
                                            {unit.events.map(event => (
                                              <div key={event.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/70 flex justify-between items-center gap-3">
                                                <div className="min-w-0">
                                                  <p className="font-bold text-slate-800 text-xs truncate">{event.name || 'Event'} - {event.time}</p>
                                                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold truncate">
                                                    {event.isRecurring
                                                      ? event.days.join(', ')
                                                      : `${event.startDate || ''} to ${event.endDate || ''}`}
                                                  </p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                  <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                                    event.action === 'ON' ? 'bg-emerald-100 text-emerald-700' :
                                                    event.action === 'OFF' ? 'bg-slate-200 text-slate-700' :
                                                    'bg-blue-100 text-blue-700'
                                                  }`}>
                                                    {event.action} {event.targetTemp ? `${event.targetTemp}°C` : ''}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateLocalDevice(unit.id, {
                                                        events: unit.events.map(e => e.id === event.id ? { ...e, enabled: !e.enabled } : e)
                                                      });
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${event.enabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                  >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${event.enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 text-center font-semibold">No schedules configured.</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
    </>
  );
}
