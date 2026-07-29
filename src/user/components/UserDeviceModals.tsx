import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import {
  Building2,
  MapPin,
  MonitorSmartphone,
  Activity,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';

/** User workspace device modals (add / edit / delete / event + toast) */
export function UserDeviceModals() {
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const {
    units,
    orgs,
    showAddDevice,
    setShowAddDevice,
    newDeviceName,
    setNewDeviceName,
    newDeviceOrgId,
    setNewDeviceOrgId,
    newDeviceVenueId,
    setNewDeviceVenueId,
    newDeviceBrand,
    setNewDeviceBrand,
    newDeviceCapacity,
    setNewDeviceCapacity,
    newDeviceVenues,
    newDeviceBrands,
    newDeviceError,
    isAddingDevice,
    deviceToast,
    editDeviceVenues,
    editDeviceBrands,
    editDeviceError,
    isUpdatingDevice,
    isDeletingDevice,
    deleteError,
    setDeleteError,
    editingDevice,
    setEditingDevice,
    deletingId,
    setDeletingId,
    deleteType,
    setDeleteType,
    showAddEventModal,
    eventDeviceId,
    eventDeviceName,
    eventName,
    setEventName,
    eventTemp,
    setEventTemp,
    eventDays,
    setEventDays,
    eventOnOffAction,
    setEventOnOffAction,
    eventTime,
    setEventTime,
    eventEndTime,
    setEventEndTime,
    eventRemote,
    setEventRemote,
    handleAddDevice,
    handleUpdateDevice,
    handleConfirmDelete,
    closeAddEventModal,
    handleAddEvent,
  } = useUserWorkspace();

  return (
    <>
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
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
              Device Name
            </label>
            <input
              type="text"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
              placeholder="e.g. SSUET Seminar Hall AC"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
              Select Organization
            </label>
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
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
              Select Venue
            </label>
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
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
              AC Brand
            </label>
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
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
              AC Capacity
            </label>
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
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={editingDevice.name}
                onChange={(e) =>
                  setEditingDevice({ ...editingDevice, name: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                Select Organization
              </label>
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
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                Select Venue
              </label>
              <CustomDropdown
                value={editingDevice.venueId}
                onChange={(venueId) =>
                  setEditingDevice({ ...editingDevice, venueId })
                }
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
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                AC Brand
              </label>
              <CustomDropdown
                value={editingDevice.brandId || ''}
                onChange={(brandId) => {
                  const brandName =
                    editDeviceBrands.find((b) => b.id === brandId)?.name || '';
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
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                AC Capacity
              </label>
              <CustomDropdown
                value={String(
                  Number(
                    String(editingDevice.capacityTon || '1.5').replace(/ton/gi, '')
                  ) || 1.5
                )}
                onChange={(capacity) =>
                  setEditingDevice({
                    ...editingDevice,
                    capacityTon: `${capacity}ton`,
                  })
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
                API Key
              </label>
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

      <Modal
        isOpen={!!deletingId && deleteType === 'device'}
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
            <p className="text-sm font-medium">
              Are you sure you want to delete this {deleteType}? This action cannot be
              undone.
            </p>
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
              {eventDeviceName ||
                units.find((u) => u.id === eventDeviceId)?.name ||
                'Selected device'}
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
              {[
                { value: 'Mon', label: 'Monday' },
                { value: 'Tue', label: 'Tuesday' },
                { value: 'Wed', label: 'Wednesday' },
                { value: 'Thu', label: 'Thursday' },
                { value: 'Fri', label: 'Friday' },
                { value: 'Sat', label: 'Saturday' },
                { value: 'Sun', label: 'Sunday' },
              ].map((day) => (
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
              onClick={handleAddEvent}
              disabled={!eventName || !eventDeviceId || !eventTime || !eventEndTime}
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
