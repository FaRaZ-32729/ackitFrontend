import React, { createContext, useContext, useState } from 'react';
import { ACUnit, ManagerAccount, Organization, SubscriptionPlan, UserAccount, Venue } from '../../types';
import type { CreatePlanPayload } from '../../api/planApi';
import axios from 'axios';

export interface AdminWorkspaceProps {
  managers: ManagerAccount[];
  plans: SubscriptionPlan[];
  orgs: Organization[];
  venues: Venue[];
  units: ACUnit[];
  users: UserAccount[];
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onAddManager: (manager: { name: string; email: string }) => Promise<void>;
  onUpdateManagerPlan: (managerId: string, planId: string) => void;
  onAddPlan: (payload: CreatePlanPayload) => Promise<void>;
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
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [createManagerError, setCreateManagerError] = useState('');

  // New Plan Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanType, setNewPlanType] = useState<'free' | 'basic' | 'premium' | 'custom'>('basic');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [newPlanDuration, setNewPlanDuration] = useState(30);
  const [newPlanMaxOrgs, setNewPlanMaxOrgs] = useState(1);
  const [newPlanMaxVenues, setNewPlanMaxVenues] = useState(1);
  const [newPlanMaxDevices, setNewPlanMaxDevices] = useState(1);
  const [newPlanMaxUsers, setNewPlanMaxUsers] = useState(1);
  const [newPlanAssignedEmail, setNewPlanAssignedEmail] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [createPlanError, setCreatePlanError] = useState('');

  const handleAddManager = async () => {
    if (!newManagerName.trim()) {
      setCreateManagerError('Manager name is required');
      return;
    }
    if (!newManagerEmail.trim() || !newManagerEmail.includes('@')) {
      setCreateManagerError('Enter a valid manager email address');
      return;
    }

    setIsCreatingManager(true);
    setCreateManagerError('');
    try {
      await onAddManager({
        name: newManagerName.trim(),
        email: newManagerEmail.trim().toLowerCase(),
      });
      setAddManagerStep('success');
      setTimeout(() => {
        closeAddManagerModal();
      }, 2500);
    } catch (err) {
      let message = 'Failed to create manager';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as {
          message?: string;
          errors?: { message: string }[];
        } | undefined;
        message = data?.errors?.[0]?.message || data?.message || message;
      }
      setCreateManagerError(message);
    } finally {
      setIsCreatingManager(false);
    }
  };

  const closeAddManagerModal = () => {
    setShowAddManager(false);
    setTimeout(() => {
      setAddManagerStep('details');
      setNewManagerName('');
      setNewManagerEmail('');
      setCreateManagerError('');
    }, 300);
  };

  const resetPlanForm = () => {
    setNewPlanName('');
    setNewPlanType('basic');
    setNewPlanDescription('');
    setNewPlanPrice(0);
    setNewPlanDuration(30);
    setNewPlanMaxOrgs(1);
    setNewPlanMaxVenues(1);
    setNewPlanMaxDevices(1);
    setNewPlanMaxUsers(1);
    setNewPlanAssignedEmail('');
    setCreatePlanError('');
  };

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) {
      setCreatePlanError('Plan name is required');
      return;
    }
    if (newPlanType === 'custom' && !newPlanAssignedEmail.trim()) {
      setCreatePlanError('Please select a manager to assign this custom plan');
      return;
    }

    const durationDays = newPlanType === 'free' ? 15 : newPlanDuration;
    const payload: CreatePlanPayload = {
      name: newPlanName.trim(),
      type: newPlanType,
      price: Number(newPlanPrice) || 0,
      durationDays: Number(durationDays),
      maxOrganizations: Math.max(1, Number(newPlanMaxOrgs) || 1),
      maxVenues: Math.max(1, Number(newPlanMaxVenues) || 1),
      maxDevices: Math.max(1, Number(newPlanMaxDevices) || 1),
      maxUsers: Math.max(1, Number(newPlanMaxUsers) || 1),
    };

    const desc = newPlanDescription.trim();
    if (desc) payload.description = desc;
    if (newPlanType === 'custom') {
      payload.assignedToEmail = newPlanAssignedEmail.trim().toLowerCase();
    }

    setIsCreatingPlan(true);
    setCreatePlanError('');
    try {
      await onAddPlan(payload);
      setShowAddPlan(false);
      resetPlanForm();
    } catch (err) {
      let message = 'Failed to create plan';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string; errors?: { message: string }[] } | undefined;
        message = data?.errors?.[0]?.message || data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setCreatePlanError(message);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const setNewPlanTypeAndDuration = (type: 'free' | 'basic' | 'premium' | 'custom') => {
    setNewPlanType(type);
    if (type === 'free') setNewPlanDuration(15);
    setCreatePlanError('');
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
    isCreatingManager, createManagerError,
    newPlanName, setNewPlanName,
    newPlanType, setNewPlanType: setNewPlanTypeAndDuration,
    newPlanDescription, setNewPlanDescription,
    newPlanPrice, setNewPlanPrice,
    newPlanDuration, setNewPlanDuration,
    newPlanMaxOrgs, setNewPlanMaxOrgs,
    newPlanMaxVenues, setNewPlanMaxVenues,
    newPlanMaxDevices, setNewPlanMaxDevices,
    newPlanMaxUsers, setNewPlanMaxUsers,
    newPlanAssignedEmail, setNewPlanAssignedEmail,
    isCreatingPlan, createPlanError, setCreatePlanError,
    handleAddManager, closeAddManagerModal, handleAddPlan,
    toggleManager,
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
