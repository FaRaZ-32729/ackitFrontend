import api from './axios';
import type { ACEvent } from '../types';

export type EventScope = 'device' | 'venue' | 'organization';
export type EventAction = 'ON' | 'OFF';
export type EventRemote = 'lock' | 'unlock';

export interface ScheduleEvent {
  id: string;
  name: string;
  scope: EventScope;
  organizationId: string;
  venueId?: string | null;
  deviceId?: string | null;
  action: EventAction;
  targetTemp?: number | null;
  /** UTC (BullMQ) */
  startTime: string;
  endTime: string;
  days: string[];
  endDays?: string[];
  isOvernight?: boolean;
  isRecurring?: boolean;
  /** Original user-local inputs (prefer for UI) */
  localStartTime?: string;
  localEndTime?: string;
  localDays?: string[];
  timezoneOffsetMinutes?: number;
  remote: EventRemote;
  enabled: boolean;
  status: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Map API event → UI ACEvent (prefer local wall-clock fields). */
export function scheduleEventToACEvent(saved: ScheduleEvent): ACEvent {
  const isRecurring =
    saved.isRecurring !== false &&
    Array.isArray(saved.days) &&
    saved.days.length > 0;
  return {
    id: saved.id,
    name: saved.name,
    time: saved.localStartTime || saved.startTime,
    endTime: saved.localEndTime || saved.endTime,
    action: saved.action,
    targetTemp: saved.targetTemp ?? undefined,
    isRecurring,
    days:
      saved.localDays && saved.localDays.length > 0
        ? saved.localDays
        : saved.days || [],
    enabled: saved.enabled,
    remote: saved.remote,
  };
}

export interface CreateEventPayload {
  name: string;
  scope: EventScope;
  organizationId: string;
  venueId?: string | null;
  deviceId?: string | null;
  action: EventAction;
  targetTemp?: number | null;
  startTime: string;
  endTime: string;
  days: string[];
  remote?: EventRemote;
  /** Browser Date#getTimezoneOffset() — converts local → UTC on create */
  timezoneOffsetMinutes: number;
}

export async function createScheduleEvent(
  payload: CreateEventPayload
): Promise<ScheduleEvent> {
  const { data } = await api.post<{ success: boolean; event: ScheduleEvent }>(
    '/api/event/create',
    payload
  );
  return data.event;
}

export async function listScheduleEvents(params: {
  organizationId?: string;
  venueId?: string;
  deviceId?: string;
  scope?: EventScope;
}): Promise<ScheduleEvent[]> {
  const { data } = await api.get<{ success: boolean; events: ScheduleEvent[] }>(
    '/api/event/list',
    { params }
  );
  return data.events || [];
}

export async function setScheduleEventEnabled(
  id: string,
  enabled: boolean
): Promise<ScheduleEvent> {
  const { data } = await api.patch<{ success: boolean; event: ScheduleEvent }>(
    `/api/event/${id}/enabled`,
    { enabled }
  );
  return data.event;
}

export async function deleteScheduleEvent(id: string): Promise<void> {
  await api.delete(`/api/event/${id}`);
}
