import React from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import { MapPin, Plus, Edit, Trash2, Search, Building2, MonitorSmartphone, Filter } from 'lucide-react';
import { CustomDropdown } from '../../components/ui/CustomDropdown';

/** Manager venues page — markup/CSS preserved from legacy ManagerView */
export function VenuesPage() {
  const {
    units, users, orgs, venues,
    onTabChange, onSelectUnit, onTogglePower,
    onAddUser, onAddOrg, onAddVenue, onAddDevice,
    onDeleteUser, onUpdateUser, onDeleteOrg, onUpdateOrg,
    onDeleteVenue, onUpdateVenue, onDeleteDevice, onUpdateDevice,
    showAddUser, setShowAddUser, addUserStep, setAddUserStep,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserStatus, setNewUserStatus, newUserVenues, setNewUserVenues,
    showAddOrg, setShowAddOrg, newOrgName, setNewOrgName,
    newOrgAddress, setNewOrgAddress, newOrgDescription, setNewOrgDescription,
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
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 bg-slate-50/15 overflow-hidden select-none">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-4 md:mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span className="truncate">Venue Management</span>
                  </h3>
      
                  <div className="flex items-center gap-2 w-full min-w-0 sm:max-w-xl shrink-0 lg:hidden">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/80 pointer-events-none" />
                      <input
                        type="search"
                        value={venueSearchQuery}
                        onChange={(e) => setVenueSearchQuery(e.target.value)}
                        placeholder="Search venues…"
                        className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white border border-blue-500 rounded-full text-xs sm:text-sm font-black text-slate-800 placeholder:text-slate-400 placeholder:font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CustomDropdown
                        icon={Filter}
                        value={selectedVenueOrgId}
                        onChange={setSelectedVenueOrgId}
                        options={[
                          { value: 'all', label: 'All Organizations' },
                          ...orgs.map((o) => ({ value: o.id, label: o.name })),
                        ]}
                      />
                    </div>
                  </div>
                </div>
      
                {/* Large screen: Add Venue (left) + Venue list (right) */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)] gap-4 xl:gap-6 flex-1 min-h-0">
                  <aside className="min-h-0 min-w-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">Add New Venue</h4>
                    </div>
      
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-5 space-y-4">
                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Venue Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newVenueName}
                          onChange={(e) => setNewVenueName(e.target.value)}
                          className="w-full min-w-0 p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. Main Auditorium"
                        />
                      </div>
      
                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Organization <span className="text-red-500">*</span>
                        </label>
                        <CustomDropdown
                          value={newVenueOrgId || orgs[0]?.id || ''}
                          onChange={setNewVenueOrgId}
                          icon={Building2}
                          placeholder="Select organization…"
                          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                        />
                      </div>
                    </div>
      
                    <div className="px-5 py-4 border-t border-slate-100 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const orgId = newVenueOrgId || orgs[0]?.id || '';
                          if (!newVenueName.trim() || !orgId) return;
                          onAddVenue({
                            name: newVenueName.trim(),
                            orgId,
                          });
                          setNewVenueName('');
                          setNewVenueOrgId(orgs[0]?.id || '');
                        }}
                        disabled={!newVenueName.trim() || !(newVenueOrgId || orgs[0]?.id)}
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Venue
                      </button>
                    </div>
                  </aside>
      
                  <section className="min-h-0 min-w-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-black text-slate-900 tracking-tight">All Venues</h4>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                          {filteredManagedVenues.length} shown
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-1 min-w-0">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="search"
                            value={venueSearchQuery}
                            onChange={(e) => setVenueSearchQuery(e.target.value)}
                            placeholder="Search venues…"
                            className="w-full min-w-0 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex-1 min-w-0 max-w-[14rem]">
                          <CustomDropdown
                            icon={Filter}
                            value={selectedVenueOrgId}
                            onChange={setSelectedVenueOrgId}
                            options={[
                              { value: 'all', label: 'All Organizations' },
                              ...orgs.map((o) => ({ value: o.id, label: o.name })),
                            ]}
                          />
                        </div>
                      </div>
                    </div>
      
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
                      {venues.length === 0 ? (
                        <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                          <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Venues Found</span>
                          <p className="text-xs text-slate-400 max-w-[220px]">Use the form on the left to add your first venue</p>
                        </div>
                      ) : filteredManagedVenues.length === 0 ? (
                        <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                          <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Matching Venues</span>
                          <p className="text-xs text-slate-400 max-w-[200px]">No venues matched your current search or filter</p>
                        </div>
                      ) : (
                        <table className="w-full table-fixed border-collapse">
                          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider text-left">
                              <th className="py-3 px-3 xl:px-5 w-[34%]">Name</th>
                              <th className="py-3 px-3 xl:px-5 w-[34%]">Organization</th>
                              <th className="py-3 px-2 xl:px-4 w-[14%] text-center">Devices</th>
                              <th className="py-3 px-3 xl:px-5 w-[18%] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {filteredManagedVenues.map((venue) => {
                              const orgName = orgs.find((o) => o.id === venue.orgId)?.name || '—';
                              const deviceCount = units.filter((u) => u.venueId === venue.id).length;
                              return (
                                <tr key={venue.id} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="py-3 px-3 xl:px-5 align-middle">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4" />
                                      </div>
                                      <span className="font-extrabold text-slate-900 truncate">{venue.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 xl:px-5 align-middle">
                                    <span className="block truncate text-slate-500 font-medium" title={orgName}>
                                      {orgName}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 xl:px-4 text-center align-middle font-black text-emerald-600 tabular-nums">
                                    {deviceCount}
                                  </td>
                                  <td className="py-3 px-3 xl:px-5 text-right align-middle">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingVenue(venue)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                        title="Edit"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeletingId(venue.id);
                                          setDeleteType('venue');
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>
                </div>
      
                {/* Mobile / tablet: list only */}
                <div className="lg:hidden flex-1 min-h-0 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
                    {venues.length === 0 ? (
                      <div className="flex-1 min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Venues Found</span>
                        <p className="text-xs text-slate-400 max-w-[200px]">Create a venue to start mapping devices</p>
                      </div>
                    ) : filteredManagedVenues.length === 0 ? (
                      <div className="flex-1 min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Matching Venues</span>
                        <p className="text-xs text-slate-400 max-w-[200px]">No venues matched your current search or filter</p>
                      </div>
                    ) : (
                      <table className="w-full table-fixed border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                          <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider text-left">
                            <th className="py-3 px-4 w-[55%]">Name</th>
                            <th className="py-3 px-2 w-[20%] text-center">Devices</th>
                            <th className="py-3 px-4 w-[25%] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                          {filteredManagedVenues.map((venue) => {
                            const deviceCount = units.filter((u) => u.venueId === venue.id).length;
                            return (
                              <tr key={venue.id} className="hover:bg-slate-50/30">
                                <td className="py-2.5 px-4 align-middle">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className="font-extrabold text-slate-900 truncate">{venue.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center font-black text-emerald-600 tabular-nums">{deviceCount}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button type="button" onClick={() => setEditingVenue(venue)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeletingId(venue.id);
                                        setDeleteType('venue');
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
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
