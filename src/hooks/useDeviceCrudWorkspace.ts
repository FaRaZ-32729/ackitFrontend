import React, { useEffect, useRef, useState } from 'react';
import type { ACUnit, Organization, Venue, ACEvent } from '../types';
import {
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceBrandOptions,
  parseCapacityTon,
  type DeviceBrandOption,
} from '../api/deviceApi';
import { getVenuesByOrganization } from '../api/venueApi';
import { createScheduleEvent, scheduleEventToACEvent } from '../api/eventApi';

/**
 * Shared device CRUD / event modal state for manager & user device management.
 */
export function useDeviceCrudWorkspace(opts: {
  units: ACUnit[];
  orgs: Organization[];
  venues: Venue[];
  onAddDevice: (device: ACUnit) => void;
  onUpdateDevice: (id: string, data: Partial<ACUnit>) => void;
  onDeleteDevice: (id: string) => void;
  /** Limit venues when adding/editing devices (assigned venues for users) */
  filterVenuesForOrg?: (orgId: string, list: Venue[]) => Venue[];
}) {
  const {
    units,
    orgs,
    venues,
    onAddDevice,
    onUpdateDevice,
    onDeleteDevice,
    filterVenuesForOrg,
  } = opts;

  const deviceEventListeners = useRef<
    Set<(deviceId: string, event: ACEvent) => void>
  >(new Set());
  const deviceDeletedListeners = useRef<Set<(deviceId: string) => void>>(
    new Set()
  );
  const deviceUpdatedListeners = useRef<Set<(device: ACUnit) => void>>(
    new Set()
  );

  const subscribeDeviceEventAdd = (
    listener: (deviceId: string, event: ACEvent) => void
  ) => {
    deviceEventListeners.current.add(listener);
    return () => {
      deviceEventListeners.current.delete(listener);
    };
  };

  const subscribeDeviceDeleted = (listener: (deviceId: string) => void) => {
    deviceDeletedListeners.current.add(listener);
    return () => {
      deviceDeletedListeners.current.delete(listener);
    };
  };

  const subscribeDeviceUpdated = (listener: (device: ACUnit) => void) => {
    deviceUpdatedListeners.current.add(listener);
    return () => {
      deviceUpdatedListeners.current.delete(listener);
    };
  };

  const handleDeleteDeviceLocal = (id: string) => {
    onDeleteDevice(id);
    deviceDeletedListeners.current.forEach((fn) => fn(id));
  };

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceOrgId, setNewDeviceOrgId] = useState('');
  const [newDeviceVenueId, setNewDeviceVenueId] = useState('');
  const [newDeviceBrand, setNewDeviceBrand] = useState('');
  const [newDeviceEnergySensor, setNewDeviceEnergySensor] = useState(true);
  const [newDeviceCapacity, setNewDeviceCapacity] = useState('1.5');
  const [newDeviceVenues, setNewDeviceVenues] = useState<Venue[]>([]);
  const [newDeviceBrands, setNewDeviceBrands] = useState<DeviceBrandOption[]>(
    []
  );
  const [newDeviceError, setNewDeviceError] = useState('');
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [deviceToast, setDeviceToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const deviceToastTimer = useRef<number | null>(null);

  const showDeviceToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setDeviceToast({ message, type });
    if (deviceToastTimer.current) window.clearTimeout(deviceToastTimer.current);
    deviceToastTimer.current = window.setTimeout(() => {
      setDeviceToast(null);
      deviceToastTimer.current = null;
    }, 2500);
  };

  const [editingDevice, setEditingDevice] = useState<ACUnit | null>(null);
  const [editDeviceVenues, setEditDeviceVenues] = useState<Venue[]>([]);
  const [editDeviceBrands, setEditDeviceBrands] = useState<DeviceBrandOption[]>(
    []
  );
  const [editDeviceError, setEditDeviceError] = useState('');
  const [isUpdatingDevice, setIsUpdatingDevice] = useState(false);
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<
    'device' | 'user' | 'org' | 'venue' | null
  >(null);

  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [selectedDeviceVenueId, setSelectedDeviceVenueId] =
    useState<string>('all');
  const [deviceTempInputs, setDeviceTempInputs] = useState<
    Record<string, string>
  >({});

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventDeviceId, setEventDeviceId] = useState('');
  const [eventDeviceName, setEventDeviceName] = useState('');
  const [eventOrganizationId, setEventOrganizationId] = useState('');
  const [eventVenueId, setEventVenueId] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventTemp, setEventTemp] = useState('22');
  const [eventDays, setEventDays] = useState<string[]>([]);
  const [eventOnOffAction, setEventOnOffAction] = useState<'ON' | 'OFF'>('ON');
  const [eventTime, setEventTime] = useState('08:00');
  const [eventEndTime, setEventEndTime] = useState('18:00');
  const [eventRemote, setEventRemote] = useState<'lock' | 'unlock'>('unlock');

  useEffect(() => {
    if (showAddDevice) {
      const defaultOrgId = orgs[0]?.id || '';
      setNewDeviceOrgId(defaultOrgId);
      setNewDeviceVenueId('');
      setNewDeviceName('');
      setNewDeviceBrand('');
      setNewDeviceEnergySensor(true);
      setNewDeviceCapacity('1.5');
      setNewDeviceError('');

      getDeviceBrandOptions()
        .then((brands) => {
          setNewDeviceBrands(brands);
          setNewDeviceBrand(brands[0]?.id || '');
        })
        .catch(() => setNewDeviceError('Failed to load AC brands'));
    }
  }, [showAddDevice, orgs]);

  useEffect(() => {
    if (!showAddDevice || !newDeviceOrgId) {
      setNewDeviceVenues([]);
      setNewDeviceVenueId('');
      return;
    }

    let active = true;
    setNewDeviceVenueId('');
    setNewDeviceVenues([]);

    getVenuesByOrganization(newDeviceOrgId)
      .then((list) => {
        if (!active) return;
        const scoped = filterVenuesForOrg
          ? filterVenuesForOrg(newDeviceOrgId, list)
          : list;
        setNewDeviceVenues(scoped);
        setNewDeviceVenueId(scoped[0]?.id || '');
      })
      .catch(() => {
        if (!active) return;
        setNewDeviceVenues([]);
        setNewDeviceVenueId('');
        setNewDeviceError('Failed to load venues for this organization');
      });

    return () => {
      active = false;
    };
  }, [showAddDevice, newDeviceOrgId, filterVenuesForOrg]);

  useEffect(() => {
    if (!editingDevice) {
      setEditDeviceVenues([]);
      setEditDeviceBrands([]);
      setEditDeviceError('');
      return;
    }

    setEditDeviceError('');
    getDeviceBrandOptions()
      .then((brands) => {
        setEditDeviceBrands(brands);
        setEditingDevice((prev) => {
          if (!prev) return prev;
          const brandId =
            prev.brandId ||
            brands.find((b) => b.name === prev.brand)?.id ||
            brands[0]?.id ||
            '';
          return { ...prev, brandId };
        });
      })
      .catch(() => setEditDeviceError('Failed to load AC brands'));
  }, [editingDevice?.id]);

  useEffect(() => {
    if (!editingDevice?.organizationId) {
      setEditDeviceVenues([]);
      return;
    }

    const orgId = editingDevice.organizationId;
    getVenuesByOrganization(orgId)
      .then((list) => {
        const scoped = filterVenuesForOrg
          ? filterVenuesForOrg(orgId, list)
          : list;
        setEditDeviceVenues(scoped);
        setEditingDevice((prev) => {
          if (!prev || prev.organizationId !== orgId) return prev;
          const venueStillValid = scoped.some((v) => v.id === prev.venueId);
          return {
            ...prev,
            venueId: venueStillValid ? prev.venueId : scoped[0]?.id || '',
          };
        });
      })
      .catch(() => setEditDeviceVenues([]));
  }, [editingDevice?.organizationId, filterVenuesForOrg]);

  const handleAddDevice = async () => {
    if (
      !newDeviceName.trim() ||
      !newDeviceOrgId ||
      !newDeviceVenueId ||
      !newDeviceBrand
    )
      return;

    const venueBelongsToOrg = newDeviceVenues.some(
      (v) => v.id === newDeviceVenueId
    );
    if (!venueBelongsToOrg) {
      const message =
        'Please select a venue that belongs to the selected organization';
      setNewDeviceError(message);
      showDeviceToast(message, 'error');
      return;
    }

    if (newDeviceName.trim().length < 2) {
      const message = 'Device name must be at least 2 characters';
      setNewDeviceError(message);
      showDeviceToast(message, 'error');
      return;
    }

    const nameExistsLocally = units.some(
      (u) =>
        u.venueId === newDeviceVenueId &&
        u.name.trim().toLowerCase() === newDeviceName.trim().toLowerCase()
    );
    if (nameExistsLocally) {
      const message = 'This name is already present in this venue';
      setNewDeviceError(message);
      showDeviceToast(message, 'error');
      return;
    }

    setIsAddingDevice(true);
    setNewDeviceError('');
    try {
      const device = await createDevice({
        name: newDeviceName.trim(),
        organization: String(newDeviceOrgId),
        venue: String(newDeviceVenueId),
        brand: String(newDeviceBrand),
        capacity: Number(newDeviceCapacity),
      });
      onAddDevice(device);
      setShowAddDevice(false);
      setNewDeviceName('');
      showDeviceToast('Device created successfully', 'success');
    } catch (error: any) {
      const status = error?.response?.status;
      const apiMessage = String(error?.response?.data?.message || '');
      const apiErrors = error?.response?.data?.errors;
      const details =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors
              .map((e: { message?: string }) => e.message)
              .filter(Boolean)
              .join(' · ')
          : '';

      const isNameTaken =
        status === 409 &&
        (/already exists/i.test(apiMessage) ||
          /deviceName/i.test(apiMessage) ||
          /name is already/i.test(apiMessage) ||
          /name already/i.test(details));

      const message = isNameTaken
        ? 'This name is already present in this venue'
        : details || apiMessage || error?.message || 'Failed to create device';

      setNewDeviceError(message);
      showDeviceToast(message, 'error');
    } finally {
      setIsAddingDevice(false);
    }
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    if (
      !editingDevice.name.trim() ||
      !editingDevice.organizationId ||
      !editingDevice.venueId ||
      !editingDevice.brandId
    ) {
      return;
    }

    setIsUpdatingDevice(true);
    setEditDeviceError('');
    try {
      const updated = await updateDevice(editingDevice.id, {
        name: editingDevice.name.trim(),
        organization: editingDevice.organizationId,
        venue: editingDevice.venueId,
        brand: editingDevice.brandId,
        capacity: parseCapacityTon(editingDevice.capacityTon),
      });
      const merged: ACUnit = {
        ...editingDevice,
        ...updated,
        events: editingDevice.events || [],
        isOn: editingDevice.isOn,
        isLocked: editingDevice.isLocked,
        eventLocked: editingDevice.eventLocked,
        targetTemp: editingDevice.targetTemp,
        currentTemp: editingDevice.currentTemp,
        powerConsumption:
          updated.powerConsumption ?? editingDevice.powerConsumption,
        voltage: updated.voltage ?? editingDevice.voltage ?? 230,
        current: updated.current ?? editingDevice.current,
      };
      onUpdateDevice(merged.id, merged);
      deviceUpdatedListeners.current.forEach((fn) => fn(merged));
      setEditingDevice(null);
    } catch (error: any) {
      setEditDeviceError(
        error?.response?.data?.errors?.[0]?.message ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update device'
      );
    } finally {
      setIsUpdatingDevice(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId || deleteType !== 'device') return;
    setDeleteError('');
    try {
      setIsDeletingDevice(true);
      await deleteDevice(deletingId);
      handleDeleteDeviceLocal(deletingId);
      setDeletingId(null);
      setDeleteType(null);
    } catch (error: any) {
      setDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to delete device'
      );
    } finally {
      setIsDeletingDevice(false);
    }
  };

  const closeAddEventModal = () => {
    setShowAddEventModal(false);
    setEventDeviceId('');
    setEventDeviceName('');
    setEventOrganizationId('');
    setEventVenueId('');
    setEventName('');
    setEventTemp('22');
    setEventDays([]);
    setEventOnOffAction('ON');
    setEventTime('08:00');
    setEventEndTime('18:00');
    setEventRemote('unlock');
  };

  const handleAddEvent = async () => {
    if (!eventDeviceId || !eventName || !eventTime || !eventEndTime) return;

    const device = units.find((u) => u.id === eventDeviceId);
    const organizationId =
      eventOrganizationId || device?.organizationId || orgs[0]?.id;
    if (!organizationId) {
      showDeviceToast('Organization missing for this device', 'error');
      return;
    }

    try {
      const saved = await createScheduleEvent({
        name: eventName.trim(),
        scope: 'device',
        organizationId,
        deviceId: eventDeviceId,
        venueId: eventVenueId || device?.venueId || null,
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

      if (device) {
        onUpdateDevice(eventDeviceId, {
          events: [...(device.events || []), newEvent],
        });
      }

      deviceEventListeners.current.forEach((fn) =>
        fn(eventDeviceId, newEvent)
      );
      showDeviceToast('Event scheduled', 'success');
      closeAddEventModal();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to create event';
      showDeviceToast(message, 'error');
    }
  };

  return {
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
    newDeviceEnergySensor,
    setNewDeviceEnergySensor,
    newDeviceCapacity,
    setNewDeviceCapacity,
    newDeviceVenues,
    newDeviceBrands,
    newDeviceError,
    isAddingDevice,
    deviceToast,
    setDeviceToast,
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
    expandedDeviceId,
    setExpandedDeviceId,
    selectedDeviceVenueId,
    setSelectedDeviceVenueId,
    deviceTempInputs,
    setDeviceTempInputs,
    showAddEventModal,
    setShowAddEventModal,
    eventDeviceId,
    setEventDeviceId,
    eventDeviceName,
    setEventDeviceName,
    eventOrganizationId,
    setEventOrganizationId,
    eventVenueId,
    setEventVenueId,
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
    subscribeDeviceEventAdd,
    subscribeDeviceDeleted,
    subscribeDeviceUpdated,
    venues,
  };
}
