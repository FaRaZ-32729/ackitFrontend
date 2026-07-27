import React, { useMemo, useState } from 'react';
import { ACUnit, Role, ACEvent, getACPowerDraw } from '../../types';
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
} from 'lucide-react';
import { EnergyChart } from '../reports/EnergyChart';
import { EventScheduler } from './EventScheduler';
import { CustomDropdown } from '../ui/CustomDropdown';

interface ACDetailProps {
  unit: ACUnit;
  role: Role;
  onBack: () => void;
  onTogglePower: (id: string) => void;
  onSetTemp: (id: string, temp: number) => void;
  onSetRemote: (
    id: string,
    remote: 'unlock' | 'lock' | 'superlock'
  ) => void | Promise<void>;
  onAddEvent: (id: string, event: Omit<ACEvent, 'id'>) => void;
  onDeleteEvent: (unitId: string, eventId: string) => void;
  onToggleEvent: (unitId: string, eventId: string) => void;
}

type ChartView = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type RemoteLabel = 'Unlocked' | 'Locked' | 'Super Locked';

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

export function ACDetail({
  unit,
  role,
  onBack,
  onTogglePower,
  onSetTemp,
  onSetRemote,
  onAddEvent,
  onDeleteEvent,
  onToggleEvent,
}: ACDetailProps) {
  const isManager = role === 'manager' || role === 'admin';
  const canControl = !unit.isLocked || isManager;
  const canControlEvents = !unit.eventLocked || isManager;
  const [chartView, setChartView] = useState<ChartView>('daily');
  const [remotePending, setRemotePending] = useState(false);

  const powerInfo = useMemo(() => getACPowerDraw(unit), [unit]);
  const liveKw =
    unit.powerConsumption != null && Number.isFinite(Number(unit.powerConsumption))
      ? Number(unit.powerConsumption)
      : powerInfo.power;
  const isOnline = unit.status !== 'offline';
  const dialProgress = Math.max(0, Math.min(1, (unit.targetTemp - 16) / 14));
  const circumference = 2 * Math.PI * 88;
  const remoteValue = remoteFromUnit(unit);

  const handleRemoteChange = async (label: string) => {
    if (
      label !== 'Unlocked' &&
      label !== 'Locked' &&
      label !== 'Super Locked'
    ) {
      return;
    }
    setRemotePending(true);
    try {
      await onSetRemote(unit.id, labelToRemote(label));
    } finally {
      setRemotePending(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 md:gap-6 pb-6">
      {/* Header */}
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
              {[unit.brand, unit.capacityTon?.replace(/ton/i, ' Ton')].filter(Boolean).join(' · ') ||
                'AC unit'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end w-full sm:w-auto">
          <div className="w-full sm:w-[200px]">
            <CustomDropdown
              value={remoteValue}
              onChange={(v) => void handleRemoteChange(v)}
              disabled={remotePending || (!isManager && unit.eventLocked)}
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

      {/* Quick stats */}
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

      {/* Main: controls + chart */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 md:gap-6 items-stretch">
        {/* Climate control */}
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
              </div>
              <button
                type="button"
                onClick={() => canControl && onTogglePower(unit.id)}
                disabled={!canControl}
                className={`p-3.5 rounded-2xl transition-all shrink-0 ${
                  unit.isOn
                    ? 'bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                    : 'bg-slate-100 text-slate-400'
                } ${!canControl ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
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
                    canControl && onSetTemp(unit.id, parseInt(e.target.value, 10))
                  }
                  disabled={!canControl}
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
                      ? `${powerInfo.energyToday} kWh`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Energy chart */}
        <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[320px] sm:min-h-[380px] xl:min-h-0 overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Energy
              </p>
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Consumption
              </h2>
            </div>
          </div>
          <div className="flex-1 min-h-[260px] sm:min-h-[300px] px-2 sm:px-4 pb-4 sm:pb-5">
            <EnergyChart
              data={unit.energyConsumption}
              view={chartView}
              onViewChange={setChartView}
            />
          </div>
        </div>
      </section>

      {/* Events — full width */}
      <section className="w-full">
        <EventScheduler
          events={unit.events || []}
          role={role}
          canControlEvents={canControlEvents}
          onAddEvent={(event) => onAddEvent(unit.id, event)}
          onDeleteEvent={(eventId) => onDeleteEvent(unit.id, eventId)}
          onToggleEvent={(eventId) => onToggleEvent(unit.id, eventId)}
        />
      </section>
    </div>
  );
}
