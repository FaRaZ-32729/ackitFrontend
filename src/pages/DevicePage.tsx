import React, { useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ACDetail } from '../components/devices/ACDetail';
import { setDeviceRemote } from '../api/deviceApi';

export function DevicePage() {
  const {
    role,
    units,
    setUnits,
    handleTogglePower,
    handleSetTemp,
    handleAddEvent,
    handleDeleteEvent,
    handleToggleEvent,
  } = useAppContext();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleSetRemote = useCallback(
    async (deviceId: string, remote: 'unlock' | 'lock' | 'superlock') => {
      let snapshot: { isLocked: boolean; eventLocked: boolean } | undefined;
      setUnits((list) => {
        const prev = list.find((u) => u.id === deviceId);
        if (prev) {
          snapshot = {
            isLocked: prev.isLocked,
            eventLocked: prev.eventLocked,
          };
        }
        return list.map((u) =>
          u.id === deviceId
            ? {
                ...u,
                isLocked: remote === 'lock' || remote === 'superlock',
                eventLocked: remote === 'superlock',
              }
            : u
        );
      });
      try {
        await setDeviceRemote(deviceId, remote);
      } catch {
        if (snapshot) {
          setUnits((list) =>
            list.map((u) =>
              u.id === deviceId
                ? {
                    ...u,
                    isLocked: snapshot!.isLocked,
                    eventLocked: snapshot!.eventLocked,
                  }
                : u
            )
          );
        }
      }
    },
    [setUnits]
  );

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const unit = units.find((u) => u.id === id);

  if (!unit) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-3">
        <h2 className="text-sm font-bold text-slate-800">Device not found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          This device may have been removed or is not loaded yet.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-8 py-4 sm:py-6 md:py-8">
        <ACDetail
          unit={unit}
          role={role}
          onBack={() => {
            if (role === 'admin') {
              navigate('/admin/devices');
            } else if (role === 'manager') {
              navigate('/manager/devices');
            } else {
              navigate('/user/devices');
            }
          }}
          onTogglePower={handleTogglePower}
          onSetTemp={handleSetTemp}
          onSetRemote={handleSetRemote}
          onAddEvent={handleAddEvent}
          onDeleteEvent={handleDeleteEvent}
          onToggleEvent={handleToggleEvent}
        />
      </div>
    </div>
  );
}
