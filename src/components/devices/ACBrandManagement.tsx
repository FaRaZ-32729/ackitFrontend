import React, { useState, useEffect } from 'react';
import { 
  Cpu, Trash2, Edit2, Play, Check, Copy, Wifi, 
  WifiOff, Power, RefreshCw, Layers, Plus, Info, X, Zap,
  Snowflake, Sun, Droplets, Wind, Sparkles, ChevronRight, Gauge, Fan
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Data model for simplified remote-decoder brands
export interface DecodedBrand {
  id: string;
  name: string;
  deviceId: string;
  apiKey: string;
  status: 'connected' | 'disconnected';
  // Decoded signals mapped (stores simulated hex codes or null if untrained)
  signals: {
    powerOn: string | null;
    powerOff: string | null;
    temperatures: Record<number, string | null>; // Dynamic temperature codes
    fanSpeeds: {
      low: string | null;
      medium: string | null;
      high: string | null;
      ultra: string | null;
      turbo: string | null;
    };
    modes: {
      cool: string | null;
      heat: string | null;
      dry: string | null;
      fan: string | null;
      auto: string | null;
    };
  };
}

const PRESET_BRANDS: DecodedBrand[] = [
  {
    id: 'brand-1',
    name: 'Daikin Smart IoT',
    deviceId: 'DEV-DAI-8821',
    apiKey: 'CSK-DAI-9012-TRK56YK',
    status: 'connected',
    signals: {
      powerOn: '0x11FA80A2',
      powerOff: '0x11FA80A3',
      temperatures: {
        16: '0x11FA16C4', 17: '0x11FA17C4', 18: '0x11FA18C4', 19: '0x11FA19C4',
        20: '0x11FA20C4', 21: '0x11FA21C4', 22: '0x11FA22C4'
      },
      fanSpeeds: {
        low: '0x11FA01F2', medium: '0x11FA02F2', high: '0x11FA03F2', ultra: null, turbo: null
      },
      modes: {
        cool: '0x11FAM01C', heat: '0x11FAM02C', dry: null, fan: null, auto: null
      }
    }
  },
  {
    id: 'brand-2',
    name: 'LG DualInverter Lab',
    deviceId: 'DEV-LG-4402',
    apiKey: 'CSK-LGE-2911-TRK90PX',
    status: 'disconnected',
    signals: {
      powerOn: '0x88BC01A2',
      powerOff: '0x88BC01A3',
      temperatures: {
        16: '0x88BC16E1', 17: '0x88BC17E1', 18: '0x88BC18E1'
      },
      fanSpeeds: {
        low: null, medium: null, high: null, ultra: null, turbo: null
      },
      modes: {
        cool: null, heat: null, dry: null, fan: null, auto: null
      }
    }
  }
];

export function ACBrandManagement() {
  // Store all brands in local storage or fallback to preset
  const [brands, setBrands] = useState<DecodedBrand[]>(() => {
    const cached = localStorage.getItem('iotfiy_decoded_brands');
    return cached ? JSON.parse(cached) : PRESET_BRANDS;
  });

  // Editing state - if null, we are in "Add Brand" mode
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'power-modes' | 'temperatures' | 'fans'>('power-modes');

  // Form Field States
  const [formName, setFormName] = useState('');
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  // Temperatures to display (initially only 4 temperatures to fit perfectly on a single row)
  const [visibleTemps, setVisibleTemps] = useState<number[]>([16, 17, 18, 19]);
  const [showAddTempInput, setShowAddTempInput] = useState(false);
  const [newTempText, setNewTempText] = useState('');

  // Active remote signals map state
  const [signals, setSignals] = useState<DecodedBrand['signals']>({
    powerOn: null,
    powerOff: null,
    temperatures: {
      16: null, 17: null, 18: null, 19: null
    },
    fanSpeeds: { low: null, medium: null, high: null, ultra: null, turbo: null },
    modes: { cool: null, heat: null, dry: null, fan: null, auto: null }
  });

  // Interactive "Decoder Training Mode" state
  const [trainingTarget, setTrainingTarget] = useState<{
    type: 'powerOn' | 'powerOff' | 'temperature' | 'fanSpeed' | 'mode';
    key?: number | string;
    label: string;
  } | null>(null);

  // Feedback states
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto save to local storage
  useEffect(() => {
    localStorage.setItem('iotfiy_decoded_brands', JSON.stringify(brands));
  }, [brands]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to generate a realistic random IR key on connect
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 14; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let i = 0; i < 11; i++) {
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CSK${p1}-2T9TRG${p2}`;
  };

  // Connect / Configure device action
  const handleConfigureDevice = () => {
    if (!formDeviceId.trim()) {
      showToast('Please enter a valid Device ID first', 'error');
      return;
    }
    // Simulate finding & connecting to the receiver module
    setIsDeviceConnected(true);
    if (!formApiKey) {
      setFormApiKey(generateApiKey());
    }
    showToast(`Connected to receiver ${formDeviceId}! Ready to decode.`, 'success');
  };

  // Reset/Clear Form for Adding a new Brand
  const handleResetForm = () => {
    setEditingBrandId(null);
    setActiveSubTab('power-modes');
    setFormName('');
    setFormDeviceId('');
    setFormApiKey('');
    setIsDeviceConnected(false);
    setVisibleTemps([16, 17, 18, 19]);
    setShowAddTempInput(false);
    setNewTempText('');
    setSignals({
      powerOn: null,
      powerOff: null,
      temperatures: {
        16: null, 17: null, 18: null, 19: null
      },
      fanSpeeds: { low: null, medium: null, high: null, ultra: null, turbo: null },
      modes: { cool: null, heat: null, dry: null, fan: null, auto: null }
    });
  };

  // Populate form with existing brand data for editing
  const handleEditBrand = (brand: DecodedBrand) => {
    setEditingBrandId(brand.id);
    setActiveSubTab('power-modes');
    setFormName(brand.name);
    setFormDeviceId(brand.deviceId);
    setFormApiKey(brand.apiKey);
    setIsDeviceConnected(brand.status === 'connected');
    
    // Setup temperatures
    const brandTempKeys = Object.keys(brand.signals.temperatures || {}).map(Number);
    const uniqueTemps = Array.from(new Set([16, 17, 18, 19, ...brandTempKeys])).sort((a, b) => a - b);
    setVisibleTemps(uniqueTemps);
    setShowAddTempInput(false);

    setSignals(JSON.parse(JSON.stringify(brand.signals))); // Deep copy
    showToast(`Loaded remote profile for ${brand.name}`, 'info');
  };

  // Delete brand
  const handleDeleteBrand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBrands(prev => prev.filter(b => b.id !== id));
    showToast('Brand decoder profile removed', 'info');
    if (editingBrandId === id) {
      handleResetForm();
    }
  };

  // Copy API key
  const handleCopyKey = () => {
    if (!formApiKey) return;
    navigator.clipboard.writeText(formApiKey);
    setCopiedKey(true);
    showToast('API Key copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Add Custom Temperature Mode
  const handleAddCustomTemp = () => {
    const tempNum = parseInt(newTempText, 10);
    if (isNaN(tempNum) || tempNum < 15 || tempNum > 35) {
      showToast('Please enter a valid temperature between 15°C and 35°C', 'error');
      return;
    }
    if (visibleTemps.includes(tempNum)) {
      showToast(`${tempNum}°C is already visible!`, 'info');
      return;
    }

    const updatedTemps = [...visibleTemps, tempNum].sort((a, b) => a - b);
    setVisibleTemps(updatedTemps);

    // Initialize in signals
    setSignals(prev => ({
      ...prev,
      temperatures: {
        ...prev.temperatures,
        [tempNum]: prev.temperatures[tempNum] || null
      }
    }));

    showToast(`Added ${tempNum}°C mode. Ready for signal training.`, 'success');
    setNewTempText('');
    setShowAddTempInput(false);

    // Immediately start training for this new temperature!
    startTraining('temperature', tempNum, `${tempNum}°C Command`);
  };

  // Start Training process
  const startTraining = (type: typeof trainingTarget['type'], key?: number | string, label?: string) => {
    if (!isDeviceConnected) {
      showToast('Connect your IR receiver first by clicking "Configure"!', 'error');
      return;
    }
    setTrainingTarget({
      type,
      key,
      label: label || `${type} Command`
    });
  };

  // Simulate receiving IR signal
  const simulateIRReceive = () => {
    if (!trainingTarget) return;

    // Generate random mock IR code
    const mockCodes = ['0x11FA', '0x88BC', '0x22F4', '0x33A1', '0x77CE'];
    const prefix = mockCodes[Math.floor(Math.random() * mockCodes.length)];
    const hexSuffix = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    const finalHex = `${prefix}${hexSuffix}`;

    const { type, key } = trainingTarget;

    setSignals(prev => {
      const updated = { ...prev };
      if (type === 'powerOn') {
        updated.powerOn = finalHex;
      } else if (type === 'powerOff') {
        updated.powerOff = finalHex;
      } else if (type === 'temperature' && typeof key === 'number') {
        updated.temperatures = {
          ...updated.temperatures,
          [key]: finalHex
        };
      } else if (type === 'fanSpeed' && typeof key === 'string') {
        updated.fanSpeeds = {
          ...updated.fanSpeeds,
          [key as keyof typeof updated.fanSpeeds]: finalHex
        };
      } else if (type === 'mode' && typeof key === 'string') {
        updated.modes = {
          ...updated.modes,
          [key as keyof typeof updated.modes]: finalHex
        };
      }
      return updated;
    });

    showToast(`Decoded code: ${finalHex} for ${trainingTarget.label}`, 'success');
    setTrainingTarget(null);
  };

  // Clear a trained code
  const clearCode = (type: typeof trainingTarget['type'], key?: number | string) => {
    setSignals(prev => {
      const updated = { ...prev };
      if (type === 'powerOn') {
        updated.powerOn = null;
      } else if (type === 'powerOff') {
        updated.powerOff = null;
      } else if (type === 'temperature' && typeof key === 'number') {
        const nextTemps = { ...updated.temperatures };
        delete nextTemps[key];
        updated.temperatures = nextTemps;
        // Also remove from visibleTemps if it's not part of the initial 5
        if (key > 20 || key < 16) {
          setVisibleTemps(prevV => prevV.filter(t => t !== key));
        }
      } else if (type === 'fanSpeed' && typeof key === 'string') {
        updated.fanSpeeds[key as keyof typeof updated.fanSpeeds] = null;
      } else if (type === 'mode' && typeof key === 'string') {
        updated.modes[key as keyof typeof updated.modes] = null;
      }
      return updated;
    });
    showToast('Trained signal cleared', 'info');
  };

  // Save/Submit the Brand Configuration
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Brand name is required!', 'error');
      return;
    }
    if (!formDeviceId.trim()) {
      showToast('Device ID is required!', 'error');
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      // Build temperature records currently stored
      const savedTemps: Record<number, string | null> = {};
      visibleTemps.forEach(t => {
        savedTemps[t] = signals.temperatures[t] || null;
      });

      const updatedBrand: DecodedBrand = {
        id: editingBrandId || `brand-${Date.now()}`,
        name: formName.trim(),
        deviceId: formDeviceId.trim(),
        apiKey: formApiKey || generateApiKey(),
        status: isDeviceConnected ? 'connected' : 'disconnected',
        signals: {
          ...signals,
          temperatures: savedTemps
        }
      };

      if (editingBrandId) {
        setBrands(prev => prev.map(b => b.id === editingBrandId ? updatedBrand : b));
        showToast('Brand decoder profile updated successfully!', 'success');
      } else {
        setBrands(prev => [updatedBrand, ...prev]);
        showToast('New Brand decoder profile saved!', 'success');
      }

      setIsSaving(false);
      handleResetForm();
    }, 800);
  };

  const subTabs = [
    { id: 'power-modes' as const, label: 'Power & Modes', short: 'Power' },
    { id: 'temperatures' as const, label: 'Temperatures', short: 'Temp' },
    { id: 'fans' as const, label: 'Fan Speeds', short: 'Fans' },
  ];

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
            <Zap className="w-4 h-4 animate-pulse text-emerald-600 shrink-0" />
            <span className="text-xs font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span className="truncate">Brand Management</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-semibold">
            Map IR remote signals for AC brand compatibility
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetForm}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-blue-600/15 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Brand
        </button>
      </div>

      {/* Split panels — page never scrolls; cards do */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-3 md:gap-4 overflow-hidden">

        {/* Brand directory */}
        <div className="lg:col-span-4 shrink-0 lg:shrink lg:min-h-0 max-h-[38vh] sm:max-h-[42vh] lg:max-h-none bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 shrink-0 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Directory</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {brands.length} profile{brands.length === 1 ? '' : 's'} registered
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3 md:p-4 space-y-2.5">
            {brands.length > 0 ? (
              brands.map((brand, idx) => (
                <div
                  key={brand.id}
                  onClick={() => handleEditBrand(brand)}
                  className={`p-3 sm:p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    editingBrandId === brand.id
                      ? 'bg-blue-50/60 border-blue-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-xs text-slate-500 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate leading-tight">
                        {brand.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${brand.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-slate-400 font-bold tracking-tight">
                          {brand.status === 'connected' ? 'Active Receiver' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditBrand(brand);
                      }}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all shadow-sm"
                      title="Edit Brand Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBrand(brand.id, e)}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:border-red-500 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
                      title="Delete Brand Profile"
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
                <p className="text-[10px] text-slate-500 mt-1">Connect a receiver to begin decoding</p>
              </div>
            )}
          </div>
        </div>

        {/* Decoder / form card */}
        <div className="lg:col-span-8 flex-1 min-h-0 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 shrink-0">
            <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
              {editingBrandId ? 'Modify Brand Decoder' : 'Add Brand & Train Remote'}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-semibold leading-normal">
              Map hardware IR signals to platform commands for automation.
            </p>
          </div>

          <form onSubmit={handleSaveBrand} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 md:p-5 space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Receiver Device ID</label>
                  <div className="flex gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <div className="flex-1 flex items-center pl-2 gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <input
                        type="text"
                        value={formDeviceId}
                        onChange={(e) => setFormDeviceId(e.target.value)}
                        className="w-full min-w-0 bg-transparent outline-none border-none text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                        placeholder="e.g. DEV-AC-101"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConfigureDevice}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-[11px] font-bold rounded-xl transition-colors shadow-sm shrink-0 cursor-pointer active:scale-95"
                    >
                      Configure
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Brand Name</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-transparent outline-none border-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 pl-1"
                      placeholder="e.g. Daikin, LG, Mitsubishi"
                      required
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
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => startTraining('powerOn', undefined, 'Power ON')}
                              className={`w-full py-3 px-3 sm:px-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                                signals.powerOn
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Power className={`w-4 h-4 shrink-0 ${signals.powerOn ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                                <span className="shrink-0">Device ON</span>
                              </div>
                              {signals.powerOn ? (
                                <span className="font-mono text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold truncate max-w-[45%]">
                                  {signals.powerOn}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md shrink-0">Map</span>
                              )}
                            </button>
                            {signals.powerOn && (
                              <button
                                type="button"
                                onClick={() => clearCode('powerOn')}
                                className="absolute -top-1.5 right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => startTraining('powerOff', undefined, 'Power OFF')}
                              className={`w-full py-3 px-3 sm:px-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                                signals.powerOff
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Power className={`w-4 h-4 shrink-0 ${signals.powerOff ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className="shrink-0">Device OFF</span>
                              </div>
                              {signals.powerOff ? (
                                <span className="font-mono text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold truncate max-w-[45%]">
                                  {signals.powerOff}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md shrink-0">Map</span>
                              )}
                            </button>
                            {signals.powerOff && (
                              <button
                                type="button"
                                onClick={() => clearCode('powerOff')}
                                className="absolute -top-1.5 right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AC Operating Modes</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {([
                            { key: 'cool', label: 'Cool', icon: Snowflake, activeBg: 'from-blue-500 to-indigo-600', color: 'bg-blue-50/30 text-blue-800' },
                            { key: 'heat', label: 'Heat', icon: Sun, activeBg: 'from-orange-500 to-amber-600', color: 'bg-orange-50/30 text-orange-800' },
                            { key: 'dry', label: 'Dry', icon: Droplets, activeBg: 'from-teal-500 to-emerald-600', color: 'bg-teal-50/30 text-teal-800' },
                            { key: 'fan', label: 'Fan Only', icon: Fan, activeBg: 'from-slate-500 to-slate-700', color: 'bg-slate-50 text-slate-800' },
                            { key: 'auto', label: 'Smart Auto', icon: Sparkles, activeBg: 'from-violet-500 to-fuchsia-600', color: 'bg-violet-50/30 text-violet-800' }
                          ] as const).map(({ key, label, icon: IconComponent, activeBg, color }) => {
                            const hasSignal = !!signals.modes[key];
                            return (
                              <div key={key} className="relative group flex flex-col h-full">
                                <button
                                  type="button"
                                  onClick={() => startTraining('mode', key, `Operating Mode: ${label}`)}
                                  className={`w-full min-h-[5.5rem] py-3 px-1 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-between flex-1 gap-1.5 cursor-pointer active:scale-[0.98] ${
                                    hasSignal
                                      ? `bg-gradient-to-b ${activeBg} text-white border-transparent shadow-md`
                                      : `${color} shadow-sm border-slate-100 hover:border-slate-200`
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/20">
                                    <IconComponent className={`w-4 h-4 ${hasSignal ? 'text-white' : 'text-slate-500'}`} />
                                  </div>
                                  <span className="text-[11px] font-bold tracking-tight block leading-none">{label}</span>
                                  <div className="w-full px-1">
                                    {hasSignal ? (
                                      <span className="font-mono text-[8px] bg-black/10 px-1 py-0.5 rounded block truncate text-white">
                                        {signals.modes[key]}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Map</span>
                                    )}
                                  </div>
                                </button>
                                {hasSignal && (
                                  <button
                                    type="button"
                                    onClick={() => clearCode('mode', key)}
                                    className="absolute -top-1.5 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
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
                          Configure IR signals for each target temperature to automate thermostat controls.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 py-1">
                        {visibleTemps.map((temp) => {
                          const hasSignal = !!signals.temperatures[temp];
                          return (
                            <div key={temp} className="relative group flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => startTraining('temperature', temp, `${temp}°C Command`)}
                                className={`px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                  hasSignal
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                                title={hasSignal ? `Hex: ${signals.temperatures[temp]}` : `Map ${temp}°C`}
                              >
                                <span>{temp}°C</span>
                                {hasSignal ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-medium bg-slate-50 px-1 rounded">Map</span>
                                )}
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => clearCode('temperature', temp)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}

                        {showAddTempInput ? (
                          <div className="flex items-center gap-1 bg-blue-50/80 p-1 border border-blue-200 rounded-xl flex-shrink-0">
                            <input
                              type="number"
                              min="15"
                              max="35"
                              value={newTempText}
                              onChange={(e) => setNewTempText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomTemp();
                                }
                              }}
                              placeholder="deg"
                              className="w-12 bg-white px-1.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 outline-none text-center"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomTemp}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="Confirm"
                            >
                              <Check className="w-3 h-3 font-bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddTempInput(false);
                                setNewTempText('');
                              }}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAddTempInput(true)}
                            className="w-10 h-10 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                            title="Add Custom Temperature"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSubTab === 'fans' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                        {([
                          { key: 'low', label: 'Low', speedBars: 1, color: 'border-teal-100 text-teal-800 bg-teal-50/10 hover:bg-teal-50/30' },
                          { key: 'medium', label: 'Medium', speedBars: 2, color: 'border-sky-100 text-sky-800 bg-sky-50/10 hover:bg-sky-50/30' },
                          { key: 'high', label: 'High', speedBars: 3, color: 'border-blue-100 text-blue-800 bg-blue-50/10 hover:bg-blue-50/30' },
                          { key: 'ultra', label: 'Ultra', speedBars: 4, color: 'border-indigo-100 text-indigo-800 bg-indigo-50/10 hover:bg-indigo-50/30' },
                          { key: 'turbo', label: 'Turbo', speedBars: 5, color: 'border-orange-100 text-orange-800 bg-orange-50/10 hover:bg-orange-50/30' }
                        ] as const).map(({ key, label, speedBars, color }) => {
                          const hasSignal = !!signals.fanSpeeds[key];
                          return (
                            <div key={key} className="relative group flex flex-col h-full">
                              <button
                                type="button"
                                onClick={() => startTraining('fanSpeed', key, `Fan Speed ${label.toUpperCase()}`)}
                                className={`w-full min-h-[6rem] py-3 px-2 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-between flex-1 gap-2 cursor-pointer active:scale-[0.98] ${
                                  hasSignal
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                                    : `${color} border shadow-sm`
                                }`}
                              >
                                <Fan className={`w-5 h-5 ${
                                  hasSignal 
                                    ? 'text-white' 
                                    : 'text-slate-400 group-hover:text-slate-700'
                                } ${
                                  key === 'turbo' ? 'animate-[spin_0.5s_linear_infinite]' :
                                  key === 'ultra' ? 'animate-[spin_1s_linear_infinite]' :
                                  key === 'high' ? 'animate-[spin_1.5s_linear_infinite]' :
                                  key === 'medium' ? 'animate-[spin_2s_linear_infinite]' :
                                  'animate-[spin_3s_linear_infinite]'
                                }`} />

                                <div className="text-center">
                                  <span className="text-[11px] font-bold uppercase tracking-wider block">{label}</span>
                                  <div className="flex justify-center gap-0.5 mt-1">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <span 
                                        key={idx} 
                                        className={`w-1 h-2 rounded-full ${
                                          idx < speedBars 
                                            ? (hasSignal ? 'bg-white' : 'bg-slate-400') 
                                            : 'bg-slate-200/50'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="w-full">
                                  {hasSignal ? (
                                    <span className="font-mono text-[9px] bg-white/20 px-1 rounded block truncate font-bold">
                                      {signals.fanSpeeds[key]}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Map</span>
                                  )}
                                </div>
                              </button>

                              {hasSignal && (
                                <button
                                  type="button"
                                  onClick={() => clearCode('fanSpeed', key)}
                                  className="absolute -top-1.5 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {formApiKey && (
                <div className="bg-slate-50/70 border border-slate-200 p-3.5 sm:p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Dashboard Connection Key</span>
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase shrink-0">Live IoT Link</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-800 select-all truncate flex-1 leading-none min-w-0">
                      {formApiKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all cursor-pointer shrink-0"
                      title="Copy Connection API Key"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Flash this key on your IR receiver board firmware to map cloud-to-device remote triggers automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-100 p-3 md:p-4 bg-white">
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
                <h4 className="text-sm font-black text-slate-900">Training Signal Target</h4>
                <p className="text-xs text-slate-500 px-2 leading-relaxed font-semibold">
                  Press the <strong className="text-blue-600">{trainingTarget.label}</strong> button on your physical AC remote while pointing it at the IR receiver module.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Interactive Sandbox Test</span>
                <button
                  type="button"
                  onClick={simulateIRReceive}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Simulate Physical Remote Press
                </button>
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
