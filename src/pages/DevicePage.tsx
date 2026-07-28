import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ACDetail } from '../components/devices/ACDetail';
import { getDeviceById } from '../api/deviceApi';
import type { ACUnit } from '../types';
import { RefreshCw } from 'lucide-react';

export function DevicePage() {
  const { role, user, units, setUnits } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<ACUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage =
    role === 'manager' ||
    role === 'admin' ||
    (role === 'user' && user?.permission === 'manage');

  const loadDevice = useCallback(async () => {
    if (!id) {
      setDevice(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetched = await getDeviceById(id);
      setDevice(fetched);
      setUnits((prev) => {
        const others = prev.filter((u) => u.id !== fetched.id);
        const existing = prev.find((u) => u.id === fetched.id);
        return [
          ...others,
          existing
            ? { ...existing, ...fetched, events: existing.events || fetched.events }
            : fetched,
        ];
      });
    } catch (err: unknown) {
      setUnits((prev) => {
        const cached = prev.find((u) => u.id === id);
        if (cached) {
          setDevice(cached);
          setError(null);
        } else {
          const message =
            (err as { response?: { data?: { message?: string } }; message?: string })
              ?.response?.data?.message ||
            (err as { message?: string })?.message ||
            'Device not found';
          setError(message);
          setDevice(null);
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, [id, setUnits]);

  useEffect(() => {
    void loadDevice();
  }, [loadDevice]);

  const handleUnitChange = useCallback(
    (deviceId: string, patch: Partial<ACUnit>) => {
      setDevice((prev) =>
        prev && prev.id === deviceId ? { ...prev, ...patch } : prev
      );
      setUnits((list) =>
        list.map((u) => (u.id === deviceId ? { ...u, ...patch } : u))
      );
    },
    [setUnits]
  );

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading device…
        </p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-3">
        <h2 className="text-sm font-bold text-slate-800">Device not found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          {error || 'This device may have been removed or you do not have access.'}
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
          unit={device}
          role={role}
          canManage={canManage}
          onBack={() => {
            if (role === 'admin') {
              navigate('/admin/devices');
            } else if (role === 'manager') {
              navigate('/manager/devices');
            } else {
              navigate('/user/devices');
            }
          }}
          onUnitChange={handleUnitChange}
        />
      </div>
    </div>
  );
}
