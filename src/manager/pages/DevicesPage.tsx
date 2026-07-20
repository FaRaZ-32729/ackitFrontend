import React from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import {
  MonitorSmartphone,
  Plus,
  Edit,
  Trash2,
  Search,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { getACPowerDraw } from '../../types';

/** Manager devices page — markup/CSS preserved from legacy ManagerView */
export function DevicesPage() {
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
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-5 bg-slate-50/15 overflow-hidden select-none">
                {/* Header row */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 shrink-0 mb-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
                    <MonitorSmartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span className="truncate">Device Management</span>
                  </h3>
                  
                  <div className="flex items-center gap-2 w-full lg:w-auto min-w-0 flex-wrap lg:flex-nowrap">
                    <div className="relative flex-1 min-w-0 lg:w-44">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="search"
                        value={deviceSearchQuery}
                        onChange={(e) => setDeviceSearchQuery(e.target.value)}
                        placeholder="Search devices…"
                        className="w-full min-w-0 pl-8 pr-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0 lg:w-40">
                      <CustomDropdown
                        icon={Filter}
                        value={selectedDeviceVenueId}
                        onChange={setSelectedDeviceVenueId}
                        options={[
                          { value: 'all', label: 'All Venues' },
                          ...venues.map((v) => ({ value: v.id, label: v.name })),
                        ]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddDevice(true)}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-sm shadow-blue-600/15 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden sm:inline">Add Device</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
      
                {/* Devices table card */}
                <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
                    {filteredManagedDevices.length === 0 ? (
                      <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <MonitorSmartphone className="w-12 h-12 text-slate-300 mb-3" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Devices Found</span>
                        <p className="text-xs text-slate-400 max-w-[200px]">No hardware devices matched your current search or filter</p>
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
                          {filteredManagedDevices.map((unit) => {
                            const isExpanded = expandedDeviceId === unit.id;
                            const associatedVenue = venues.find(v => v.id === unit.venueId);
                            const currentInputVal = deviceTempInputs[unit.id] ?? unit.targetTemp.toString();
                            const displayName = unit.name.length > 6 ? `${unit.name.slice(0, 6)}...` : unit.name;
      
                            const lockValue =
                              unit.isLocked && unit.eventLocked
                                ? 'Super Locked'
                                : unit.isLocked
                                  ? 'Locked'
                                  : 'Unlocked';
      
                            const applyTemp = (next: number) => {
                              const clamped = Math.max(16, Math.min(30, next));
                              setDeviceTempInputs(prev => ({ ...prev, [unit.id]: clamped.toString() }));
                              onUpdateDevice(unit.id, { targetTemp: clamped });
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
                                    <span className="block truncate text-slate-500 font-semibold" title={associatedVenue?.name || ''}>
                                      {associatedVenue?.name || '—'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-0.5 hidden sm:table-cell">
                                    <div className="flex justify-center">
                                      <div className={`flex items-center bg-slate-50 border border-slate-200 rounded-full p-0.5 ${!unit.isOn ? 'opacity-40 grayscale' : ''}`}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!unit.isOn) return;
                                            const currentVal = parseInt(currentInputVal) || unit.targetTemp;
                                            applyTemp(currentVal - 1);
                                          }}
                                          disabled={!unit.isOn}
                                          className={`w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded-full font-black text-xs ${!unit.isOn ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="16"
                                          max="30"
                                          value={currentInputVal}
                                          disabled={!unit.isOn}
                                          onChange={(e) => {
                                            let rawVal = e.target.value;
                                            if (rawVal !== '') {
                                              const val = parseInt(rawVal);
                                              if (!isNaN(val)) {
                                                if (val > 30) rawVal = '30';
                                                else if (val < 16 && rawVal.length >= 2) rawVal = '16';
                                              }
                                            }
                                            setDeviceTempInputs(prev => ({ ...prev, [unit.id]: rawVal }));
                                          }}
                                          onBlur={() => {
                                            if (!unit.isOn) return;
                                            let val = parseInt(currentInputVal);
                                            if (isNaN(val) || val < 16) val = 16;
                                            if (val > 30) val = 30;
                                            applyTemp(val);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && unit.isOn) {
                                              let val = parseInt(currentInputVal);
                                              if (isNaN(val) || val < 16) val = 16;
                                              if (val > 30) val = 30;
                                              applyTemp(val);
                                            }
                                          }}
                                          className={`w-8 text-center font-black text-xs text-slate-800 bg-transparent outline-none no-spin ${!unit.isOn ? 'cursor-not-allowed' : ''}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!unit.isOn) return;
                                            const currentVal = parseInt(currentInputVal) || unit.targetTemp;
                                            applyTemp(currentVal + 1);
                                          }}
                                          disabled={!unit.isOn}
                                          className={`w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white rounded-full font-black text-xs ${!unit.isOn ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
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
                                        onClick={() => onTogglePower(unit.id)}
                                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${unit.isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                      >
                                        <span className={`absolute text-[8px] font-black text-white ${unit.isOn ? 'left-1.5' : 'right-1.5'}`}>
                                          {unit.isOn ? 'ON' : 'OFF'}
                                        </span>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${unit.isOn ? 'translate-x-7' : 'translate-x-1'}`} />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 hidden md:table-cell">
                                    <div className="flex flex-col items-center min-w-0">
                                      <div className="flex items-center gap-0.5 text-[11px] font-black text-slate-800">
                                        <Zap className="w-3 h-3 text-blue-500 fill-blue-500 shrink-0" />
                                        {unit.hasEnergySensor !== false ? (
                                          <span className="tabular-nums">{getACPowerDraw(unit).power}</span>
                                        ) : (
                                          <span className="text-slate-400 font-semibold italic text-[9px]">Off</span>
                                        )}
                                      </div>
                                      {unit.hasEnergySensor !== false && (
                                        <span className="text-[9px] font-bold text-slate-400 truncate max-w-full">
                                          {getACPowerDraw(unit).energyToday} today
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-0.5 hidden sm:table-cell">
                                    <div className="min-w-0 max-w-[8.5rem] mx-auto">
                                      <CustomDropdown
                                        value={lockValue}
                                        disabled={!unit.isOn}
                                        placement="down"
                                        onChange={(v) => {
                                          if (v === 'Unlocked') {
                                            onUpdateDevice(unit.id, { isLocked: false, eventLocked: false });
                                          } else if (v === 'Locked') {
                                            onUpdateDevice(unit.id, { isLocked: true, eventLocked: false });
                                          } else if (v === 'Super Locked') {
                                            onUpdateDevice(unit.id, { isLocked: true, eventLocked: true });
                                          }
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
                                      <button type="button" onClick={() => setEditingDevice(unit)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit Device">
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" onClick={() => { setDeletingId(unit.id); setDeleteType('device'); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete Device">
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
                                                      onUpdateDevice(unit.id, {
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
