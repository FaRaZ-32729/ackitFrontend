import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Trash2, Check, Power, RefreshCw, Layers, Plus, X, Send,
  Snowflake, Sun, Droplets, Sparkles, Fan
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createConfigureId,
  selectBrandCommand,
  clearBrandCommand,
  saveBrand,
  applyBrandCommand,
  getAllBrands,
  deleteBrand,
  mapApiBrandToSignals,
  type ApiBrand,
  type BrandSignalsPayload,
} from '../../api/brandApi';
import {
  getBrandSocket,
  joinBrandConfigureRoom,
  leaveBrandConfigureRoom,
} from '../../api/brandSocket';

export interface DecodedBrand {
  id: string;
  name: string;
  configureId: string;
  status: 'connected' | 'disconnected';
  signals: BrandSignalsPayload;
}

const ALL_TEMPERATURES = Array.from({ length: 15 }, (_, i) => i + 16); // 16°C – 30°C

const TEMP_C_BY_WORD: Record<string, number> = {
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  twentyOne: 21,
  twentyTwo: 22,
  twentyThree: 23,
  twentyFour: 24,
  twentyFive: 25,
  twentySix: 26,
  twentySeven: 27,
  twentyEight: 28,
  twentyNine: 29,
  thirty: 30,
};

function emptyTemperatureMap(): Record<number, string | null> {
  return Object.fromEntries(ALL_TEMPERATURES.map((temp) => [temp, null]));
}

function emptySignals(): BrandSignalsPayload {
  return {
    powerOn: null,
    powerOff: null,
    temperatures: emptyTemperatureMap(),
    fanSpeeds: { low: null, medium: null, high: null, ultra: null, turbo: null },
    modes: { cool: null, heat: null, dry: null, fan: null, auto: null },
  };
}

function mapApiBrand(brand: ApiBrand): DecodedBrand {
  return {
    id: brand._id,
    name: brand.brandName,
    configureId: brand.configureId,
    status: 'disconnected',
    signals: mapApiBrandToSignals(brand),
  };
}

function formatPulsePreview(value: string | null | undefined) {
  if (!value) return '';
  if (value.length <= 28) return value;
  return `${value.slice(0, 12)}…${value.slice(-10)}`;
}

type TrainingTarget = {
  type: 'powerOn' | 'powerOff' | 'temperature' | 'fanSpeed' | 'mode';
  key?: number | string;
  label: string;
  command: string;
};

function toCommandPath(type: TrainingTarget['type'], key?: number | string): string {
  if (type === 'powerOn') return 'power.on';
  if (type === 'powerOff') return 'power.off';
  if (type === 'temperature') return `temp.${key}`;
  if (type === 'fanSpeed') return `fan.${key}`;
  if (type === 'mode') return `mode.${key}`;
  return '';
}

function applyCapturedField(
  prev: BrandSignalsPayload,
  field: { group: string; key: string },
  value: string
): BrandSignalsPayload {
  const next = { ...prev };

  if (field.group === 'powerCommands') {
    if (field.key === 'on') next.powerOn = value;
    if (field.key === 'off') next.powerOff = value;
    return next;
  }

  if (field.group === 'modes') {
    const modeKey =
      field.key === 'fanOnly' ? 'fan' : field.key === 'smartAuto' ? 'auto' : field.key;
    next.modes = { ...next.modes, [modeKey as keyof typeof next.modes]: value };
    return next;
  }

  if (field.group === 'temperatureCommands') {
    const c = TEMP_C_BY_WORD[field.key];
    if (c) {
      next.temperatures = { ...next.temperatures, [c]: value };
    }
    return next;
  }

  if (field.group === 'fanSpeedCommands') {
    next.fanSpeeds = {
      ...next.fanSpeeds,
      [field.key as keyof typeof next.fanSpeeds]: value,
    };
  }

  return next;
}

