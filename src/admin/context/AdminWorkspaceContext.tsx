import React, { createContext, useContext, useState } from 'react';
import { ACUnit, ManagerAccount, Organization, SubscriptionPlan, UserAccount, Venue } from '../../types';

export interface AdminWorkspaceProps {
  managers: ManagerAccount[];
  plans: SubscriptionPlan[];
  orgs: Organization[];
  venues: Venue[];
  units: ACUnit[];
  users: UserAccount[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onAddManager: (manager: Omit<ManagerAccount, 'id'>) => void;
  onUpdateManagerPlan: (managerId: string, planId: string) => void;
  onAddPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  onLogout?: () => void;
}

type AdminWorkspaceValue = ReturnType<typeof useAdminWorkspaceValue>;

const AdminWorkspaceContext = createContext<AdminWorkspaceValue | null>(null);

function useAdminWorkspaceValue(props: AdminWorkspaceProps) {
  const {
    managers,
    plans,
    orgs,
    venues,
    units,
    users,
    activeTab,
    onTabChange,
    onAddManager,
    onUpdateManagerPlan,
    onAddPlan,
    onLogout,
  } = props;

  // Navigation & UI States
  const currentTab = (activeTab as any) || 'managers';
  const setCurrentTab = (tab: string) => {
    onTabChange?.(tab);
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

  return {
    managers, plans, orgs, venues, units, users, activeTab, onTabChange,
    onAddManager, onUpdateManagerPlan, onAddPlan, onLogout,
    currentTab, setCurrentTab,
    managementDropdownOpen, setManagementDropdownOpen,
    mobileSidebarOpen, setMobileSidebarOpen,
    expandedManagerId, setExpandedManagerId,
    selectedManagerId, setSelectedManagerId,
    managerDetailTab, setManagerDetailTab,
    selectedOtaVersion, setSelectedOtaVersion,
    otaVersions, setOtaVersions,
    deviceSearchQuery, setDeviceSearchQuery,
    selectedDeviceIds, setSelectedDeviceIds,
    uploadVersionId, setUploadVersionId,
    uploadFile, setUploadFile,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    otaStatus, setOtaStatus,
    otaProgress, setOtaProgress,
    onlineDevices, setOnlineDevices,
    handleStartOta, handleUploadFirmware,
    showAddManager, setShowAddManager,
    addManagerStep, setAddManagerStep,
    showAddPlan, setShowAddPlan,
    newManagerName, setNewManagerName,
    newManagerEmail, setNewManagerEmail,
    newManagerPlan, setNewManagerPlan,
    newPlanName, setNewPlanName,
    newPlanType, setNewPlanType,
    newPlanDescription, setNewPlanDescription,
    newPlanPrice, setNewPlanPrice,
    newPlanDuration, setNewPlanDuration,
    newPlanMaxOrgs, setNewPlanMaxOrgs,
    newPlanMaxVenues, setNewPlanMaxVenues,
    newPlanMaxDevices, setNewPlanMaxDevices,
    newPlanMaxUsers, setNewPlanMaxUsers,
    newPlanVisibility, setNewPlanVisibility,
    handleAddManager, closeAddManagerModal, handleAddPlan,
    toggleVisibility, toggleManager,
    totalManagersCount, activeManagersCount, inactiveManagersCount,
  };
}

export function AdminWorkspaceProvider({
  children,
  ...props
}: AdminWorkspaceProps & { children: React.ReactNode }) {
  const value = useAdminWorkspaceValue(props);
  return (
    <AdminWorkspaceContext.Provider value={value}>
      {children}
    </AdminWorkspaceContext.Provider>
  );
}

export function useAdminWorkspace() {
  const ctx = useContext(AdminWorkspaceContext);
  if (!ctx) {
    throw new Error('useAdminWorkspace must be used within AdminWorkspaceProvider');
  }
  return ctx;
}
