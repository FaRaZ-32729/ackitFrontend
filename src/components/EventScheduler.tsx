import React, { useState } from 'react';
import { ACEvent, Role } from '../types';
import { Clock, Plus, Trash2 } from 'lucide-react';

interface EventSchedulerProps {
  events: ACEvent[];
  onAddEvent: (event: Omit<ACEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onToggleEvent: (id: string) => void;
  role: Role;
  canControlEvents?: boolean;
}

export function EventScheduler({
  events,
  onAddEvent,
  onDeleteEvent,
  onToggleEvent,
  role,
  canControlEvents = true,
}: EventSchedulerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newIsOnOff, setNewIsOnOff] = useState(false);
  const [newAction, setNewAction] = useState<'ON' | 'OFF' | 'SET_TEMP'>('ON');
  const [newTemp, setNewTemp] = useState(22);
  const [newIsRecurring, setNewIsRecurring] = useState(true);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDays, setNewDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAdd = () => {
    onAddEvent({
      name: newName || 'Event',
      time: newTime,
      action: newIsOnOff ? (newAction === 'ON' ? 'ON' : 'OFF') : 'SET_TEMP',
      targetTemp: !newIsOnOff ? newTemp : undefined,
      isRecurring: newIsRecurring,
      startDate: !newIsRecurring ? newStartDate : undefined,
      endDate: !newIsRecurring ? newEndDate : undefined,
      days: newIsRecurring ? newDays : [],
      enabled: true,
    });
    setIsAdding(false);
    // Reset form
    setNewName('');
    setNewTime('08:00');
    setNewIsOnOff(false);
    setNewAction('ON');
    setNewTemp(22);
    setNewIsRecurring(true);
    setNewStartDate('');
    setNewEndDate('');
    setNewDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Schedule & Events</h3>
        {!isAdding && canControlEvents && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Add Event</span>
            <span className="xs:hidden">Add</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Event Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Morning Start"
            />
          </div>

          <div className="flex p-1 bg-slate-200/50 rounded-lg">
            <button
              onClick={() => setNewIsOnOff(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                newIsOnOff ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Power Event
            </button>
            <button
              onClick={() => setNewIsOnOff(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !newIsOnOff ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Temperature Event
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {newIsOnOff ? (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value as 'ON' | 'OFF')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ON">Turn ON</option>
                  <option value="OFF">Turn OFF</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Target Temperature (°C)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="16"
                    max="30"
                    value={newTemp}
                    onChange={(e) => setNewTemp(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium w-8">{newTemp}°</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newIsRecurring"
              checked={newIsRecurring}
              onChange={(e) => setNewIsRecurring(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="newIsRecurring" className="text-sm font-medium text-slate-700">
              Recurring Event
            </label>
          </div>

          {!newIsRecurring ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors ${
                      newDays.includes(day)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={newIsRecurring ? newDays.length === 0 : (!newStartDate || !newEndDate)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Event
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No events scheduled.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`flex items-center justify-between p-3 md:p-4 rounded-xl border transition-colors ${
                event.enabled
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50 border-slate-100 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`p-2 rounded-full ${
                    event.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm md:text-base">{event.name || 'Event'} - {event.time}</span>
                    <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {event.action} {event.targetTemp ? `${event.targetTemp}°C` : ''}
                    </span>
                  </div>
                  <div className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                    {event.isRecurring 
                      ? event.days.join(', ') 
                      : `${event.startDate || ''} to ${event.endDate || ''}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <label className={`relative inline-flex items-center ${canControlEvents ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={event.enabled}
                    onChange={() => canControlEvents && onToggleEvent(event.id)}
                    disabled={!canControlEvents}
                  />
                  <div className="w-8 h-4 md:w-9 md:h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
                {canControlEvents && (
                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete event"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