export function ACBrandManagement() {
  const [brands, setBrands] = useState<DecodedBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'power-modes' | 'temperatures' | 'fans'>('power-modes');

  const [formName, setFormName] = useState('');
  const [formConfigureId, setFormConfigureId] = useState('');
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  const [signals, setSignals] = useState<BrandSignalsPayload>(emptySignals());
  const [trainingTarget, setTrainingTarget] = useState<TrainingTarget | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      setLoadingBrands(true);
      const list = await getAllBrands();
      setBrands(list.map(mapApiBrand));
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || 'Failed to load brands', 'error');
    } finally {
      setLoadingBrands(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Socket listeners for active configure session
  useEffect(() => {
    if (!formConfigureId) return;

    const socket = getBrandSocket();
    joinBrandConfigureRoom(formConfigureId);

    const onDeviceConnected = (payload: { configureId: string }) => {
      if (payload.configureId !== formConfigureId) return;
      setIsDeviceConnected(true);
      showToast('IR receiver connected via MQTT', 'success');
    };

    const onIrCaptured = (payload: {
      configureId: string;
      field: { group: string; key: string };
      value: string;
    }) => {
      if (payload.configureId !== formConfigureId) return;
      setSignals((prev) => applyCapturedField(prev, payload.field, payload.value));
      setTrainingTarget(null);
      showToast(`IR pulse saved for ${payload.field.group}.${payload.field.key}`, 'success');
    };

    const onIrIgnored = (payload: { configureId: string; reason?: string }) => {
      if (payload.configureId !== formConfigureId) return;
      showToast(payload.reason || 'IR pulse ignored', 'info');
    };

    socket.on('brand:device-connected', onDeviceConnected);
    socket.on('brand:ir-captured', onIrCaptured);
    socket.on('brand:ir-ignored', onIrIgnored);

    return () => {
      socket.off('brand:device-connected', onDeviceConnected);
      socket.off('brand:ir-captured', onIrCaptured);
      socket.off('brand:ir-ignored', onIrIgnored);
      leaveBrandConfigureRoom(formConfigureId);
    };
  }, [formConfigureId, showToast]);

  const handleConfigureDevice = async () => {
    try {
      setIsConfiguring(true);
      if (formConfigureId) {
        leaveBrandConfigureRoom(formConfigureId);
      }

      const configureId = await createConfigureId();
      setFormConfigureId(configureId);
      setIsDeviceConnected(false);
      setSignals(emptySignals());
      joinBrandConfigureRoom(configureId);
      showToast(`Pairing code ${configureId} ready — flash/use it on the ESP`, 'info');
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || 'Configure failed', 'error');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleResetForm = () => {
    if (formConfigureId) {
      leaveBrandConfigureRoom(formConfigureId);
    }
    setEditingBrandId(null);
    setActiveSubTab('power-modes');
    setFormName('');
    setFormConfigureId('');
    setIsDeviceConnected(false);
    setSignals(emptySignals());
    setTrainingTarget(null);
  };

  const handleEditBrand = (brand: DecodedBrand) => {
    if (formConfigureId) {
      leaveBrandConfigureRoom(formConfigureId);
    }
    setEditingBrandId(brand.id);
    setActiveSubTab('power-modes');
    setFormName(brand.name);
    setFormConfigureId(brand.configureId);
    setIsDeviceConnected(false);
    setTrainingTarget(null);
    setSignals({
      ...emptySignals(),
      ...brand.signals,
      temperatures: {
        ...emptyTemperatureMap(),
        ...(brand.signals.temperatures || {}),
      },
    });
    showToast(`Loaded ${brand.name} (view only — create a new configure code to retrain)`, 'info');
  };

  const handleDeleteBrand = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      showToast('Brand removed', 'info');
      if (editingBrandId === id) {
        handleResetForm();
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || 'Delete failed', 'error');
    }
  };

  const startTraining = async (
    type: TrainingTarget['type'],
    key?: number | string,
    label?: string
  ) => {
    const command = toCommandPath(type, key);

    // Saved brands are view-only.
    if (editingBrandId) {
      return;
    }

    if (!formConfigureId) {
      showToast('Click Configure first to generate a pairing code', 'error');
      return;
    }
    if (!isDeviceConnected) {
      showToast('Wait until the IR receiver connects (MQTT status)', 'error');
      return;
    }

    try {
      await selectBrandCommand(formConfigureId, command);
      setTrainingTarget({
        type,
        key,
        label: label || `${type} Command`,
        command,
      });
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || 'Could not arm capture', 'error');
    }
  };

  // Verify a trained command before saving: send it to the AC via the ESP
  const verifyCommand = async (
    type: TrainingTarget['type'],
    key: number | string | undefined,
    label: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!formConfigureId) {
      showToast('No configure code active', 'error');
      return;
    }

    try {
      await applyBrandCommand(formConfigureId, toCommandPath(type, key));
      showToast(`Sent ${label} to the AC — check it responded`, 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || 'Verify failed', 'error');
    }
  };

  const clearCode = async (type: TrainingTarget['type'], key?: number | string) => {
    const command = toCommandPath(type, key);

    setSignals((prev) => {
      const updated = { ...prev };
      if (type === 'powerOn') updated.powerOn = null;
      else if (type === 'powerOff') updated.powerOff = null;
      else if (type === 'temperature' && typeof key === 'number') {
        updated.temperatures = { ...updated.temperatures, [key]: null };
      } else if (type === 'fanSpeed' && typeof key === 'string') {
        updated.fanSpeeds = { ...updated.fanSpeeds, [key as keyof typeof updated.fanSpeeds]: null };
      } else if (type === 'mode' && typeof key === 'string') {
        updated.modes = { ...updated.modes, [key as keyof typeof updated.modes]: null };
      }
      return updated;
    });

    if (formConfigureId && !editingBrandId) {
      try {
        await clearBrandCommand(formConfigureId, command);
      } catch {
        // local clear already applied
      }
    }

    showToast('Trained signal cleared', 'info');
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Brand name is required', 'error');
      return;
    }
    if (!formConfigureId.trim()) {
      showToast('Click Configure to generate a pairing code first', 'error');
      return;
    }
    if (editingBrandId) {
      showToast('Editing saved brands is not supported yet — create a new profile', 'info');
      return;
    }
    if (!signals.powerOn || !signals.powerOff) {
      showToast('Map Device ON and Device OFF before saving', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const brand = await saveBrand({
        configureId: formConfigureId.trim(),
        brandName: formName.trim().toLowerCase(),
        signals,
      });
      setBrands((prev) => [mapApiBrand(brand), ...prev]);
      showToast('Brand profile saved', 'success');
      handleResetForm();
    } catch (error: any) {
      showToast(error?.response?.data?.message || error?.message || 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const subTabs = [
    { id: 'power-modes' as const, label: 'Power & Modes', short: 'Power' },
    { id: 'temperatures' as const, label: 'Temperatures', short: 'Temp' },
    { id: 'fans' as const, label: 'Fan Speeds', short: 'Fans' },
  ];

  const isTraining = (type: TrainingTarget['type'], key?: number | string) =>
    trainingTarget?.type === type && trainingTarget?.key === key;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-slate-50/15 select-none p-4 md:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-16 lg:top-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[9999] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <span className="text-xs font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <span className="truncate">Brand Management</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            Pair an IR receiver, train remote pulses, then save the brand profile.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Brand
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        <div className="lg:col-span-4 flex flex-col min-h-0 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Saved Brands</h3>
            <span className="text-[10px] font-bold text-slate-400">{brands.length} profiles</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
            {loadingBrands ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-bold gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : brands.length > 0 ? (
              brands.map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => handleEditBrand(brand)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    editingBrandId === brand.id
                      ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{brand.name}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                        ID {brand.configureId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBrand(brand.id, e)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-slate-400 border border-dashed border-slate-200 rounded-2xl px-4 text-center">
                <Layers className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-bold text-slate-800 text-xs">No Brand Profiles Registered</p>
                <p className="text-[10px] text-slate-500 mt-1">Configure a receiver to begin decoding</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex-1 min-h-0 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 shrink-0">
            <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
              {editingBrandId ? 'View Brand Profile' : 'Add Brand & Train Remote'}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-semibold leading-normal">
              Configure generates a pairing code → ESP connects over MQTT → map IR pulses → Save Brand.
            </p>
          </div>

          <form onSubmit={handleSaveBrand} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 md:p-5 space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Receiver Device ID (pairing code)
                  </label>
                  <div className="flex gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <div className="flex-1 flex items-center pl-2 gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <input
                        type="text"
                        value={formConfigureId}
                        readOnly
                        className="w-full min-w-0 bg-transparent outline-none border-none text-xs font-mono font-bold tracking-widest text-slate-800 placeholder:text-slate-400"
                        placeholder="Click Configure"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConfigureDevice}
                      disabled={isConfiguring || Boolean(editingBrandId)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[10px] sm:text-[11px] font-bold rounded-xl transition-colors shadow-sm shrink-0 cursor-pointer active:scale-95"
                    >
                      {isConfiguring ? '…' : 'Configure'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    ESP MQTT: <span className="font-mono">ackit/configure/{'{code}'}/status</span> &amp; <span className="font-mono">…/ir</span>
                  </p>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Brand Name</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value.toLowerCase())}
                      className="w-full bg-transparent outline-none border-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 pl-1"
                      placeholder="e.g. daikin, lg, mitsubishi"
                      required
                      disabled={Boolean(editingBrandId)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex border-b border-slate-100 gap-1 sm:gap-4 overflow-x-auto scrollbar-hide shrink-0 -mx-1 px-1">
                  {subTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`relative shrink-0 px-2 sm:px-1 pb-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        activeSubTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <span className="sm:hidden">{tab.short}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      {activeSubTab === tab.id && (
                        <motion.div layoutId="activeSubTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1 min-h-[180px] sm:min-h-[220px]">
                  {activeSubTab === 'power-modes' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Main Power Codes</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {([
                            { type: 'powerOn' as const, label: 'Device ON', value: signals.powerOn },
                            { type: 'powerOff' as const, label: 'Device OFF', value: signals.powerOff },
                          ]).map(({ type, label, value }) => (
                            <div key={type} className="relative group">
                              <button
                                type="button"
                                onClick={() => startTraining(type, undefined, label)}
                                className={`w-full py-3 px-3 sm:px-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                                  isTraining(type)
                                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50 text-blue-800'
                                    : value
                                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Power className={`w-4 h-4 shrink-0 ${value ? 'text-emerald-500' : 'text-slate-400'}`} />
                                  <span className="shrink-0">{label}</span>
                                </div>
                                {value ? (
                                  <span className="font-mono text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold truncate max-w-[45%]">
                                    {formatPulsePreview(value)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md shrink-0">Map</span>
                                )}
                              </button>
                              {value && !editingBrandId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => verifyCommand(type, undefined, label, e)}
                                    title={`Test ${label} on the AC`}
                                    className="absolute -top-1.5 right-9 w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearCode(type)}
                                    className="absolute -top-1.5 right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AC Operating Modes</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {([
                            { key: 'cool', label: 'Cool', icon: Snowflake, color: 'bg-blue-50/30 text-blue-800' },
                            { key: 'heat', label: 'Heat', icon: Sun, color: 'bg-orange-50/30 text-orange-800' },
                            { key: 'dry', label: 'Dry', icon: Droplets, color: 'bg-teal-50/30 text-teal-800' },
                            { key: 'fan', label: 'Fan Only', icon: Fan, color: 'bg-slate-50 text-slate-800' },
                            { key: 'auto', label: 'Smart Auto', icon: Sparkles, color: 'bg-violet-50/30 text-violet-800' },
                          ] as const).map(({ key, label, icon: IconComponent, color }) => {
                            const hasSignal = !!signals.modes[key];
                            return (
                              <div key={key} className="relative group flex flex-col h-full">
                                <button
                                  type="button"
                                  onClick={() => startTraining('mode', key, `Operating Mode: ${label}`)}
                                  className={`w-full min-h-[5.5rem] py-3 px-1 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-between flex-1 gap-1.5 cursor-pointer active:scale-[0.98] ${
                                    isTraining('mode', key)
                                      ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50 text-blue-800'
                                      : hasSignal
                                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                                        : `${color} shadow-sm border-slate-100 hover:border-slate-200`
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/20">
                                    <IconComponent className={`w-4 h-4 ${hasSignal && !isTraining('mode', key) ? 'text-white' : 'text-slate-500'}`} />
                                  </div>
                                  <span className="text-[11px] font-bold tracking-tight block leading-none">{label}</span>
                                  <div className="w-full px-1">
                                    {hasSignal ? (
                                      <span className={`font-mono text-[8px] px-1 py-0.5 rounded block truncate ${hasSignal && !isTraining('mode', key) ? 'bg-black/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {formatPulsePreview(signals.modes[key])}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Map</span>
                                    )}
                                  </div>
                                </button>
                                {hasSignal && !editingBrandId && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => verifyCommand('mode', key, `Mode ${label}`, e)}
                                      title={`Test ${label} on the AC`}
                                      className="absolute -top-1.5 right-8 w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => clearCode('mode', key)}
                                      className="absolute -top-1.5 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'temperatures' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold">
                          Select a temperature, then press that degree on the AC remote. Raw IR pulses are saved for 16°C – 30°C.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5 py-1">
                        {ALL_TEMPERATURES.map((temp) => {
                          const hasSignal = !!signals.temperatures[temp];
                          return (
                            <div key={temp} className="relative group min-w-0">
                              <button
                                type="button"
                                onClick={() => startTraining('temperature', temp, `${temp}°C Command`)}
                                className={`w-full px-2 sm:px-3 py-2.5 text-[11px] sm:text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 ${
                                  isTraining('temperature', temp)
                                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50 text-blue-800'
                                    : hasSignal
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                                title={hasSignal ? `Pulse: ${signals.temperatures[temp]}` : `Map ${temp}°C`}
                              >
                                <span>{temp}°C</span>
                                {hasSignal ? <Check className="w-3 h-3 shrink-0" /> : null}
                              </button>
                              {hasSignal && !editingBrandId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => verifyCommand('temperature', temp, `${temp}°C`, e)}
                                    title={`Test ${temp}°C on the AC`}
                                    className="absolute -top-1.5 right-4 w-5 h-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearCode('temperature', temp)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'fans' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                        {([
                          { key: 'low', label: 'Low' },
                          { key: 'medium', label: 'Medium' },
                          { key: 'high', label: 'High' },
                          { key: 'ultra', label: 'Ultra' },
                          { key: 'turbo', label: 'Turbo' },
                        ] as const).map(({ key, label }) => {
                          const hasSignal = !!signals.fanSpeeds[key];
                          return (
                            <div key={key} className="relative group flex flex-col h-full">
                              <button
                                type="button"
                                onClick={() => startTraining('fanSpeed', key, `Fan Speed ${label}`)}
                                className={`w-full min-h-[6rem] py-3 px-2 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                                  isTraining('fanSpeed', key)
                                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50 text-blue-800'
                                    : hasSignal
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-xs font-bold">{label}</span>
                                {hasSignal ? (
                                  <span className="font-mono text-[8px] px-1 py-0.5 rounded bg-black/10 truncate max-w-full">
                                    {formatPulsePreview(signals.fanSpeeds[key])}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">Map</span>
                                )}
                              </button>
                              {hasSignal && !editingBrandId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => verifyCommand('fanSpeed', key, `Fan ${label}`, e)}
                                    title={`Test fan ${label} on the AC`}
                                    className="absolute -top-1.5 right-4 w-5 h-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearCode('fanSpeed', key)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 p-3 md:p-4 bg-white">
              {editingBrandId ? (
                <div className="w-full py-3 sm:py-3.5 bg-slate-50 border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>View Only — Saved Brand Profile</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 focus:ring-4 focus:ring-blue-500/20 cursor-pointer active:scale-[0.99] disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <span>Save Brand Profile</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {trainingTarget && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 24 }}
              className="bg-white max-w-sm w-full rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Waiting for IR Pulse</h4>
                <p className="text-xs text-slate-500 px-2 leading-relaxed font-semibold">
                  Press <strong className="text-blue-600">{trainingTarget.label}</strong> on the physical AC remote.
                  Pulses from MQTT topic <span className="font-mono text-[10px]">…/ir</span> will be saved as this command.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTrainingTarget(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
