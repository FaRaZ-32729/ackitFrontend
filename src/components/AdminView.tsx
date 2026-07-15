import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManagerAccount, SubscriptionPlan, Organization, Venue, ACUnit, UserAccount } from '../types';
import { 
  Users, Building2, MapPin, MonitorSmartphone, CreditCard, Cpu, ChevronDown, ChevronUp,
  Activity, Menu, Bell, Search, LogOut, Plus, Sparkles, Crown, Gift, Shield, X, Check,
  ChevronRight, Info, ShieldAlert, Settings, Layers, Sliders, Play, Trash2, Zap, CloudUpload, RefreshCw
} from 'lucide-react';
import { ACBrandManagement } from './ACBrandManagement';
import { motion, AnimatePresence } from 'motion/react';

interface AdminViewProps {
  managers: ManagerAccount[];
  plans: SubscriptionPlan[];
  orgs: Organization[];
  venues: Venue[];
  units: ACUnit[];
  users: UserAccount[];
  activeTab: string;
  onAddManager: (manager: Omit<ManagerAccount, 'id'>) => void;
  onUpdateManagerPlan: (managerId: string, planId: string) => void;
  onAddPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  onLogout?: () => void;
}

export function AdminView({
  managers,
  plans,
  orgs,
  venues,
  units,
  users,
  activeTab,
  onAddManager,
  onUpdateManagerPlan,
  onAddPlan,
  onLogout,
}: AdminViewProps) {
  // Navigation & UI States
  const navigate = useNavigate();
  const currentTab = (activeTab as any) || 'managers';
  const setCurrentTab = (tab: string) => {
    navigate(`/admin/${tab}`);
  };
  const [managementDropdownOpen, setManagementDropdownOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedManagerId, setExpandedManagerId] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [managerDetailTab, setManagerDetailTab] = useState<'sub-users' | 'organizations' | 'venues' | 'devices'>('sub-users');

  // OTA Management States
  const [selectedOtaVersion, setSelectedOtaVersion] = useState<string>('');
  const [otaVersions, setOtaVersions] = useState<string[]>(['3-05-12', '2-11-04', '1-08-00']);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState<string>('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [uploadVersionId, setUploadVersionId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [otaStatus, setOtaStatus] = useState<'idle' | 'updating' | 'success' | 'failed'>('idle');
  const [otaProgress, setOtaProgress] = useState<{ [deviceId: string]: { progress: number; status: string } }>({});
  
  // Dummy online devices (WebSocket simulated list)
  const [onlineDevices, setOnlineDevices] = useState<Array<{
    id: string;
    name: string;
    mac: string;
    currentVersion: string;
    status: 'online' | 'offline';
    lastSeen: string;
    ipAddress: string;
  }>>([
    { id: 'dev-1', name: 'Living Room AC', mac: '58:BF:25:AA:10:92', currentVersion: '2-11-04', status: 'online', lastSeen: 'Just now', ipAddress: '192.168.1.45' },
    { id: 'dev-2', name: 'Conference Room AC', mac: 'BC:DD:C2:1B:4F:9C', currentVersion: '1-08-00', status: 'online', lastSeen: 'Just now', ipAddress: '192.168.1.102' },
    { id: 'dev-3', name: 'Suite 204 AC', mac: 'A4:CF:12:F6:41:8A', currentVersion: '2-11-04', status: 'online', lastSeen: 'Just now', ipAddress: '192.168.1.76' },
    { id: 'dev-4', name: 'Server Room Cooling', mac: 'F0:08:D1:D1:2A:EE', currentVersion: '3-05-12', status: 'online', lastSeen: 'Just now', ipAddress: '192.168.2.14' },
    { id: 'dev-5', name: 'Reception Lobby AC', mac: '24:0A:C4:03:7E:5B', currentVersion: '1-08-00', status: 'online', lastSeen: '3 mins ago', ipAddress: '192.168.1.88' },
  ]);

  // OTA triggers
  const handleStartOta = () => {
    if (selectedDeviceIds.length === 0 || !selectedOtaVersion) return;
    
    setOtaStatus('updating');
    
    // Initialize ota progress map
    const initialProgress: { [id: string]: { progress: number; status: string } } = {};
    selectedDeviceIds.forEach(id => {
      initialProgress[id] = { progress: 0, status: 'Connecting via websocket...' };
    });
    setOtaProgress(initialProgress);

    // Simulate progress updates
    const interval = setInterval(() => {
      setOtaProgress(prev => {
        const next = { ...prev };
        let allCompleted = true;
        
        selectedDeviceIds.forEach(id => {
          const current = next[id];
          if (!current) return;
          
          if (current.progress < 100) {
            allCompleted = false;
            let added = Math.floor(Math.random() * 15) + 12;
            let nextVal = Math.min(100, current.progress + added);
            
            let statusText = 'Downloading package...';
            if (nextVal >= 100) {
              statusText = 'Finished upgrade';
            } else if (nextVal >= 85) {
              statusText = 'Rebooting device...';
            } else if (nextVal >= 60) {
              statusText = 'Flashing sector block...';
            } else if (nextVal >= 30) {
              statusText = 'Verifying checksum...';
            }
            
            next[id] = { progress: nextVal, status: statusText };
          }
        });
        
        if (allCompleted) {
          clearInterval(interval);
          setTimeout(() => {
            // Upgrade device currentVersion locally
            setOnlineDevices(devices => 
              devices.map(d => 
                selectedDeviceIds.includes(d.id) 
                  ? { ...d, currentVersion: selectedOtaVersion } 
                  : d
              )
            );
            setOtaStatus('success');
          }, 800);
        }
        
        return next;
      });
    }, 400);
  };

  // Upload firmware
  const handleUploadFirmware = () => {
    if (!uploadVersionId || !uploadFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setOtaVersions(prevVers => {
              if (!prevVers.includes(uploadVersionId)) {
                return [uploadVersionId, ...prevVers];
              }
              return prevVers;
            });
            setSelectedOtaVersion(uploadVersionId);
            setUploadVersionId('');
            setUploadFile(null);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Modals & Sliders
  const [showAddManager, setShowAddManager] = useState(false);
  const [addManagerStep, setAddManagerStep] = useState<'details' | 'success'>('details');
  const [showAddPlan, setShowAddPlan] = useState(false);

  // New Manager Form State
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPlan, setNewManagerPlan] = useState(plans[0]?.id || '');

  // New Plan Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanType, setNewPlanType] = useState<'free' | 'basic' | 'premium' | 'custom'>('basic');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [newPlanDuration, setNewPlanDuration] = useState(30);
  const [newPlanMaxOrgs, setNewPlanMaxOrgs] = useState(0);
  const [newPlanMaxVenues, setNewPlanMaxVenues] = useState(0);
  const [newPlanMaxDevices, setNewPlanMaxDevices] = useState(0);
  const [newPlanMaxUsers, setNewPlanMaxUsers] = useState(0);
  const [newPlanVisibility, setNewPlanVisibility] = useState<string[]>(['daily', 'monthly']);

  const handleAddManager = () => {
    if (!newManagerName || !newManagerEmail) return;
    onAddManager({
      name: newManagerName,
      email: newManagerEmail,
      status: 'pending',
      planId: newManagerPlan,
    });
    setAddManagerStep('success');
    setTimeout(() => {
      closeAddManagerModal();
    }, 2500);
  };

  const closeAddManagerModal = () => {
    setShowAddManager(false);
    setTimeout(() => {
      setAddManagerStep('details');
      setNewManagerName('');
      setNewManagerEmail('');
    }, 300);
  };

  const handleAddPlan = () => {
    if (!newPlanName) return;
    onAddPlan({
      name: newPlanName,
      maxOrgs: newPlanMaxOrgs,
      maxVenues: newPlanMaxVenues,
      maxDevices: newPlanMaxDevices,
      reportVisibility: newPlanVisibility as any,
      planType: newPlanType,
      description: newPlanDescription,
      pricePkr: newPlanPrice,
      durationDays: newPlanDuration,
      maxUsers: newPlanMaxUsers,
    });
    setShowAddPlan(false);
    
    // Reset Form State
    setNewPlanName('');
    setNewPlanType('basic');
    setNewPlanDescription('');
    setNewPlanPrice(0);
    setNewPlanDuration(30);
    setNewPlanMaxOrgs(0);
    setNewPlanMaxVenues(0);
    setNewPlanMaxDevices(0);
    setNewPlanMaxUsers(0);
    setNewPlanVisibility(['daily', 'monthly']);
  };

  const toggleVisibility = (v: string) => {
    setNewPlanVisibility((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const toggleManager = (id: string) => {
    setExpandedManagerId(expandedManagerId === id ? null : id);
  };

  // Stats Calculations
  const totalManagersCount = managers.length;
  const activeManagersCount = managers.filter(m => m.status === 'active').length;
  const inactiveManagersCount = managers.filter(m => m.status === 'inactive' || m.status === 'pending').length;

  // Sidebar Menu Config
  const sidebarItems = [
    { id: 'managers', label: 'Managers', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'devices', label: 'Devices', icon: MonitorSmartphone },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* Header / Brand */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 tracking-wider">IOTIFY</h4>
          <span className="text-[9px] font-bold text-slate-400 block tracking-widest uppercase">ADMIN CONSOLE</span>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 py-6 px-4 space-y-7 overflow-y-auto">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
            Platform
          </span>
          
          {/* Management Dropdown Section */}
          <div className="space-y-1">
            <button
              onClick={() => setManagementDropdownOpen(!managementDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Management</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${managementDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Indented Dropdown Items */}
            <AnimatePresence initial={false}>
              {managementDropdownOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pl-3 space-y-1 overflow-hidden"
                >
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id as any);
                          setMobileSidebarOpen(false);
                          setSelectedManagerId(null);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Standalone items */}
          <div className="space-y-1 pt-1">
            {/* OTA Management */}
            <button
              onClick={() => {
                setCurrentTab('ota-management');
                setMobileSidebarOpen(false);
                setSelectedManagerId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentTab === 'ota-management'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Zap className={`w-4 h-4 ${currentTab === 'ota-management' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>OTA Management</span>
            </button>

            {/* Brand Management */}
            <button
              onClick={() => {
                setCurrentTab('ac-brands');
                setMobileSidebarOpen(false);
                setSelectedManagerId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentTab === 'ac-brands'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Cpu className={`w-4 h-4 ${currentTab === 'ac-brands' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Brand Management</span>
            </button>

            {/* Plan Management */}
            <button
              onClick={() => {
                setCurrentTab('plans');
                setMobileSidebarOpen(false);
                setSelectedManagerId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                currentTab === 'plans'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${currentTab === 'plans' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Plan Management</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            SA
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-800 truncate">Super Admin</h5>
            <span className="text-[10px] font-medium text-slate-400 block truncate">admin@iotify.io</span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex bg-slate-50/50 overflow-hidden text-slate-800">
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:block w-64 border-r border-slate-100 bg-white shrink-0 h-full">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar (Slide-in Drawer) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white z-50 md:hidden h-full shadow-xl"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header / Nav */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            {currentTab === 'managers' && selectedManagerId ? (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm font-semibold">
                <button
                  onClick={() => setSelectedManagerId(null)}
                  className="hover:text-slate-600 transition-colors"
                >
                  Managers
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-800 font-bold">
                  {managers.find((m) => m.id === selectedManagerId)?.name}
                </span>
              </div>
            ) : (
              <h2 className="text-base font-black text-slate-800 capitalize tracking-tight font-sans">
                {currentTab === 'ac-brands' 
                  ? 'AC Brand Management' 
                  : currentTab === 'ota-management'
                  ? 'OTA Management'
                  : currentTab === 'plans'
                  ? 'Plan Management'
                  : currentTab}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            </button>
            <div className="w-px h-5 bg-slate-100 mx-1" />
            <span className="text-xs font-bold text-slate-400">v1.2.0</span>
          </div>
        </header>

        {/* Dynamic Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6">
          
          {/* TAB: MANAGERS */}
          {currentTab === 'managers' && (
            <div className="space-y-6">
              {(() => {
                if (selectedManagerId) {
                  const selectedManager = managers.find((m) => m.id === selectedManagerId);
                  if (!selectedManager) return null;

                  const selectedManagerOrgs = orgs.filter((o) => o.managerId === selectedManagerId);
                  const selectedManagerVenues = venues.filter((v) => selectedManagerOrgs.some((o) => o.id === v.orgId));
                  const selectedManagerUnits = units.filter((u) => selectedManagerVenues.some((v) => v.id === u.venueId));
                  const selectedManagerUsers = users.filter((u) => u.managerId === selectedManagerId);
                  const selectedManagerPlan = plans.find((p) => p.id === selectedManager.planId);

                  const orgsLimit = selectedManagerPlan?.maxOrgs || 0;
                  const venuesLimit = selectedManagerPlan?.maxVenues || 0;
                  const devicesLimit = selectedManagerPlan?.maxDevices || 0;
                  const usersLimit = selectedManagerPlan?.maxUsers || 0;

                  const orgsPct = orgsLimit > 0 ? Math.min(100, Math.round((selectedManagerOrgs.length / orgsLimit) * 100)) : 0;
                  const venuesPct = venuesLimit > 0 ? Math.min(100, Math.round((selectedManagerVenues.length / venuesLimit) * 100)) : 0;
                  const devicesPct = devicesLimit > 0 ? Math.min(100, Math.round((selectedManagerUnits.length / devicesLimit) * 100)) : 0;
                  const usersPct = usersLimit > 0 ? Math.min(100, Math.round((selectedManagerUsers.length / usersLimit) * 100)) : 0;

                  return (
                    <div className="space-y-6">
                      {/* PROFILE CARD */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 text-lg font-bold">
                          {selectedManager.name ? selectedManager.name.slice(0, 2).toUpperCase() : 'M'}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-slate-800">{selectedManager.name}</h4>
                          <p className="text-sm text-slate-400 font-semibold">{selectedManager.email}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {selectedManagerPlan ? selectedManagerPlan.name : 'No Plan'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                              selectedManager.status === 'active'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : selectedManager.status === 'pending'
                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${selectedManager.status === 'active' ? 'bg-emerald-500' : selectedManager.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                              {selectedManager.status === 'pending' ? 'Pending' : selectedManager.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PLAN USAGE CARD */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-black text-slate-800 tracking-wide uppercase">Plan usage</h4>
                          <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {selectedManagerPlan ? selectedManagerPlan.name : 'No Plan'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-2">
                          {/* Column 1: Organizations */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Building2 className="w-4 h-4" />
                              <span className="text-xs font-bold">Organizations</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">{selectedManagerOrgs.length}</span>
                              <span className="text-xs text-slate-400 font-semibold">/{orgsLimit || '—'}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${orgsPct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">{orgsPct}% used</span>
                          </div>

                          {/* Column 2: Venues */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="w-4 h-4" />
                              <span className="text-xs font-bold">Venues</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">{selectedManagerVenues.length}</span>
                              <span className="text-xs text-slate-400 font-semibold">/{venuesLimit || '—'}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${venuesPct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">{venuesPct}% used</span>
                          </div>

                          {/* Column 3: Devices */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MonitorSmartphone className="w-4 h-4" />
                              <span className="text-xs font-bold">Devices</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">{selectedManagerUnits.length}</span>
                              <span className="text-xs text-slate-400 font-semibold">/{devicesLimit || '—'}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${devicesPct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">{devicesPct}% used</span>
                          </div>

                          {/* Column 4: Users */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Users className="w-4 h-4" />
                              <span className="text-xs font-bold">Users</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">{selectedManagerUsers.length}</span>
                              <span className="text-xs text-slate-400 font-semibold">/{usersLimit || '—'}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${usersPct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">{usersPct}% used</span>
                          </div>
                        </div>
                      </div>

                      {/* TABS HEADER */}
                      <div className="border-b border-slate-100 flex gap-6 mt-8">
                        {(['sub-users', 'organizations', 'venues', 'devices'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setManagerDetailTab(tab)}
                            className={`py-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 capitalize ${
                              managerDetailTab === tab
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {tab === 'sub-users' ? <Users className="w-4 h-4" /> : tab === 'organizations' ? <Building2 className="w-4 h-4" /> : tab === 'venues' ? <MapPin className="w-4 h-4" /> : <MonitorSmartphone className="w-4 h-4" />}
                            {tab === 'sub-users' ? 'Sub-users' : tab}
                          </button>
                        ))}
                      </div>

                      {/* SUB-TAB CONTENTS */}
                      <div className="mt-4">
                        {managerDetailTab === 'sub-users' && (
                          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                                  <th className="py-3 px-5">USER</th>
                                  <th className="py-3 px-4">ROLE</th>
                                  <th className="py-3 px-4">ORGS</th>
                                  <th className="py-3 px-4">VENUES</th>
                                  <th className="py-3 px-4">DEVICES</th>
                                  <th className="py-3 px-4">STATUS</th>
                                  <th className="py-3 px-4"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedManagerUsers.map((u) => {
                                  const userVenues = venues.filter((v) => u.assignedVenueIds?.includes(v.id));
                                  const userOrgs = orgs.filter((o) => userVenues.some((v) => v.orgId === o.id));
                                  const initials = u.name ? u.name.slice(0, 2).toUpperCase() : 'U';
                                  return (
                                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                                      <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                            {initials}
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-bold text-slate-800">{u.name}</h5>
                                            <p className="text-xs text-slate-400 font-semibold">{u.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-4">
                                        <span className="px-2 py-0.5 bg-indigo-50/50 border border-indigo-100/30 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                                          manage
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {userOrgs.length}
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {userVenues.length}
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {units.filter((unit) => u.assignedVenueIds?.includes(unit.venueId)).length}
                                      </td>
                                      <td className="py-4 px-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 bg-emerald-50 text-emerald-700 capitalize">
                                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                          Active
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 text-right text-slate-400">
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                      </td>
                                    </tr>
                                  );
                                })}
                                {selectedManagerUsers.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="py-8 text-center text-sm font-medium text-slate-400">
                                      No sub-users registered under this manager.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {managerDetailTab === 'organizations' && (
                          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                                  <th className="py-3 px-5">ORGANIZATION</th>
                                  <th className="py-3 px-4">VENUES</th>
                                  <th className="py-3 px-4">DEVICES</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedManagerOrgs.map((org) => {
                                  const orgVenues = venues.filter((v) => v.orgId === org.id);
                                  const orgDevices = units.filter((u) => orgVenues.some((v) => v.id === u.venueId));
                                  return (
                                    <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                                      <td className="py-4 px-5 text-sm font-bold text-slate-900">
                                        {org.name}
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {orgVenues.length}
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {orgDevices.length}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {selectedManagerOrgs.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="py-8 text-center text-sm font-medium text-slate-400">
                                      No organizations registered under this manager.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {managerDetailTab === 'venues' && (
                          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                                  <th className="py-3 px-5">VENUE</th>
                                  <th className="py-3 px-4">ORGANIZATION</th>
                                  <th className="py-3 px-4">DEVICES</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedManagerVenues.map((venue) => {
                                  const org = orgs.find((o) => o.id === venue.orgId);
                                  const venueDevices = units.filter((u) => u.venueId === venue.id);
                                  return (
                                    <tr key={venue.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                                      <td className="py-4 px-5 text-sm font-bold text-slate-900">
                                        {venue.name}
                                      </td>
                                      <td className="py-4 px-4 text-xs font-bold text-slate-500">
                                        {org ? org.name : 'Unknown Org'}
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {venueDevices.length}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {selectedManagerVenues.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="py-8 text-center text-sm font-medium text-slate-400">
                                      No venues registered under this manager.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {managerDetailTab === 'devices' && (
                          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                                  <th className="py-3 px-5">AC UNIT</th>
                                  <th className="py-3 px-4">VENUE</th>
                                  <th className="py-3 px-4">MODEL</th>
                                  <th className="py-3 px-4">TEMPERATURE</th>
                                  <th className="py-3 px-4">POWER STATUS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedManagerUnits.map((unit) => {
                                  const v = venues.find((venue) => venue.id === unit.venueId);
                                  return (
                                    <tr key={unit.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                                      <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <MonitorSmartphone className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <span className="text-sm font-bold text-slate-900 block">{unit.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                                              {unit.capacityTon ? `${unit.capacityTon} Ton` : 'Capacity N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                        {v ? v.name : 'Not Set'}
                                      </td>
                                      <td className="py-4 px-4 text-xs font-bold text-slate-500">
                                        {unit.brand || 'Generic'}
                                      </td>
                                      <td className="py-4 px-4 text-sm font-black text-slate-800">
                                        {unit.currentTemp}°C
                                      </td>
                                      <td className="py-4 px-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                          unit.isOn
                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                            : 'bg-slate-50 border-slate-100 text-slate-500'
                                        }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${unit.isOn ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`} />
                                          {unit.isOn ? 'Active' : 'Standby'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {selectedManagerUnits.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-400">
                                      No devices registered under this manager.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Card 1 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total managers</span>
                          <span className="text-2xl font-black text-slate-800">{totalManagersCount}</span>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Active</span>
                          <span className="text-2xl font-black text-slate-800">{activeManagersCount}</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Inactive / Pending</span>
                          <span className="text-2xl font-black text-slate-800">{inactiveManagersCount}</span>
                        </div>
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Title Header with Add button */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">All managers</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Click a manager to view their account details and usage</p>
                      </div>
                      <button
                        onClick={() => setShowAddManager(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Manager
                      </button>
                    </div>

                    {/* Table list */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                            <th className="py-3 px-5">Manager</th>
                            <th className="py-3 px-4">Plan</th>
                            <th className="py-3 px-4">Orgs</th>
                            <th className="py-3 px-4">Venues</th>
                            <th className="py-3 px-4">Devices</th>
                            <th className="py-3 px-4">Users</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {managers.map((manager) => {
                            const managerOrgs = orgs.filter((o) => o.managerId === manager.id);
                            const managerVenues = venues.filter((v) => managerOrgs.some((o) => o.id === v.orgId));
                            const managerUnits = units.filter((u) => managerVenues.some((v) => v.id === u.venueId));
                            const managerUsers = users.filter((u) => u.managerId === manager.id);
                            const plan = plans.find((p) => p.id === manager.planId);

                            const orgsLimit = plan?.maxOrgs || 0;
                            const venuesLimit = plan?.maxVenues || 0;
                            const devicesLimit = plan?.maxDevices || 0;
                            const usersLimit = plan?.maxUsers || 0;

                            const orgsPct = orgsLimit > 0 ? Math.min(100, (managerOrgs.length / orgsLimit) * 100) : 0;
                            const venuesPct = venuesLimit > 0 ? Math.min(100, (managerVenues.length / venuesLimit) * 100) : 0;
                            const devicesPct = devicesLimit > 0 ? Math.min(100, (managerUnits.length / devicesLimit) * 100) : 0;
                            const usersPct = usersLimit > 0 ? Math.min(100, (managerUsers.length / usersLimit) * 100) : 0;

                            const initials = manager.name ? manager.name.slice(0, 2).toUpperCase() : 'M';

                            return (
                              <tr
                                key={manager.id}
                                onClick={() => {
                                  setSelectedManagerId(manager.id);
                                  setManagerDetailTab('sub-users');
                                }}
                                className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors cursor-pointer"
                              >
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                      {initials}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-slate-800">{manager.name}</h5>
                                      <p className="text-xs text-slate-400 font-semibold">{manager.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    {plan ? plan.name : 'No Plan'}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <span>{managerOrgs.length}</span>
                                    <span className="text-[10px] text-slate-400">/{orgsLimit || '∞'}</span>
                                  </div>
                                  <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                                    <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${orgsPct}%` }} />
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <span>{managerVenues.length}</span>
                                    <span className="text-[10px] text-slate-400">/{venuesLimit || '∞'}</span>
                                  </div>
                                  <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                                    <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${venuesPct}%` }} />
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <span>{managerUnits.length}</span>
                                    <span className="text-[10px] text-slate-400">/{devicesLimit || '∞'}</span>
                                  </div>
                                  <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                                    <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${devicesPct}%` }} />
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <span>{managerUsers.length}</span>
                                    <span className="text-[10px] text-slate-400">/{usersLimit || '∞'}</span>
                                  </div>
                                  <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                                    <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${usersPct}%` }} />
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${
                                    manager.status === 'active'
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                      : manager.status === 'pending'
                                      ? 'bg-amber-50 border-amber-100 text-amber-700'
                                      : 'bg-slate-50 border-slate-100 text-slate-600'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${manager.status === 'active' ? 'bg-emerald-500' : manager.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                                    {manager.status === 'pending' ? 'Pending' : manager.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: ORGANIZATIONS */}
          {currentTab === 'organizations' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Total organizations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total organizations</span>
                    <span className="text-2xl font-black text-slate-800">{orgs.length}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 2: Total venues */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total venues</span>
                    <span className="text-2xl font-black text-slate-800">{venues.length}</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 3: Total devices */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total devices</span>
                    <span className="text-2xl font-black text-slate-800">{units.length}</span>
                  </div>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <MonitorSmartphone className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">All organizations</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Every organization across all managers on the platform</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-5">ORGANIZATION</th>
                      <th className="py-3 px-4">MANAGER</th>
                      <th className="py-3 px-4">VENUES</th>
                      <th className="py-3 px-4">DEVICES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((org) => {
                      const m = managers.find((mgr) => mgr.id === org.managerId);
                      const orgVenues = venues.filter((v) => v.orgId === org.id);
                      const orgDevices = units.filter((u) => orgVenues.some((v) => v.id === u.venueId));
                      return (
                        <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                          <td className="py-4 px-5 text-sm font-bold text-slate-900">
                            {org.name}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-bold text-slate-800 block">
                              {m ? m.name : 'Unknown Manager'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                              {m ? m.email : 'No email'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-slate-800">
                            {orgVenues.length}
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-slate-800">
                            {orgDevices.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: VENUES */}
          {currentTab === 'venues' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Total venues */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total venues</span>
                    <span className="text-2xl font-black text-slate-800">{venues.length}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 2: With devices */}
                {(() => {
                  const venuesWithDevices = venues.filter((v) => units.some((u) => u.venueId === v.id)).length;
                  const emptyVenues = venues.length - venuesWithDevices;
                  return (
                    <>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">With devices</span>
                          <span className="text-2xl font-black text-slate-800">{venuesWithDevices}</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                          <MonitorSmartphone className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Card 3: Empty venues */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Empty venues</span>
                          <span className="text-2xl font-black text-slate-800">{emptyVenues}</span>
                        </div>
                        <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
                          <MapPin className="w-4 h-4" />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">All venues</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Every venue across all organizations on the platform</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-5">VENUE</th>
                      <th className="py-3 px-4">ORGANIZATION</th>
                      <th className="py-3 px-4">DEVICES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue) => {
                      const org = orgs.find((o) => o.id === venue.orgId);
                      const venueDevices = units.filter((u) => u.venueId === venue.id);
                      return (
                        <tr key={venue.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                          <td className="py-4 px-5 text-sm font-bold text-slate-900">
                            {venue.name}
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-500">
                            {org ? org.name : 'Unknown Org'}
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-slate-800">
                            {venueDevices.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DEVICES */}
          {currentTab === 'devices' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Total devices */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total devices</span>
                    <span className="text-2xl font-black text-slate-800">{units.length}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MonitorSmartphone className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 2: Active */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Active</span>
                    <span className="text-2xl font-black text-slate-800">
                      {units.filter((u) => u.isOn).length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 3: Standby */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Standby</span>
                    <span className="text-2xl font-black text-slate-800">
                      {units.filter((u) => !u.isOn).length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">All devices</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Every IoT device deployed across the platform</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-5">AC UNIT</th>
                      <th className="py-3 px-4">VENUE</th>
                      <th className="py-3 px-4">MODEL</th>
                      <th className="py-3 px-4">TEMPERATURE</th>
                      <th className="py-3 px-4">POWER STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => {
                      const v = venues.find((ven) => ven.id === unit.venueId);
                      return (
                        <tr key={unit.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <MonitorSmartphone className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-slate-900 block">{unit.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{unit.capacityTon ? `${unit.capacityTon} Ton` : 'Capacity N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-bold text-slate-800">
                            {v ? v.name : 'Not Set'}
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-500">
                            {unit.brand || 'Generic'}
                          </td>
                          <td className="py-4 px-4 text-sm font-black text-slate-800">
                            {unit.currentTemp}°C
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              unit.isOn
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${unit.isOn ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`} />
                              {unit.isOn ? 'Active' : 'Standby'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AC BRAND MANAGEMENT */}
          {currentTab === 'ac-brands' && (
            <div className="space-y-6">
              <ACBrandManagement />
            </div>
          )}

          {/* TAB: PLAN MANAGEMENT */}
          {currentTab === 'plans' && (
            <div className="space-y-6">
              {/* Plan Cards Top Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Subscription Plans</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Control pricing structures, cycle limits, and report visibility tiers</p>
                </div>
                <button
                  onClick={() => setShowAddPlan(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Plan
                </button>
              </div>

              {/* Grid of plans (cards style) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const TypeIcon = plan.planType === 'free' ? Gift : plan.planType === 'premium' ? Crown : plan.planType === 'custom' ? Sparkles : Shield;
                  return (
                    <div key={plan.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:border-slate-300">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900 leading-tight">{plan.name}</h4>
                              {plan.planType && (
                                <div className="flex items-center gap-1 mt-1">
                                  <TypeIcon className="w-3 h-3 text-indigo-500" />
                                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 capitalize">
                                    {plan.planType} Type
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {plan.pricePkr !== undefined && (
                            <div className="text-right">
                              <span className="text-base font-black text-slate-900">
                                Rs. {plan.pricePkr}
                              </span>
                              <span className="text-[9px] block text-slate-400 font-bold mt-0.5">
                                / {plan.durationDays || 30} Days
                              </span>
                            </div>
                          )}
                        </div>

                        {plan.description && (
                          <p className="text-xs text-slate-500 mb-4 bg-slate-50/55 p-2.5 rounded-lg border border-slate-100 font-medium">
                            {plan.description}
                          </p>
                        )}
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-semibold">Organizations limit</span>
                            <span className="font-bold text-slate-800">{plan.maxOrgs || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-semibold">Venues limit</span>
                            <span className="font-bold text-slate-800">{plan.maxVenues || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-semibold">Devices limit</span>
                            <span className="font-bold text-slate-800">{plan.maxDevices || 'Unlimited'}</span>
                          </div>
                          {plan.maxUsers !== undefined && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-semibold">Users limit</span>
                              <span className="font-bold text-slate-800">{plan.maxUsers || 'Unlimited'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Reports Access</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.reportVisibility.map((v) => (
                            <span key={v} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[9px] rounded-lg capitalize">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: OTA MANAGEMENT */}
          {currentTab === 'ota-management' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: OTA Dashboard */}
              <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[580px] h-full">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">OTA Management</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Select devices and choose version to perform OTA</p>
                  </div>
                </div>

                {/* Form Controls / Inputs */}
                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  {/* Search Input (Replaces device type select) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Search Devices
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={deviceSearchQuery}
                        onChange={(e) => setDeviceSearchQuery(e.target.value)}
                        placeholder="Search devices by name, MAC, or IP address..."
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-100/80 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                      {deviceSearchQuery && (
                        <button
                          onClick={() => setDeviceSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Version ID Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Version ID
                    </label>
                    <div className="relative">
                      <select
                        value={selectedOtaVersion}
                        onChange={(e) => setSelectedOtaVersion(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-100/80 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select version</option>
                        {otaVersions.map((v) => (
                          <option key={v} value={v}>
                            v{v}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Device List Section */}
                  <div className="space-y-2 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Device List
                      </span>
                      {onlineDevices.length > 0 && otaStatus !== 'updating' && otaStatus !== 'success' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = onlineDevices.filter(d => 
                                d.name.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
                                d.mac.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
                                d.ipAddress.includes(deviceSearchQuery)
                              );
                              const filteredIds = filtered.map(d => d.id);
                              const allSelected = filteredIds.every(id => selectedDeviceIds.includes(id));
                              if (allSelected) {
                                setSelectedDeviceIds(selectedDeviceIds.filter(id => !filteredIds.includes(id)));
                              } else {
                                setSelectedDeviceIds([...new Set([...selectedDeviceIds, ...filteredIds])]);
                              }
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Toggle Filtered
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Websocket Simulated Online List */}
                    <div className="border border-slate-100 rounded-xl bg-slate-50/20 p-2 overflow-hidden flex-1 min-h-[220px] flex flex-col justify-between">
                      {otaStatus === 'updating' ? (
                        /* OTA PROGRESS VIEW */
                        <div className="space-y-4 p-2 overflow-y-auto flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              OTA Update in progress...
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Real-Time Socket Logs
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {onlineDevices.filter(d => selectedDeviceIds.includes(d.id)).map((d) => {
                              const devProgress = otaProgress[d.id] || { progress: 0, status: 'Initializing...' };
                              return (
                                <div key={d.id} className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <div>
                                      <span className="font-bold text-slate-800 block">{d.name}</span>
                                      <span className="text-[9px] text-slate-400 font-bold tracking-tight">{d.mac}</span>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      devProgress.progress === 100 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    }`}>
                                      {devProgress.progress}%
                                    </span>
                                  </div>
                                  
                                  {/* Progress bar container */}
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                      style={{ width: `${devProgress.progress}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-bold">
                                    <span className="text-indigo-600">{devProgress.status}</span>
                                    <span className="text-slate-400">Targeting v{selectedOtaVersion}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : otaStatus === 'success' ? (
                        /* OTA SUCCESS VIEW */
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                            <Check className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800">OTA Completed Successfully!</h4>
                            <p className="text-xs text-slate-400 font-semibold mt-1">
                              Selected devices have been successfully upgraded to v{selectedOtaVersion}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOtaStatus('idle');
                              setSelectedDeviceIds([]);
                              setSelectedOtaVersion('');
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Back to Device List
                          </button>
                        </div>
                      ) : (
                        /* NORMAL DEVICE SELECTION LIST */
                        <div className="flex-1 flex flex-col">
                          {(() => {
                            const filtered = onlineDevices.filter(d => 
                              d.name.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
                              d.mac.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
                              d.ipAddress.includes(deviceSearchQuery)
                            );
                            
                            if (filtered.length === 0) {
                              return (
                                <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
                                  <svg className="w-8 h-8 text-slate-300 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L8.464 8.464m-4.243 8.464a8.96 8.96 0 01-2.307-5.118H2v-2h2.014A8.96 8.96 0 016.321 4.69l1.414 1.414" />
                                  </svg>
                                  <span className="text-xs font-black text-slate-800">
                                    No online Temperature Humidity devices
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold mt-1">
                                    Devices appear here when connected
                                  </span>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 flex-1">
                                {filtered.map((d) => {
                                  const isSelected = selectedDeviceIds.includes(d.id);
                                  return (
                                    <div 
                                      key={d.id} 
                                      onClick={() => {
                                        if (selectedDeviceIds.includes(d.id)) {
                                          setSelectedDeviceIds(selectedDeviceIds.filter(id => id !== d.id));
                                        } else {
                                          setSelectedDeviceIds([...selectedDeviceIds, d.id]);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'border-indigo-200 bg-indigo-50/30' 
                                          : 'border-slate-100 bg-white hover:border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Checkbox */}
                                        <div className="relative flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="w-3.5 h-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                                          />
                                        </div>
                                        
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-800">{d.name}</span>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700">
                                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                              Online
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-400">
                                            <span>MAC: {d.mac}</span>
                                            <span>•</span>
                                            <span>IP: {d.ipAddress}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="text-right">
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                          v{d.currentVersion}
                                        </span>
                                        <span className="text-[9px] block text-slate-400 font-bold mt-0.5">{d.lastSeen}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats and Trigger */}
                  {otaStatus !== 'success' && otaStatus !== 'updating' && (
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                      {/* Left Block */}
                      <div className="bg-slate-50 border border-slate-100/50 rounded-xl px-4 py-2 flex flex-col justify-center min-w-[120px]">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-tight">Devices online</span>
                        <span className="text-2xl font-black text-slate-800 leading-none mt-1">
                          {selectedDeviceIds.length.toString().padStart(2, '0')}
                          <span className="text-xs font-bold text-slate-400"> / {onlineDevices.length.toString().padStart(2, '0')}</span>
                        </span>
                      </div>

                      {/* Right Block Button */}
                      <button
                        type="button"
                        onClick={handleStartOta}
                        disabled={selectedDeviceIds.length === 0 || !selectedOtaVersion}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                          selectedDeviceIds.length > 0 && selectedOtaVersion
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Start OTA
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Upload Firmware */}
              <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[580px] h-full">
                <div>
                  {/* Header */}
                  <div className="flex items-start gap-3.5 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <CloudUpload className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Upload firmware</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Deploy a new OTA binary to your device fleet</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-5">
                    {/* VERSION ID field */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Version ID
                      </label>
                      <input
                        type="text"
                        value={uploadVersionId}
                        onChange={(e) => setUploadVersionId(e.target.value)}
                        placeholder="e.g. 3-05-12"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-100/85 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                      <span className="text-[10px] font-semibold text-slate-400 block mt-1">
                        Format: major-minor-patch (e.g. 3-05-12)
                      </span>
                    </div>

                    {/* FIRMWARE FILE upload zone */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Firmware File <span className="text-[9px] text-slate-400 lowercase font-medium">.bin / .ota / .hex • max 50 MB</span>
                      </label>
                      
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer.files;
                          if (files && files[0]) {
                            setUploadFile(files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 transition-all ${
                          uploadFile 
                            ? 'border-indigo-500 bg-indigo-50/10' 
                            : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center text-center space-y-3">
                          {isUploading ? (
                            <div className="space-y-3 w-full max-w-[200px]">
                              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-indigo-700 block">Uploading binary...</span>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold block">{uploadProgress}% uploaded</span>
                              </div>
                            </div>
                          ) : uploadFile ? (
                            <div className="space-y-2">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block truncate max-w-[240px]">{uploadFile.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUploadFile(null)}
                                className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider flex items-center gap-1 mx-auto mt-2 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove File
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-xl bg-slate-100/80 text-slate-400 flex items-center justify-center">
                                <CloudUpload className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-xs font-black text-slate-800 block">Drag & drop firmware</span>
                                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">or click to browse from files</span>
                              </div>
                              
                              <label className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer inline-block">
                                Browse file
                                <input
                                  type="file"
                                  accept=".bin,.ota,.hex"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setUploadFile(e.target.files[0]);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-slate-100 pt-5 mt-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadVersionId('');
                      setUploadFile(null);
                    }}
                    className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadFirmware}
                    disabled={!uploadVersionId || !uploadFile || isUploading}
                    className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-wider text-xs text-center transition-all shadow-md ${
                      uploadVersionId && uploadFile && !isUploading
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                    }`}
                  >
                    Upload firmware
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE NEW PLAN SLIDING DRAWER - opens on right side */}
      <AnimatePresence>
        {showAddPlan && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPlan(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Slide over Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l border-slate-100 z-50 flex flex-col shadow-2xl h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create new plan</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Fill in the details below</p>
                </div>
                <button
                  onClick={() => setShowAddPlan(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Plan Type Grid */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Plan Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'free', title: 'Free', subtitle: 'Trial plan (15 days fixed)', icon: Gift },
                      { id: 'basic', title: 'Basic', subtitle: 'Entry-level paid plan', icon: Shield },
                      { id: 'premium', title: 'Premium', subtitle: 'Full-featured plan', icon: Crown },
                      { id: 'custom', title: 'Custom', subtitle: 'Assigned to specific user', icon: Sparkles },
                    ].map((pt) => {
                      const Icon = pt.icon;
                      const isActive = newPlanType === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setNewPlanType(pt.id as any)}
                          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 shadow-[0_0_0_1px_rgba(79,70,229,0.1)]'
                              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className={`text-sm font-bold ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>
                              {pt.title}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-400 leading-normal">
                            {pt.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Plan Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                    placeholder="e.g. Pro Monthly"
                  />
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Description <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <textarea
                    value={newPlanDescription}
                    onChange={(e) => setNewPlanDescription(e.target.value)}
                    rows={2.5}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all resize-none"
                    placeholder="Brief description of this plan..."
                  />
                </div>

                {/* Price and Duration Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Price (PKR)
                    </label>
                    <input
                      type="number"
                      value={newPlanPrice}
                      onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={newPlanDuration}
                      onChange={(e) => setNewPlanDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                      min={1}
                    />
                  </div>
                </div>

                {/* Plan Limits Section */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Plan Limits
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Max Orgs */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Max Organizations
                        </span>
                      </div>
                      <input
                        type="number"
                        value={newPlanMaxOrgs}
                        onChange={(e) => setNewPlanMaxOrgs(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        min={0}
                      />
                    </div>

                    {/* Max Venues */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Max Venues
                        </span>
                      </div>
                      <input
                        type="number"
                        value={newPlanMaxVenues}
                        onChange={(e) => setNewPlanMaxVenues(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        min={0}
                      />
                    </div>

                    {/* Max Devices */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MonitorSmartphone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Max Devices
                        </span>
                      </div>
                      <input
                        type="number"
                        value={newPlanMaxDevices}
                        onChange={(e) => setNewPlanMaxDevices(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        min={0}
                      />
                    </div>

                    {/* Max Users */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Max Users
                        </span>
                      </div>
                      <input
                        type="number"
                        value={newPlanMaxUsers}
                        onChange={(e) => setNewPlanMaxUsers(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Report Visibility */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Report Visibility
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['hourly', 'daily', 'weekly', 'monthly', 'yearly'].map((v) => {
                      const isSelected = newPlanVisibility.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleVisibility(v)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Panel */}
              <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPlan}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  + Create plan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD NEW MANAGER SLIDING DRAWER - consistent drawer experience */}
      <AnimatePresence>
        {showAddManager && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddManagerModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Slide over Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l border-slate-100 z-50 flex flex-col shadow-2xl h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {addManagerStep === 'details' ? "Create New Manager" : "Success"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    {addManagerStep === 'details' ? "Invite a manager to administer organizations" : "Process completed successfully"}
                  </p>
                </div>
                <button
                  onClick={closeAddManagerModal}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {addManagerStep === 'details' ? (
                  <>
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={newManagerName}
                        onChange={(e) => setNewManagerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        placeholder="e.g. Yousuf Karim"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newManagerEmail}
                        onChange={(e) => setNewManagerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        placeholder="manager@iotify.io"
                      />
                    </div>

                    {/* Initial Plan Assignment */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Initial Plan Assignment
                      </label>
                      <select
                        value={newManagerPlan}
                        onChange={(e) => setNewManagerPlan(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} Plan
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Invite Sent Successfully!</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1.5 max-w-sm mx-auto leading-relaxed">
                        An invite message has been sent to the manager's email. They will appear as "Pending Onboarding" until they activate their account.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Panel (Only if filling details) */}
              {addManagerStep === 'details' && (
                <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={closeAddManagerModal}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddManager}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Invite Manager
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
