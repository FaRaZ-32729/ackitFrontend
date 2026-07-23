import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { MultiSelectDropdown } from '../../components/ui/MultiSelectDropdown';
import { CheckCircle2, AlertTriangle, MapPin, MonitorSmartphone, Activity, Building2, Copy, Check } from 'lucide-react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';

/** Shared manager modals (legacy root-level modals; CSS unchanged) */
export function ManagerModals() {
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
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
    newDeviceCapacity, setNewDeviceCapacity, newDeviceVoltage, setNewDeviceVoltage,
    newDeviceVenues, newDeviceBrands,
    newDeviceError, isAddingDevice, deviceToast, setDeviceToast,
    editDeviceVenues, editDeviceBrands, editDeviceError, isUpdatingDevice,
    isDeletingDevice, deleteError, setDeleteError,
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
    handleAddOrg, handleAddVenue, handleAddDevice, handleUpdateDevice, handleConfirmDelete,
    closeAddEventModal, handleAddEvent,
    toggleVenue, filteredManagedVenues, filteredManagedDevices,
  } = useManagerWorkspace();

  return (
    <>
            {/* Modals placed at root level so they can be opened from any tab */}
            <Modal
              isOpen={!!selectedUserForModal}
              onClose={closeUserDetailModal}
              title={
                activeDetailType === 'venues' ? `Assigned Venues: ${selectedUserForModal?.name}` :
                activeDetailType === 'devices' ? `Accessible Devices: ${selectedUserForModal?.name}` :
                activeDetailType === 'events' ? `Created Events: ${selectedUserForModal?.name}` :
                'Details'
              }
            >
              <div className="max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
                {activeDetailType === 'venues' && selectedUserForModal && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 mb-4">List of venues this user has permission to manage.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {venues.filter(v => selectedUserForModal.assignedVenueIds?.includes(v.id)).map((v) => (
                        <div key={v.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-blue-900">{v.name}</span>
                        </div>
                      ))}
                      {venues.filter(v => selectedUserForModal.assignedVenueIds?.includes(v.id)).length === 0 && (
                        <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-400 italic">No venues assigned to this user.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
      
                {activeDetailType === 'devices' && selectedUserForModal && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 mb-4">Devices available to this user based on assigned venues.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {units.filter(u => selectedUserForModal.assignedVenueIds?.includes(u.venueId)).map((u) => {
                        const venue = venues.find(v => v.id === u.venueId);
                        return (
                          <div key={u.id} className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                                <MonitorSmartphone className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-emerald-900">{u.name}</p>
                                <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">{venue?.name}</p>
                              </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${u.isOn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                          </div>
                        );
                      })}
                      {units.filter(u => selectedUserForModal.assignedVenueIds?.includes(u.venueId)).length === 0 && (
                        <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-400 italic">No devices accessible to this user.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
      
                {activeDetailType === 'events' && selectedUserForModal && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">Scheduled events and automations created for accessible devices.</p>
                    <div className="space-y-3">
                      {units
                        .filter(u => selectedUserForModal.assignedVenueIds?.includes(u.venueId))
                        .flatMap(u => u.events.map(e => ({ ...e, deviceName: u.name })))
                        .map((event, idx) => (
                          <div key={idx} className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm">
                                <Activity className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-purple-900">{event.time}</p>
                                  <span className="text-[10px] px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full font-bold uppercase tracking-wider">{event.action}</span>
                                </div>
                                <p className="text-xs text-purple-600 mt-0.5 font-medium">{event.days.join(', ')} • <span className="font-bold">{event.deviceName}</span></p>
                              </div>
                            </div>
                            {event.targetTemp && (
                              <div className="text-right">
                                <p className="text-xl font-black text-purple-700">{event.targetTemp}°</p>
                                <p className="text-[10px] text-purple-400 uppercase font-bold">Target</p>
                              </div>
                            )}
                          </div>
                        ))}
                      {units.filter(u => selectedUserForModal.assignedVenueIds?.includes(u.venueId)).flatMap(u => u.events).length === 0 && (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-400 italic">No events found for this user.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Modal>
      
            <Modal
              isOpen={showAddUser}
              onClose={closeAddUserModal}
              title={
                addUserStep === 'details' ? "Create New User" :
                "Success"
              }
            >
              <div className="space-y-4">
                {addUserStep === 'details' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter user's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Organizations <span className="text-red-500">*</span></label>
                      <MultiSelectDropdown
                        values={newUserOrgs}
                        onChange={(ids) => {
                          setNewUserOrgs(ids);
                          setNewUserVenues((prev) =>
                            prev.filter((venueId) => {
                              const venue = venues.find((v) => v.id === venueId);
                              return venue ? ids.includes(venue.orgId) : false;
                            })
                          );
                        }}
                        icon={Building2}
                        placeholder="Select organizations…"
                        options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Permission</label>
                      <CustomDropdown
                        value={newUserPermission}
                        onChange={(v) => setNewUserPermission(v as 'view' | 'manage')}
                        options={[
                          { value: 'view', label: 'View' },
                          { value: 'manage', label: 'Manage' },
                        ]}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Assign Venues</label>
                      <MultiSelectDropdown
                        values={newUserVenues}
                        onChange={setNewUserVenues}
                        icon={MapPin}
                        placeholder={newUserOrgs.length === 0 ? 'Select organizations first…' : 'Select venues…'}
                        options={venues
                          .filter((v) => newUserOrgs.includes(v.orgId))
                          .map((v) => ({ value: v.id, label: v.name }))}
                        disabled={newUserOrgs.length === 0}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                      <button
                        onClick={closeAddUserModal}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          void (async () => {
                            try {
                              await handleAddUser();
                            } catch {
                              // Keep modal open so user can retry
                            }
                          })();
                        }}
                        disabled={!newUserName || !newUserEmail || newUserOrgs.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create
                      </button>
                    </div>
                  </>
                )}
      
                {addUserStep === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Invite Sent!</h3>
                    <p className="text-slate-500">A verification OTP has been sent to the user's email. After verifying OTP, they can set a password and join.</p>
                  </div>
                )}
              </div>
            </Modal>
            
            <Modal
              isOpen={showAddOrg}
              onClose={() => setShowAddOrg(false)}
              title="Add Organization"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    value={newOrgAddress}
                    onChange={(e) => setNewOrgAddress(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="123 Business St, City"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddOrg(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOrg}
                    disabled={!newOrgName}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Save Organization
                  </button>
                </div>
              </div>
            </Modal>
      
            <Modal
              isOpen={showAddVenue}
              onClose={() => setShowAddVenue(false)}
              title="Add Venue"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name</label>
                  <input
                    type="text"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Main Office"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                  <select
                    value={newVenueOrgId}
                    onChange={(e) => setNewVenueOrgId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddVenue(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      void (async () => {
                        try {
                          await handleAddVenue();
                        } catch {
                          // Keep modal open so user can retry
                        }
                      })();
                    }}
                    disabled={!newVenueName.trim() || !newVenueOrgId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Save Venue
                  </button>
                </div>
              </div>
            </Modal>
      
            <Modal
              isOpen={showAddDevice}
              onClose={() => setShowAddDevice(false)}
              title="Add Device"
            >
              <div className="space-y-4">
                {newDeviceError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold">
                    {newDeviceError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Device Name</label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
                    placeholder="e.g. SSUET Seminar Hall AC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Select Organization</label>
                  <CustomDropdown
                    value={newDeviceOrgId}
                    onChange={setNewDeviceOrgId}
                    icon={Building2}
                    placeholder="Select organization"
                    options={orgs.map((org) => ({
                      value: org.id,
                      label: org.name,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Select Venue</label>
                  <CustomDropdown
                    value={newDeviceVenueId}
                    onChange={setNewDeviceVenueId}
                    icon={MapPin}
                    placeholder="No venues available"
                    options={
                      newDeviceVenues.length > 0
                        ? newDeviceVenues.map((venue) => ({
                            value: venue.id,
                            label: venue.name,
                          }))
                        : [{ value: '', label: 'No venues available', disabled: true }]
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Brand</label>
                  <CustomDropdown
                    value={newDeviceBrand}
                    onChange={setNewDeviceBrand}
                    icon={MonitorSmartphone}
                    placeholder="No brands available"
                    options={
                      newDeviceBrands.length > 0
                        ? newDeviceBrands.map((brand) => ({
                            value: brand.id,
                            label: brand.name,
                          }))
                        : [{ value: '', label: 'No brands available', disabled: true }]
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Capacity</label>
                  <CustomDropdown
                    value={newDeviceCapacity}
                    onChange={setNewDeviceCapacity}
                    icon={Activity}
                    options={[
                      { value: '1', label: '1.0 Ton' },
                      { value: '1.5', label: '1.5 Ton' },
                      { value: '2', label: '2.0 Ton' },
                      { value: '2.5', label: '2.5 Ton' },
                      { value: '3', label: '3.0 Ton' },
                      { value: '3.5', label: '3.5 Ton' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                    Line Voltage (V)
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={400}
                    step={1}
                    value={newDeviceVoltage}
                    onChange={(e) => setNewDeviceVoltage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
                    placeholder="230"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Used with live current to compute power. Default 230 V.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddDevice(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddDevice}
                    disabled={
                      isAddingDevice ||
                      !newDeviceName.trim() ||
                      !newDeviceOrgId ||
                      !newDeviceVenueId ||
                      !newDeviceBrand
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isAddingDevice ? 'Saving…' : 'Save Device'}
                  </button>
                </div>
              </div>
            </Modal>
      
            {/* Edit User Modal */}
            <Modal
              isOpen={!!editingUser}
              onClose={() => setEditingUser(null)}
              title="Edit User"
            >
              {editingUser && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      disabled
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 outline-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Organizations <span className="text-red-500">*</span></label>
                    <MultiSelectDropdown
                      values={editingUser.organizationIds || []}
                      onChange={(ids) =>
                        setEditingUser({
                          ...editingUser,
                          organizationIds: ids,
                          assignedVenueIds: (editingUser.assignedVenueIds || []).filter((venueId) => {
                            const venue = venues.find((v) => v.id === venueId);
                            return venue ? ids.includes(venue.orgId) : false;
                          }),
                        })
                      }
                      icon={Building2}
                      placeholder="Select organizations…"
                      options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Permission</label>
                    <CustomDropdown
                      value={editingUser.permission || 'view'}
                      onChange={(v) =>
                        setEditingUser({
                          ...editingUser,
                          permission: v as 'view' | 'manage',
                        })
                      }
                      options={[
                        { value: 'view', label: 'View' },
                        { value: 'manage', label: 'Manage' },
                      ]}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Venues</label>
                    <MultiSelectDropdown
                      values={editingUser.assignedVenueIds || []}
                      onChange={(ids) => setEditingUser({ ...editingUser, assignedVenueIds: ids })}
                      icon={MapPin}
                      placeholder={
                        !(editingUser.organizationIds && editingUser.organizationIds.length > 0)
                          ? 'Select organizations first…'
                          : 'Select venues…'
                      }
                      options={venues
                        .filter((v) => (editingUser.organizationIds || []).includes(v.orgId))
                        .map((v) => ({ value: v.id, label: v.name }))}
                      disabled={!(editingUser.organizationIds && editingUser.organizationIds.length > 0)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        void (async () => {
                          try {
                            if (!(editingUser.organizationIds && editingUser.organizationIds.length > 0)) {
                              return;
                            }
                            await onUpdateUser(editingUser.id, editingUser);
                            setEditingUser(null);
                          } catch {
                            // Keep modal open so user can retry
                          }
                        })();
                      }}
                      disabled={!(editingUser.organizationIds && editingUser.organizationIds.length > 0)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Update User
                    </button>
                  </div>
                </div>
              )}
            </Modal>
      
            {/* Edit Org Modal */}
            <Modal
              isOpen={!!editingOrg}
              onClose={() => setEditingOrg(null)}
              title="Edit Organization"
            >
              {editingOrg && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editingOrg.name}
                      onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
                    <input
                      type="text"
                      value={editingOrg.address || ''}
                      onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setEditingOrg(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        void (async () => {
                          try {
                            await onUpdateOrg(editingOrg.id, editingOrg);
                            setEditingOrg(null);
                          } catch {
                            // Keep modal open so user can retry
                          }
                        })();
                      }}
                      disabled={!editingOrg.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Update Organization
                    </button>
                  </div>
                </div>
              )}
            </Modal>
      
            {/* Edit Venue Modal */}
            <Modal
              isOpen={!!editingVenue}
              onClose={() => setEditingVenue(null)}
              title="Edit Venue"
            >
              {editingVenue && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name</label>
                    <input
                      type="text"
                      value={editingVenue.name}
                      onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                    <CustomDropdown
                      value={editingVenue.orgId}
                      onChange={(v) => setEditingVenue({ ...editingVenue, orgId: v })}
                      icon={Building2}
                      placeholder="Select organization…"
                      options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setEditingVenue(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        void (async () => {
                          try {
                            await onUpdateVenue(editingVenue.id, editingVenue);
                            setEditingVenue(null);
                          } catch {
                            // Keep modal open so user can retry
                          }
                        })();
                      }}
                      disabled={!editingVenue.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Update Venue
                    </button>
                  </div>
                </div>
              )}
            </Modal>
      
            {/* Edit Device Modal */}
            <Modal
              isOpen={!!editingDevice}
              onClose={() => {
                setEditingDevice(null);
                setApiKeyCopied(false);
              }}
              title="Edit Device"
            >
              {editingDevice && (
                <div className="space-y-4">
                  {editDeviceError && (
                    <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      {editDeviceError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Device Name</label>
                    <input
                      type="text"
                      value={editingDevice.name}
                      onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Select Organization</label>
                    <CustomDropdown
                      value={editingDevice.organizationId || ''}
                      onChange={(orgId) =>
                        setEditingDevice({
                          ...editingDevice,
                          organizationId: orgId,
                          venueId: '',
                        })
                      }
                      icon={Building2}
                      placeholder="Select organization"
                      options={orgs.map((org) => ({
                        value: org.id,
                        label: org.name,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">Select Venue</label>
                    <CustomDropdown
                      value={editingDevice.venueId}
                      onChange={(venueId) => setEditingDevice({ ...editingDevice, venueId })}
                      icon={MapPin}
                      placeholder="No venues available"
                      options={
                        editDeviceVenues.length > 0
                          ? editDeviceVenues.map((venue) => ({
                              value: venue.id,
                              label: venue.name,
                            }))
                          : [{ value: '', label: 'No venues available', disabled: true }]
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Brand</label>
                    <CustomDropdown
                      value={editingDevice.brandId || ''}
                      onChange={(brandId) => {
                        const brandName = editDeviceBrands.find((b) => b.id === brandId)?.name || '';
                        setEditingDevice({ ...editingDevice, brandId, brand: brandName });
                      }}
                      icon={MonitorSmartphone}
                      placeholder="No brands available"
                      options={
                        editDeviceBrands.length > 0
                          ? editDeviceBrands.map((brand) => ({
                              value: brand.id,
                              label: brand.name,
                            }))
                          : [{ value: '', label: 'No brands available', disabled: true }]
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">AC Capacity</label>
                    <CustomDropdown
                      value={String(Number(String(editingDevice.capacityTon || '1.5').replace(/ton/gi, '')) || 1.5)}
                      onChange={(capacity) =>
                        setEditingDevice({ ...editingDevice, capacityTon: `${capacity}ton` })
                      }
                      icon={Activity}
                      options={[
                        { value: '1', label: '1.0 Ton' },
                        { value: '1.5', label: '1.5 Ton' },
                        { value: '2', label: '2.0 Ton' },
                        { value: '2.5', label: '2.5 Ton' },
                        { value: '3', label: '3.0 Ton' },
                        { value: '3.5', label: '3.5 Ton' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                      Line Voltage (V)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={400}
                      step={1}
                      value={editingDevice.voltage ?? 230}
                      onChange={(e) =>
                        setEditingDevice({
                          ...editingDevice,
                          voltage: Number(e.target.value) || 230,
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">API Key</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={editingDevice.apiKey || ''}
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-xs font-mono font-bold text-slate-600 cursor-default select-all"
                        placeholder="No API key"
                      />
                      <button
                        type="button"
                        title={apiKeyCopied ? 'Copied' : 'Copy API key'}
                        disabled={!editingDevice.apiKey}
                        onClick={() => {
                          if (!editingDevice.apiKey) return;
                          void navigator.clipboard.writeText(editingDevice.apiKey).then(() => {
                            setApiKeyCopied(true);
                            window.setTimeout(() => setApiKeyCopied(false), 1800);
                          });
                        }}
                        className="shrink-0 p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {apiKeyCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingDevice(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdateDevice()}
                      disabled={
                        isUpdatingDevice ||
                        !editingDevice.name.trim() ||
                        !editingDevice.organizationId ||
                        !editingDevice.venueId ||
                        !editingDevice.brandId
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isUpdatingDevice ? 'Updating…' : 'Update Device'}
                    </button>
                  </div>
                </div>
              )}
            </Modal>
      
            {/* Delete Confirmation Modal */}
            <Modal
              isOpen={!!deletingId}
              onClose={() => {
                setDeletingId(null);
                setDeleteType(null);
                setDeleteError('');
              }}
              title="Confirm Deletion"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <Activity className="w-6 h-6 shrink-0" />
                  <p className="text-sm font-medium">Are you sure you want to delete this {deleteType}? This action cannot be undone.</p>
                </div>
                {deleteError && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {deleteError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(null);
                      setDeleteType(null);
                      setDeleteError('');
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmDelete()}
                    disabled={isDeletingDevice}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isDeletingDevice ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </Modal>
      
            {/* Add Event Modal */}
            <Modal
              isOpen={showAddEventModal}
              onClose={closeAddEventModal}
              title="Add Device Event"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., Morning Start"
                  />
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Device</label>
                  <select
                    value={eventDeviceId}
                    onChange={(e) => setEventDeviceId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Select a device...</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                    ))}
                  </select>
                </div>
      
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setEventIsOnOff(true)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      eventIsOnOff ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Power Event
                  </button>
                  <button
                    onClick={() => setEventIsOnOff(false)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      !eventIsOnOff ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Temperature Event
                  </button>
                </div>
      
                {eventIsOnOff ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
                    <select
                      value={eventOnOffAction}
                      onChange={(e) => setEventOnOffAction(e.target.value as 'ON' | 'OFF')}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="ON">Turn ON</option>
                      <option value="OFF">Turn OFF</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Temperature (°C)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="16"
                        max="30"
                        value={eventTemp}
                        onChange={(e) => setEventTemp(e.target.value)}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium w-8">{eventTemp}°</span>
                    </div>
                  </div>
                )}
      
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
      
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="eventIsRecurring"
                    checked={eventIsRecurring}
                    onChange={(e) => setEventIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="eventIsRecurring" className="text-sm font-medium text-slate-700">
                    Recurring Event
                  </label>
                </div>
      
                {eventIsRecurring ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Days of Week</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button
                          key={day}
                          onClick={() => {
                            setEventDays(prev => 
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            eventDays.includes(day)
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
      
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={closeAddEventModal}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEvent}
                    disabled={!eventName || !eventDeviceId || !eventTime || (eventIsRecurring && eventDays.length === 0) || (!eventIsRecurring && (!eventStartDate || !eventEndDate))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </Modal>

            {deviceToast && (
              <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
                <div
                  className={`px-4 py-3 rounded-xl border shadow-lg text-xs font-bold max-w-sm ${
                    deviceToast.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : deviceToast.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {deviceToast.message}
                </div>
              </div>
            )}
    </>
  );
}
