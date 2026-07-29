import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACUnit, Role, ACEvent, EnergyData, getACPowerDraw } from '../../types';
import {
  Power,
  Thermometer,
  Lock,
  Unlock,
  ArrowLeft,
  AlertTriangle,
  Zap,
  Cpu,
  Wifi,
  WifiOff,
  Gauge,
  Clock,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { EnergyChart } from '../reports/EnergyChart';
import { CustomDropdown } from '../ui/CustomDropdown';
import { Modal } from '../ui/Modal';
import { EventOverrideModal } from '../ui/EventOverrideModal';
import { getDeviceEnergy, type EnergyPeriod } from '../../api/energyApi';
import {
  setDevicePower,
  setDeviceTemperature,
  setDeviceRemote,
} from '../../api/deviceApi';
import {
  createScheduleEvent,
  deleteScheduleEvent,
  listScheduleEvents,
  scheduleEventToACEvent,
  setScheduleEventEnabled,
} from '../../api/eventApi';
import {
  withEventOverrideGuard,
  type EventOverridePending,
} from '../../utils/eventOverride';

interface ACDetailProps {
  unit: ACUnit;
  role: Role;
  /** Whether the user can change device controls (all authenticated roles) */
  canManage?: boolean;
  onBack: () => void;
  /** Sync optimistic updates back to AppContext units */
  onUnitChange?: (id: string, patch: Partial<ACUnit>) => void;
}

type ChartView = EnergyPeriod;
type RemoteLabel = 'Unlocked' | 'Locked' | 'Super Locked';

const DAY_OPTIONS = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' },
];

function emptyEnergyData(): EnergyData {
  return {
    hourly: [],
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  };
}

function remoteFromUnit(unit: ACUnit): RemoteLabel {
  if (unit.eventLocked) return 'Super Locked';
  if (unit.isLocked) return 'Locked';
  return 'Unlocked';
}

