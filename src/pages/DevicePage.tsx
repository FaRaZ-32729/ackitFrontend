import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ACDetail } from '../components/devices/ACDetail';

export function DevicePage() {
  const {
    role,
    units,
    handleTogglePower,
    handleSetTemp,
    handleToggleLock,
    handleToggleEventLock,
    handleAddEvent,
    handleDeleteEvent,
    handleToggleEvent,
  } = useAppContext();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  const unit = units.find((u) => u.id === id);

  if (!unit) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-sm font-bold text-slate-800">Device not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
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
          onToggleLock={handleToggleLock}
          onToggleEventLock={handleToggleEventLock}
          onAddEvent={handleAddEvent}
          onDeleteEvent={handleDeleteEvent}
          onToggleEvent={handleToggleEvent}
        />
      </div>
    </div>
  );
}
