import React from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import { EnergyChart } from '../../components/reports/EnergyChart';
import {
  Activity,
  Download,
  AlertTriangle,
  Zap,
  Filter,
  Building2,
  Plus,
  MonitorSmartphone,
  Clock,
  ChevronDown,
  MapPin,
  Check,
} from 'lucide-react';
import { CustomDropdown } from '../../components/ui/CustomDropdown';

/** Manager overview page — markup/CSS preserved from legacy ManagerView */
export function OverviewPage() {
  const {
    units, users, orgs, venues,
    onTabChange, onSelectUnit, onTogglePower,
    onAddUser, onAddOrg, onAddVenue, onAddDevice,
    onDeleteUser, onUpdateUser, onDeleteOrg, onUpdateOrg,
    onDeleteVenue, onUpdateVenue, onDeleteDevice, onUpdateDevice,
    showAddUser, setShowAddUser, addUserStep, setAddUserStep,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserPermission, setNewUserPermission, newUserOrgs, setNewUserOrgs, newUserVenues, setNewUserVenues,
    showAddOrg, setShowAddOrg, newOrgName, setNewOrgName,
    newOrgAddress, setNewOrgAddress,
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
  } = useManagerWorkspace();

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/15 custom-scrollbar flex flex-col min-h-0">
                
                {/* Dashboard Header Panel */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] block mb-1">Campus Command Hub</span>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-blue-600 shrink-0" />
                      SSUET Central Overview
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Real-time centralized telemetry, environmental monitoring, and climate automation metrics</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <button
                      onClick={() => setShowAddUser(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Operator
                    </button>
                    <button
                      onClick={() => setShowAddDevice(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add AC Unit
                    </button>
                  </div>
                </div>
      
                {/* Core Telemetry Stats Cards (Ribbon Layout) - Streamlined to 4 vital indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Stat 1: Active AC Units Ratio */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <MonitorSmartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Climate Zones</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {units.filter(u => u.isOn).length} <span className="text-xs font-bold text-slate-400">/ {units.length} ON</span>
                      </p>
                    </div>
                  </div>
      
                  {/* Stat 2: Live Drawing Power */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Power Demand</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {(units.filter(u => u.isOn).length * 1.5).toFixed(1)} <span className="text-xs font-bold text-slate-400">kW</span>
                      </p>
                    </div>
                  </div>
      
                  {/* Stat 3: Average Room Temp */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mean Room Temp</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {units.filter(u => u.isOn).length > 0 
                          ? (units.filter(u => u.isOn).reduce((acc, u) => acc + u.currentTemp, 0) / units.filter(u => u.isOn).length).toFixed(1)
                          : '24.0'}°C
                      </p>
                    </div>
                  </div>
      
                  {/* Stat 4: Active Alerts / Faults */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all group">
                    <div { ...{ className: `p-3 rounded-xl transition-transform ${units.some(u => u.hasFault) ? 'bg-red-50 text-red-600 animate-bounce' : 'bg-emerald-50 text-emerald-600'}` } }>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grid Diagnostics</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        {units.filter(u => u.hasFault).length > 0 ? (
                          <span className="text-red-600">{units.filter(u => u.hasFault).length} Faulty</span>
                        ) : (
                          <span className="text-emerald-600">100% Healthy</span>
                        )}
                      </p>
                    </div>
                  </div>
      
                </div>
      
                {/* Primary Operations Dashboard Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (8-span) */}
                  <div className="xl:col-span-8 space-y-6">
                    
                    {/* Streamlined Campus Energy Analytics */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                              <Activity className="w-4 h-4" />
                            </div>
                            Campus Energy Consumption Analytics
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">Monitored electrical load across individual department infrastructures</p>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:flex-none">
                            <select
                              value={selectedEnergyId}
                              onChange={(e) => {
                                setSelectedEnergyId(e.target.value);
                                setEnergyFilterType(e.target.value === 'all' ? 'org' : 'venue');
                              }}
                              className="w-full sm:w-48 py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 appearance-none transition-all cursor-pointer text-slate-700 hover:bg-slate-100"
                            >
                              <option value="all">Entire Campus (All Rooms)</option>
                              {venues.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          </div>
      
                          <button
                            onClick={handleDownloadReport}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            CSV
                          </button>
                        </div>
                      </div>
      
                      <div className="h-[260px] w-full">
                        <EnergyChart 
                          data={aggregatedEnergyData} 
                          view={energyView}
                          onViewChange={setEnergyView}
                        />
                      </div>
                    </div>
      
                    {/* Central SSUET Climate Zones Table */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                              <MapPin className="w-4 h-4" />
                            </div>
                            Live Venue Performance Breakdown
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active rooms & department telemetries</p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl">
                          {venues.length} Zones Active
                        </span>
                      </div>
      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider text-left">
                              <th className="py-2.5">Venue Location</th>
                              <th className="py-2.5">Operating Ratio</th>
                              <th className="py-2.5">Mean Temp</th>
                              <th className="py-2.5">Health Status</th>
                              <th className="py-2.5 text-right">Quick Power Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {venues.map(v => {
                              const venueUnits = units.filter(u => u.venueId === v.id);
                              const activeCount = venueUnits.filter(u => u.isOn).length;
                              const hasFault = venueUnits.some(u => u.hasFault);
                              const meanTempVal = activeCount > 0 
                                ? (venueUnits.filter(u => u.isOn).reduce((acc, u) => acc + u.currentTemp, 0) / activeCount).toFixed(1) + '°C'
                                : '--';
                              const isAllOn = venueUnits.length > 0 && venueUnits.every(u => u.isOn);
      
                              return (
                                <tr key={v.id} className="hover:bg-slate-50/50 transition-all text-xs font-bold text-slate-700">
                                  <td className="py-3 font-black text-slate-900">{v.name}</td>
                                  <td className="py-3 text-slate-500">
                                    <span className="text-slate-800">{activeCount}</span> / {venueUnits.length} Devices
                                  </td>
                                  <td className="py-3 font-black text-blue-600">{meanTempVal}</td>
                                  <td className="py-3">
                                    {hasFault ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                                        <AlertTriangle className="w-3 h-3 animate-pulse" />
                                        Needs Maintenance
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                        <Check className="w-3 h-3" />
                                        Optimal
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          venueUnits.forEach(u => {
                                            if (onUpdateDevice) onUpdateDevice(u.id, { isOn: true });
                                          });
                                        }}
                                        disabled={isAllOn}
                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] uppercase font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                      >
                                        All ON
                                      </button>
                                      <button
                                        onClick={() => {
                                          venueUnits.forEach(u => {
                                            if (onUpdateDevice) onUpdateDevice(u.id, { isOn: false });
                                          });
                                        }}
                                        disabled={activeCount === 0}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] uppercase font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                      >
                                        All OFF
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
      
                  </div>
      
                  {/* Right Column (4-span) - Unified Smart Campus Climate Co-Pilot widget */}
                  <div className="xl:col-span-4 space-y-6">
                    
                    <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white p-6 rounded-3xl space-y-6 shadow-md border border-slate-800">
                      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Smart Climate Co-Pilot</span>
                        </div>
                        <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">SSUET AI</span>
                      </div>
      
                      {(() => {
                        const coldOnUnits = units.filter(u => u.isOn && u.targetTemp < 24);
                        const isAnyCold = coldOnUnits.length > 0;
                        const faultySensorUnits = faultyDevices;
                        const hasAnyAlert = isAnyCold || faultySensorUnits.length > 0;
      
                        if (!hasAnyAlert) {
                          return (
                            <div className="text-center py-6 flex flex-col items-center justify-center space-y-3">
                              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                <Check className="w-8 h-8" />
                              </div>
                              <h4 className="text-sm font-black text-white">Climate Grid Optimized</h4>
                              <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                                All SSUET campus AC units are active within energy-efficient levels (≥24°C) and all hardware checks are 100% operational.
                              </p>
                            </div>
                          );
                        }
      
                        return (
                          <div className="space-y-5">
                            {/* Section 1: Temperature Eco Optimization */}
                            {isAnyCold && (
                              <div className="space-y-3">
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  <span className="text-amber-400 font-extrabold">{coldOnUnits.length} SSUET zones</span> are set cooling below the recommended eco-efficient threshold (<span className="text-white font-bold">24°C</span>).
                                </p>
                                <button
                                  onClick={() => {
                                    units.forEach(u => {
                                      if (u.isOn && u.targetTemp < 24 && onUpdateDevice) {
                                        onUpdateDevice(u.id, { targetTemp: 24 });
                                      }
                                    });
                                  }}
                                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center shadow-lg shadow-blue-900/30"
                                >
                                  Set All to Eco-Temp (24°C)
                                </button>
                              </div>
                            )}
      
                            {/* Section 2: Sensor Health & Quick Fix */}
                            {faultySensorUnits.length > 0 && (
                              <div className={`space-y-3 ${isAnyCold ? 'pt-4 border-t border-slate-800' : ''}`}>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  We detected <span className="text-red-400 font-extrabold">{faultySensorUnits.length} units</span> with sensor connectivity or ventilation faults.
                                </p>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                                  {faultySensorUnits.map(device => (
                                    <div key={device.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-all">
                                      <div className="truncate max-w-[120px]">
                                        <p className="font-extrabold text-slate-200 truncate">{device.name}</p>
                                        <p className="text-[9px] text-slate-500 mt-0.5 truncate">{device.venueName || 'AC Unit'}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => onSelectUnit(device.id)}
                                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black uppercase rounded"
                                        >
                                          Diagnose
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (onUpdateDevice) {
                                              onUpdateDevice(device.id, { hasFault: false });
                                            }
                                          }}
                                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase rounded"
                                        >
                                          Calibrate
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
      
                  </div>
      
                </div>
              </div>
    </>
  );
}