function labelToRemote(label: RemoteLabel): 'unlock' | 'lock' | 'superlock' {
  if (label === 'Super Locked') return 'superlock';
  if (label === 'Locked') return 'lock';
  return 'unlock';
}

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '—';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  if (!Number.isFinite(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function ACDetail({
  unit: unitProp,
  role,
  canManage = true,
  onBack,
  onUnitChange,
}: ACDetailProps) {
  const isManager = role === 'manager' || role === 'admin';
  const [unit, setUnit] = useState<ACUnit>(unitProp);
  const [chartView, setChartView] = useState<ChartView>('daily');
  const [remotePending, setRemotePending] = useState(false);
  const [powerPending, setPowerPending] = useState(false);
  const [controlError, setControlError] = useState('');
  const [eventOverridePending, setEventOverridePending] =
    useState<EventOverridePending | null>(null);

  const [energyData, setEnergyData] = useState<EnergyData>(() => emptyEnergyData());
  const [periodTotalKwh, setPeriodTotalKwh] = useState(0);
  const [todayKwh, setTodayKwh] = useState<number | null>(null);
  const [loadingEnergy, setLoadingEnergy] = useState(false);
  const [energyError, setEnergyError] = useState<string | null>(null);

  const [events, setEvents] = useState<ACEvent[]>(unitProp.events || []);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventActionError, setEventActionError] = useState('');

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventTemp, setEventTemp] = useState('22');
  const [eventDays, setEventDays] = useState<string[]>([]);
  const [eventOnOffAction, setEventOnOffAction] = useState<'ON' | 'OFF'>('ON');
  const [eventTime, setEventTime] = useState('08:00');
  const [eventEndTime, setEventEndTime] = useState('18:00');
  const [eventRemote, setEventRemote] = useState<'lock' | 'unlock'>('unlock');
  const [savingEvent, setSavingEvent] = useState(false);

  const tempDebounceRef = useRef<number | null>(null);

  // Keep local unit in sync when parent reloads device
  useEffect(() => {
    setUnit(unitProp);
    if (Array.isArray(unitProp.events)) {
      setEvents(unitProp.events);
    }
  }, [unitProp]);

  const patchUnit = useCallback(
    (patch: Partial<ACUnit>) => {
      setUnit((prev) => ({ ...prev, ...patch }));
      onUnitChange?.(unit.id, patch);
    },
    [onUnitChange, unit.id]
  );

  const isOnline = unit.status !== 'offline';
  /** Permission + lock (offline is checked on action so we can show a message) */
  const canAttemptControl =
    canManage && (!unit.isLocked || isManager);
  const canControl = canAttemptControl && isOnline;
  const canControlEvents =
    canManage && (!unit.eventLocked || isManager);

  const powerInfo = useMemo(() => getACPowerDraw(unit), [unit]);
  const liveKw =
    unit.powerConsumption != null && Number.isFinite(Number(unit.powerConsumption))
      ? Number(unit.powerConsumption)
      : powerInfo.power;
  const dialProgress = Math.max(0, Math.min(1, (unit.targetTemp - 16) / 14));
  const circumference = 2 * Math.PI * 88;
  const remoteValue = remoteFromUnit(unit);

  const requireOnline = useCallback(() => {
    if (unit.status === 'offline') {
      setControlError('Device is offline');
      return false;
    }
    setControlError('');
    return true;
  }, [unit.status]);

  // Load device-scoped schedule events
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      if (!unit.id || !unit.organizationId) {
        setEvents([]);
        return;
      }
      setEventsLoading(true);
      setEventActionError('');
      try {
        const list = await listScheduleEvents({
          organizationId: unit.organizationId,
          deviceId: unit.id,
          scope: 'device',
        });
        if (cancelled) return;
        const mapped = list
          .filter(
            (ev) =>
              ev.scope === 'device' &&
              String(ev.deviceId || '') === String(unit.id)
          )
          .map(scheduleEventToACEvent);
        setEvents(mapped);
        patchUnit({ events: mapped });
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load device events:', err);
        setEventActionError('Could not load scheduled events');
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }

    void loadEvents();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when device identity changes
  }, [unit.id, unit.organizationId]);

  // Energy chart for this device
  useEffect(() => {
    let cancelled = false;

    async function loadDeviceEnergy() {
      if (!unit.id) {
        setEnergyData(emptyEnergyData());
        setPeriodTotalKwh(0);
        return;
      }

      setLoadingEnergy(true);
      setEnergyError(null);
      try {
        const res = await getDeviceEnergy([unit.id], chartView);
        if (cancelled) return;
        setEnergyData((prev) => ({
          ...prev,
          [chartView]: res.series || [],
        }));
        setPeriodTotalKwh(Number(res.totalKwh) || 0);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load device energy:', err);
        setEnergyError('Could not load consumption data');
        setEnergyData((prev) => ({ ...prev, [chartView]: [] }));
        setPeriodTotalKwh(0);
      } finally {
        if (!cancelled) setLoadingEnergy(false);
      }
    }

    void loadDeviceEnergy();
    return () => {
      cancelled = true;
    };
  }, [unit.id, chartView]);

  useEffect(() => {
    let cancelled = false;

    async function loadToday() {
      if (!unit.id) {
        setTodayKwh(null);
        return;
      }
      try {
        const res = await getDeviceEnergy([unit.id], 'daily');
        if (cancelled) return;
        setTodayKwh(Number(res.totalKwh) || 0);
        setEnergyData((prev) => ({
          ...prev,
          daily: res.series || prev.daily,
        }));
      } catch {
        if (!cancelled) setTodayKwh(null);
      }
    }

    void loadToday();
    return () => {
      cancelled = true;
    };
  }, [unit.id]);

  useEffect(() => {
    return () => {
      if (tempDebounceRef.current) {
        window.clearTimeout(tempDebounceRef.current);
      }
    };
  }, []);

  const handleTogglePower = async () => {
    if (!canManage) return;
    if (!requireOnline()) return;
    if (!canAttemptControl) return;
    if (powerPending) return;

    const nextState: 'on' | 'off' = unit.isOn ? 'off' : 'on';
    setPowerPending(true);
    setControlError('');

    try {
      await withEventOverrideGuard({
        deviceIds: [unit.id],
        ignoreAllTargets: false,
        onNeedConfirm: (pending) => setEventOverridePending(pending),
        apply: async () => {
          await setDevicePower(unit.id, nextState);
          patchUnit({ isOn: nextState === 'on' });
        },
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to send power command';
      setControlError(message);
    } finally {
      setPowerPending(false);
    }
  };

  const sendTemperature = useCallback(
    async (temperature: number) => {
      if (!canManage) return;
      if (!requireOnline()) return;
      if (!canAttemptControl) return;

      const clamped = Math.max(16, Math.min(30, temperature));
      setControlError('');

      try {
        await withEventOverrideGuard({
          deviceIds: [unit.id],
          ignoreAllTargets: false,
          onNeedConfirm: (pending) => setEventOverridePending(pending),
          apply: async () => {
            await setDeviceTemperature(unit.id, clamped);
            patchUnit({ targetTemp: clamped, currentTemp: clamped });
          },
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } }; message?: string })
            ?.response?.data?.message ||
          (err as { message?: string })?.message ||
          'Failed to send temperature command';
        setControlError(message);
      }
    },
    [canAttemptControl, canManage, patchUnit, requireOnline, unit.id]
  );

  const handleTempChange = (raw: number) => {
    if (!canManage) return;
    if (!requireOnline()) return;
    if (!canAttemptControl) return;

    const clamped = Math.max(16, Math.min(30, raw));
    patchUnit({ targetTemp: clamped });

    if (tempDebounceRef.current) {
      window.clearTimeout(tempDebounceRef.current);
    }
    tempDebounceRef.current = window.setTimeout(() => {
      void sendTemperature(clamped);
    }, 2000);
  };

  const handleRemoteChange = async (label: string) => {
    if (
      label !== 'Unlocked' &&
      label !== 'Locked' &&
      label !== 'Super Locked'
    ) {
      return;
    }
    if (!canManage) return;
    if (!requireOnline()) return;
    if (!isManager && unit.eventLocked) return;

    setRemotePending(true);
    setControlError('');
    const remote = labelToRemote(label);
    const snapshot = {
      isLocked: unit.isLocked,
      eventLocked: unit.eventLocked,
    };
    patchUnit({
      isLocked: remote === 'lock' || remote === 'superlock',
      eventLocked: remote === 'superlock',
    });

    try {
      await setDeviceRemote(unit.id, remote);
    } catch (err: unknown) {
      patchUnit(snapshot);
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to update lock mode';
      setControlError(message);
    } finally {
      setRemotePending(false);
    }
  };

  const closeAddEventModal = () => {
    setShowAddEventModal(false);
    setEventName('');
    setEventTemp('22');
    setEventDays([]);
    setEventOnOffAction('ON');
    setEventTime('08:00');
    setEventEndTime('18:00');
    setEventRemote('unlock');
    setSavingEvent(false);
  };

  const handleAddEvent = async () => {
    if (!canManage || !canControlEvents) return;
    if (!eventName.trim() || !eventTime || !eventEndTime) return;
    if (!unit.organizationId) {
      setEventActionError('Organization missing for this device');
      return;
    }

    setSavingEvent(true);
    setEventActionError('');
    try {
      const saved = await createScheduleEvent({
        name: eventName.trim(),
        scope: 'device',
        organizationId: unit.organizationId,
        deviceId: unit.id,
        venueId: unit.venueId || null,
        action: eventOnOffAction,
        targetTemp:
          eventOnOffAction === 'ON' ? parseInt(eventTemp, 10) : null,
        startTime: eventTime,
        endTime: eventEndTime,
        days: eventDays,
        remote: eventOnOffAction === 'OFF' ? 'lock' : eventRemote,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      const newEvent = scheduleEventToACEvent(saved);
      const next = [...events, newEvent];
      setEvents(next);
      patchUnit({ events: next });
      closeAddEventModal();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to create event';
      setEventActionError(message);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!canControlEvents) return;
    setEventActionError('');
    try {
      await deleteScheduleEvent(eventId);
      const next = events.filter((e) => e.id !== eventId);
      setEvents(next);
      patchUnit({ events: next });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to delete event';
      setEventActionError(message);
    }
  };

  const handleToggleEvent = async (eventId: string) => {
    if (!canControlEvents) return;
    const current = events.find((e) => e.id === eventId);
    if (!current) return;
    setEventActionError('');
    try {
      const saved = await setScheduleEventEnabled(eventId, !current.enabled);
      const mapped = scheduleEventToACEvent(saved);
      const next = events.map((e) => (e.id === eventId ? mapped : e));
      setEvents(next);
      patchUnit({ events: next });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to update event';
      setEventActionError(message);
    }
  };

  const controlsBlockedReason = !canManage
    ? 'View-only access — you cannot change this device.'
    : !isOnline
      ? 'Device is offline'
      : unit.isLocked && !isManager
        ? 'Device is locked.'
        : '';

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 md:gap-6 pb-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 hover:bg-white bg-white/70 border border-slate-200/80 rounded-xl transition-colors shrink-0 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {unit.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {isOnline ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {unit.hasFault && (
                <span
                  className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200"
                  title={unit.healthAlert || 'Fault detected'}
                >
                  <AlertTriangle className="w-3 h-3 animate-pulse" />
                  Fault
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
              {[unit.brand, unit.capacityTon?.replace(/ton/i, ' Ton')]
                .filter(Boolean)
                .join(' · ') || 'AC unit'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end w-full sm:w-auto">
          <div className="w-full sm:w-[200px]">
            <CustomDropdown
              value={remoteValue}
              onChange={(v) => void handleRemoteChange(v)}
              disabled={
                remotePending ||
                !canManage ||
                !isOnline ||
                (!isManager && unit.eventLocked)
              }
              icon={remoteValue === 'Unlocked' ? Unlock : Lock}
              options={[
                { value: 'Unlocked', label: 'Unlock' },
                { value: 'Locked', label: 'Lock' },
                { value: 'Super Locked', label: 'Super Lock' },
              ]}
              className="w-full"
              triggerClassName={
                remoteValue === 'Super Locked'
                  ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
                  : remoteValue === 'Locked'
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }
            />
          </div>
        </div>
      </header>

      {controlError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{controlError}</span>
        </div>
      ) : null}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              unit.isOn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Power className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Status
            </p>
            <p
              className={`text-sm sm:text-base font-black truncate ${
                unit.isOn ? 'text-emerald-600' : 'text-slate-700'
              }`}
            >
              {unit.isOn ? 'Running' : 'Standby'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Room / Set
            </p>
            <p className="text-sm sm:text-base font-black text-slate-800 tabular-nums">
              {unit.currentTemp}° / {unit.targetTemp}°
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Power
            </p>
            <p className="text-sm sm:text-base font-black text-slate-800 tabular-nums truncate">
              {unit.hasEnergySensor === false
                ? '—'
                : `${Number(liveKw).toFixed(2)} kW`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Specs
            </p>
            <p className="text-sm sm:text-base font-black text-slate-800 truncate">
              {unit.brand || 'AC'} ·{' '}
              {unit.capacityTon ? unit.capacityTon.replace(/ton/i, 'T') : '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 md:gap-6 items-stretch">
        <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div
            className={`h-1.5 w-full ${unit.isOn ? 'bg-emerald-500' : 'bg-slate-200'}`}
          />
          <div className="p-5 sm:p-6 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Climate Control
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  Set temperature & power
                </p>
                {controlsBlockedReason ? (
                  <p className="text-[10px] font-semibold text-amber-600 mt-1">
                    {controlsBlockedReason}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleTogglePower()}
                disabled={!canAttemptControl || powerPending}
                title={
                  !isOnline
                    ? 'Device is offline'
                    : powerPending
                      ? 'Sending…'
                      : unit.isOn
                        ? 'Turn off'
                        : 'Turn on'
                }
                className={`p-3.5 rounded-2xl transition-all shrink-0 ${
                  unit.isOn
                    ? 'bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                    : 'bg-slate-100 text-slate-400'
                } ${
                  !canAttemptControl || powerPending || !isOnline
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105'
                }`}
                aria-label={unit.isOn ? 'Turn off' : 'Turn on'}
              >
                <Power className="w-7 h-7" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-4">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 192 192"
                >
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke={unit.isOn ? '#3b82f6' : '#cbd5e1'}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - dialProgress)}
                    className="transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-4xl sm:text-5xl font-light text-slate-800 tracking-tighter tabular-nums">
                    {unit.targetTemp}°
                  </span>
                  <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    Target
                  </span>
                </div>
              </div>

              <div className="w-full max-w-xs mt-5 sm:mt-6 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>16°C</span>
                  <span>30°C</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={30}
                  value={unit.targetTemp}
                  onChange={(e) =>
                    handleTempChange(parseInt(e.target.value, 10))
                  }
                  disabled={!canAttemptControl}
                  className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                    !canControl ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">
                  <Thermometer className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Room
                  </p>
                  <p className="text-sm font-black text-slate-800 tabular-nums">
                    {unit.currentTemp}°C
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">
                  <Gauge className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Today
                  </p>
                  <p className="text-sm font-black text-slate-800 tabular-nums truncate">
                    {unit.hasEnergySensor !== false
                      ? `${(todayKwh ?? 0).toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                        })} kWh`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[320px] sm:min-h-[380px] xl:min-h-0 overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Energy
              </p>
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Consumption
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                {loadingEnergy
                  ? 'Loading…'
                  : energyError
                    ? energyError
                    : `${periodTotalKwh.toLocaleString(undefined, {
                        maximumFractionDigits: 3,
                      })} kWh this period`}
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[260px] sm:min-h-[300px] px-2 sm:px-4 pb-4 sm:pb-5">
            <EnergyChart
              data={energyData}
              view={chartView}
              onViewChange={setChartView}
            />
          </div>
        </div>
      </section>

      {/* Events — same add modal as Device Management */}
      <section className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Schedules
            </p>
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              Events ({events.length})
            </h3>
          </div>
          {canControlEvents && (
            <button
              type="button"
              onClick={() => {
                setEventActionError('');
                setShowAddEventModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          )}
        </div>

        {eventActionError && (
          <p className="text-[10px] text-red-600 font-semibold mb-3">
            {eventActionError}
          </p>
        )}

        {eventsLoading ? (
          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            No events scheduled
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-colors ${
                  event.enabled
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-100 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      event.enabled
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-sm truncate">
                        {event.name || 'Event'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        {event.action}
                        {event.targetTemp ? ` ${event.targetTemp}°C` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold tabular-nums truncate">
                      {formatTime12h(event.time)}
                      {event.endTime ? ` — ${formatTime12h(event.endTime)}` : ''}
                      {' · '}
                      {event.isRecurring
                        ? (event.days || []).join(', ') || 'Recurring'
                        : 'One-time'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label
                    className={`relative inline-flex items-center ${
                      canControlEvents
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={event.enabled}
                      onChange={() =>
                        canControlEvents && void handleToggleEvent(event.id)
                      }
                      disabled={!canControlEvents}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                  </label>
                  {canControlEvents && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteEvent(event.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Event modal — same fields as Device Management */}
      <Modal
        isOpen={showAddEventModal}
        onClose={closeAddEventModal}
        title="Add Device Event"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Morning Start"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Device
            </label>
            <div className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-semibold text-slate-800">
              {unit.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Event Type
            </label>
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setEventOnOffAction('ON')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  eventOnOffAction === 'ON'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => {
                  setEventOnOffAction('OFF');
                  setEventRemote('lock');
                }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  eventOnOffAction === 'OFF'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Off
              </button>
            </div>
          </div>

          {eventOnOffAction === 'ON' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Temperature (°C)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="16"
                  max="30"
                  value={eventTemp}
                  onChange={(e) => setEventTemp(e.target.value)}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-800 w-10 tabular-nums">
                  {eventTemp}°
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Days{' '}
              <span className="text-slate-400 font-normal">
                (optional — empty = one-time)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    setEventDays((prev) =>
                      prev.includes(day.value)
                        ? prev.filter((d) => d !== day.value)
                        : [...prev, day.value]
                    );
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    eventDays.includes(day.value)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title={day.label}
                >
                  {day.value}
                </button>
              ))}
            </div>
            {eventDays.length === 0 && (
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                One-time: runs once at the next start/end, then is deleted.
              </p>
            )}
          </div>

          {eventOnOffAction === 'ON' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Remote Lock
              </label>
              <CustomDropdown
                value={eventRemote}
                onChange={(v) => setEventRemote(v as 'lock' | 'unlock')}
                options={[
                  { value: 'unlock', label: 'Unlock' },
                  { value: 'lock', label: 'Lock' },
                ]}
                placement="up"
              />
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Off events always use <span className="font-bold">remote lock</span>.
                No one can change the AC with the physical remote while this event is
                active.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={closeAddEventModal}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleAddEvent()}
              disabled={
                savingEvent ||
                !eventName.trim() ||
                !eventTime ||
                !eventEndTime
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingEvent ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </div>
      </Modal>

      <EventOverrideModal
        pending={eventOverridePending}
        onClose={() => setEventOverridePending(null)}
      />
    </div>
  );
}
