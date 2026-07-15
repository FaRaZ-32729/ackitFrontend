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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Visual Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[9999] px-4.5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <Zap className="w-4.5 h-4.5 animate-pulse text-emerald-600" />
            <span className="text-xs font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-7 h-7 text-blue-600" />
            Air Conditioner Brand Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure and map infrared remote signals for system-wide brand compatibility.
          </p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Brand List (4 columns) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Directory</h3>
              <p className="text-[10px] text-slate-500 font-semibold">Registered brand remotes</p>
            </div>
            <button
              onClick={handleResetForm}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Brand
            </button>
          </div>

          {/* List Box */}
          <div className="mt-4 space-y-3">
            {brands.length > 0 ? (
              brands.map((brand, idx) => (
                <div
                  key={brand.id}
                  onClick={() => handleEditBrand(brand)}
                  className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    editingBrandId === brand.id 
                      ? 'bg-blue-50/60 border-blue-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
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

                  {/* Tiny clean circular buttons matching user reference */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditBrand(brand);
                      }}
                      className="w-8 h-8 rounded-full border border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all shadow-sm"
                      title="Edit Brand Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteBrand(brand.id, e)}
                      className="w-8 h-8 rounded-full border border-slate-200 hover:border-red-500 bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
                      title="Delete Brand Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <Layers className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-bold text-slate-800 text-xs">No Brand Profiles Registered</p>
                <p className="text-[10px] text-slate-500 mt-1">Connect a receiver to begin decoding</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Add Brand Form & interactive decoder (8 columns) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="pb-4 border-b border-slate-100 shrink-0">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {editingBrandId ? 'Modify Brand Decoder' : 'Add Brand & Train Remote'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Map hardware IR signals to platform commands for automation.
            </p>
          </div>

          <form onSubmit={handleSaveBrand} className="space-y-6 mt-5 flex-1 flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Device ID and Brand Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Device ID + Configure Button */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Receiver Device ID</label>
                  <div className="flex gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-2xl shadow-inner focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <div className="flex-1 flex items-center pl-2 gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <input
                        type="text"
                        value={formDeviceId}
                        onChange={(e) => setFormDeviceId(e.target.value)}
                        className="w-full bg-transparent outline-none border-none text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                        placeholder="e.g. DEV-AC-101"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConfigureDevice}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm shrink-0 cursor-pointer"
                    >
                      Configure
                    </button>
                  </div>
                </div>

                {/* Brand Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Brand Name</label>
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

              {/* Sub-tab Switcher for Signal Mapping */}
              <div className="space-y-3">
                <div className="flex border-b border-slate-100 pb-px gap-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('power-modes')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                      activeSubTab === 'power-modes' ? 'text-blue-600' : 'text-slate-450 hover:text-slate-600'
                    }`}
                  >
                    🔌 Power & Modes
                    {activeSubTab === 'power-modes' && (
                      <motion.div layoutId="activeSubTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('temperatures')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                      activeSubTab === 'temperatures' ? 'text-blue-600' : 'text-slate-450 hover:text-slate-600'
                    }`}
                  >
                    🌡️ Temperatures
                    {activeSubTab === 'temperatures' && (
                      <motion.div layoutId="activeSubTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('fans')}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                      activeSubTab === 'fans' ? 'text-blue-600' : 'text-slate-450 hover:text-slate-600'
                    }`}
                  >
                    💨 Fan Speeds
                    {activeSubTab === 'fans' && (
                      <motion.div layoutId="activeSubTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                </div>

                {/* Sub-tab Contents */}
                <div className="pt-2 min-h-[220px]">
                  
                  {activeSubTab === 'power-modes' && (
                    <div className="space-y-5 animate-fadeIn">
                      {/* Main Power Codes */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Main Power Codes</label>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Power ON Button */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => startTraining('powerOn', undefined, 'Power ON')}
                              className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                signals.powerOn
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Power className={`w-4 h-4 ${signals.powerOn ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                                <span>Device ON</span>
                              </div>
                              {signals.powerOn ? (
                                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-md font-bold">
                                  {signals.powerOn}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">Map</span>
                              )}
                            </button>
                            {signals.powerOn && (
                              <button
                                type="button"
                                onClick={() => clearCode('powerOn')}
                                className="absolute -top-1.5 right-2 w-4.5 h-4.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          {/* Power OFF Button */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => startTraining('powerOff', undefined, 'Power OFF')}
                              className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                signals.powerOff
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Power className={`w-4 h-4 ${signals.powerOff ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span>Device OFF</span>
                              </div>
                              {signals.powerOff ? (
                                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-md font-bold">
                                  {signals.powerOff}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">Map</span>
                              )}
                            </button>
                            {signals.powerOff && (
                              <button
                                type="button"
                                onClick={() => clearCode('powerOff')}
                                className="absolute -top-1.5 right-2 w-4.5 h-4.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AC Operating Modes Map */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">AC Operating Modes Map</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {([
                            { key: 'cool', label: 'Cool', icon: Snowflake, activeBg: 'from-blue-500 to-indigo-650', borderGlow: 'border-blue-150', color: 'bg-blue-50/30 text-blue-800' },
                            { key: 'heat', label: 'Heat', icon: Sun, activeBg: 'from-orange-500 to-amber-600', borderGlow: 'border-orange-150', color: 'bg-orange-50/30 text-orange-800' },
                            { key: 'dry', label: 'Dry', icon: Droplets, activeBg: 'from-teal-500 to-emerald-600', borderGlow: 'border-teal-150', color: 'bg-teal-50/30 text-teal-800' },
                            { key: 'fan', label: 'Fan Only', icon: Fan, activeBg: 'from-slate-500 to-slate-700', borderGlow: 'border-slate-200', color: 'bg-slate-50 text-slate-800' },
                            { key: 'auto', label: 'Smart Auto', icon: Sparkles, activeBg: 'from-purple-500 to-fuchsia-600', borderGlow: 'border-purple-150', color: 'bg-purple-50/30 text-purple-800' }
                          ] as const).map(({ key, label, icon: IconComponent, activeBg, borderGlow, color }) => {
                            const hasSignal = !!signals.modes[key];
                            return (
                              <div key={key} className="relative group flex flex-col h-full">
                                <button
                                  type="button"
                                  onClick={() => startTraining('mode', key, `Operating Mode: ${label}`)}
                                  className={`w-full py-3 px-1 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-between flex-1 gap-2 cursor-pointer ${
                                    hasSignal
                                      ? `bg-gradient-to-b ${activeBg} text-white border-transparent shadow-md scale-[1.02]`
                                      : `${color} ${borderGlow} shadow-sm border-slate-100 hover:border-slate-200`
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner bg-white/20 backdrop-blur-sm">
                                    <IconComponent className={`w-4 h-4 ${hasSignal ? 'text-white' : 'text-slate-550'}`} />
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-bold tracking-tight block leading-none">{label}</span>
                                  </div>
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
                                    className="absolute -top-1.5 right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
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
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Configure IR signals for each target temperature to automate thermostat controls.
                        </p>
                      </div>

                      {/* Temperature buttons + inline add form in a SINGLE row */}
                      <div className="flex flex-wrap items-center gap-2 py-1">
                        {visibleTemps.map((temp) => {
                          const hasSignal = !!signals.temperatures[temp];
                          return (
                            <div key={temp} className="relative group flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => startTraining('temperature', temp, `${temp}°C Command`)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
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
                                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Inline input / + icon inside the single row */}
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
                              className="w-12 bg-white px-1.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 outline-none text-center"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomTemp}
                              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
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
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAddTempInput(true)}
                            className="w-8 h-8 rounded-xl border border-dashed border-slate-350 hover:border-blue-500 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
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
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {([
                          { key: 'low', label: 'Low', speedBars: 1, color: 'border-teal-100 text-teal-850 bg-teal-50/10 hover:bg-teal-50/30' },
                          { key: 'medium', label: 'Medium', speedBars: 2, color: 'border-sky-100 text-sky-855 bg-sky-50/10 hover:bg-sky-50/30' },
                          { key: 'high', label: 'High', speedBars: 3, color: 'border-blue-100 text-blue-855 bg-blue-50/10 hover:bg-blue-50/30' },
                          { key: 'ultra', label: 'Ultra', speedBars: 4, color: 'border-indigo-100 text-indigo-855 bg-indigo-50/10 hover:bg-indigo-50/30' },
                          { key: 'turbo', label: 'Turbo', speedBars: 5, color: 'border-orange-100 text-orange-855 bg-orange-50/10 hover:bg-orange-50/30' }
                        ] as const).map(({ key, label, speedBars, color }) => {
                          const hasSignal = !!signals.fanSpeeds[key];
                          return (
                            <div key={key} className="relative group flex flex-col h-full">
                              <button
                                type="button"
                                onClick={() => startTraining('fanSpeed', key, `Fan Speed ${label.toUpperCase()}`)}
                                className={`w-full py-3.5 px-2 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-between flex-1 gap-2.5 cursor-pointer ${
                                  hasSignal
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.02]'
                                    : `${color} border shadow-sm`
                                }`}
                              >
                                <div className="relative">
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
                                </div>

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
                                  className="absolute -top-1.5 right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10 cursor-pointer"
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
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              {/* Dynamic API Key Display Card */}
              {formApiKey && (
                <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dashboard Connection Key</span>
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">Live IoT Link</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
                    <span className="font-mono text-[11px] font-bold text-slate-800 select-all truncate flex-1 leading-none">
                      {formApiKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all cursor-pointer"
                      title="Copy Connection API Key"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Flash this key on your IR receiver board firmware to map cloud-to-device remote triggers automatically.
                  </p>
                </div>
              )}

              {/* Bottom Form Actions */}
              <div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 focus:ring-4 focus:ring-blue-500/20 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile to Dashboard...</span>
                    </>
                  ) : (
                    <span>Save Brand Profile</span>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>

      </div>

      {/* Modern interactive learning dialog modal (Stardust style) */}
      <AnimatePresence>
        {trainingTarget && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-150 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-bounce">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Training Signal Target</h4>
                <p className="text-xs text-slate-500 px-2 leading-relaxed">
                  Press the <strong className="text-blue-600">{trainingTarget.label}</strong> button on your physical AC remote while pointing it at the IR receiver module.
                </p>
              </div>

              {/* Simulated IR Trigger button */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Interactive Sandbox Test</span>
                <button
                  type="button"
                  onClick={simulateIRReceive}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Simulate Physical Remote Press
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTrainingTarget(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
