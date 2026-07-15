import React from 'react';
import { ACUnit, Role, ACEvent, getACPowerDraw } from '../types';
import { Power, Thermometer, Lock, Unlock, ArrowLeft, Settings2, AlertTriangle, Zap, Cpu } from 'lucide-react';
import { EnergyChart } from './EnergyChart';
import { EventScheduler } from './EventScheduler';

interface ACDetailProps {
  unit: ACUnit;
  role: Role;
  onBack: () => void;
  onTogglePower: (id: string) => void;
  onSetTemp: (id: string, temp: number) => void;
  onToggleLock: (id: string) => void;
  onToggleEventLock: (id: string) => void;
  onAddEvent: (id: string, event: Omit<ACEvent, 'id'>) => void;
  onDeleteEvent: (unitId: string, eventId: string) => void;
  onToggleEvent: (unitId: string, eventId: string) => void;
}

export function ACDetail({
  unit,
  role,
  onBack,
  onTogglePower,
  onSetTemp,
  onToggleLock,
  onToggleEventLock,
  onAddEvent,
  onDeleteEvent,
  onToggleEvent,
}: ACDetailProps) {
  const isManager = role === 'manager';
  const canControl = !unit.isLocked || isManager;
  const canControlEvents = !unit.eventLocked || isManager;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 md:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{unit.name}</h2>
          {unit.hasFault && (
            <span className="text-[10px] md:text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-200 shrink-0" title="Fault Detected - Control Active">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Fault Active (Fully Functional)
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {unit.isLocked && !canControl && (
            <span className="text-[10px] md:text-xs font-medium bg-amber-100 text-amber-800 px-2 md:px-3 py-1 rounded-full flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
          {canControlEvents && (
            <button
              onClick={() => onToggleEventLock(unit.id)}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-colors ${
                unit.eventLocked
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {unit.eventLocked ? <Lock className="w-3.5 md:w-4 h-3.5 md:h-4" /> : <Unlock className="w-3.5 md:w-4 h-3.5 md:h-4" />}
              <span className="hidden xs:inline">{unit.eventLocked ? 'Events Locked' : 'Events Unlocked'}</span>
              <span className="xs:hidden">{unit.eventLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          )}
          {canControl && (
            <button
              onClick={() => onToggleLock(unit.id)}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-colors ${
                unit.isLocked
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {unit.isLocked ? <Lock className="w-3.5 md:w-4 h-3.5 md:h-4" /> : <Unlock className="w-3.5 md:w-4 h-3.5 md:h-4" />}
              <span className="hidden xs:inline">{unit.isLocked ? 'Remote Locked' : 'Unlocked'}</span>
              <span className="xs:hidden">{unit.isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 w-full h-2 ${
              unit.isOn ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          />
          
          <div className="w-full flex justify-between items-start mb-8">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500 mb-1">Status</p>
              <p className={`text-lg font-bold ${unit.isOn ? 'text-emerald-600' : 'text-slate-600'}`}>
                {unit.isOn ? 'Running' : 'Standby'}
              </p>
            </div>
            <button
              onClick={() => canControl && onTogglePower(unit.id)}
              disabled={!canControl}
              className={`p-4 rounded-full transition-all ${
                unit.isOn
                  ? 'bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-100 text-slate-400'
              } ${!canControl ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <Power className="w-8 h-8" />
            </button>
          </div>

          <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
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
                strokeDasharray="553"
                strokeDashoffset={553 - (553 * ((unit.targetTemp - 16) / 14))}
                className="transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-light text-slate-800 tracking-tighter">
                {unit.targetTemp}Â°
              </span>
              <span className="text-sm font-medium text-slate-400 mt-1">Target</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="flex items-center justify-between text-sm font-medium text-slate-500 px-2">
              <span>16Â°C</span>
              <span>30Â°C</span>
            </div>
            <input
              type="range"
              min="16"
              max="30"
              value={unit.targetTemp}
              onChange={(e) => canControl && onSetTemp(unit.id, parseInt(e.target.value))}
              disabled={!canControl}
              className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${
                !canControl ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            {/* Room Temperature */}
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Thermometer className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Room</p>
                <p className="text-sm font-black text-slate-800">{unit.currentTemp}°C</p>
              </div>
            </div>

            {/* AC Specs */}
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Cpu className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Specs</p>
                <p className="text-xs font-black text-slate-800 truncate" title={`${unit.brand || 'Daikin'} (${unit.capacityTon || '1.5ton'})`}>
                  {unit.brand || 'Daikin'} • {unit.capacityTon ? unit.capacityTon.replace('ton', ' Ton') : '1.5 Ton'}
                </p>
              </div>
            </div>

            {/* Live Power Draw */}
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live Power Draw</p>
                  {unit.hasEnergySensor === false && (
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">OFFLINE</span>
                  )}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-0.5">
                  <p className="text-sm font-black text-slate-800">
                    {unit.hasEnergySensor !== false ? `${getACPowerDraw(unit).power} kW` : 'Sensor Disabled'}
                  </p>
                  {unit.hasEnergySensor !== false && (
                    <span className="text-[10px] font-bold text-slate-400">
                      (Today: {getACPowerDraw(unit).energyToday} kWh)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Events */}
        <div className="lg:col-span-2 space-y-6">
          <EnergyChart data={unit.energyConsumption} />
          <EventScheduler
            events={unit.events}
            role={role}
            canControlEvents={canControlEvents}
            onAddEvent={(event) => onAddEvent(unit.id, event)}
            onDeleteEvent={(eventId) => onDeleteEvent(unit.id, eventId)}
            onToggleEvent={(eventId) => onToggleEvent(unit.id, eventId)}
          />
        </div>
      </div>
    </div>
  );
}
