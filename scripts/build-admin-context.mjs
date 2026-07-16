/**
 * Builds AdminWorkspaceContext from legacy AdminView state/handlers.
 * Run: node scripts/build-admin-context.mjs
 */
import fs from 'fs';

const src = fs.readFileSync('src/components/AdminView.tsx', 'utf8');
const lines = src.split(/\r?\n/);

// State + handlers block (managementDropdownOpen ... inactiveManagersCount), i.e. lines 45-261 (1-indexed)
const internals = lines.slice(44, 261).join('\n');

const contextFile = `import React, { createContext, useContext, useState } from 'react';
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
${internals}

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
`;

fs.mkdirSync('src/admin/context', { recursive: true });
fs.writeFileSync('src/admin/context/AdminWorkspaceContext.tsx', contextFile);
console.log('wrote AdminWorkspaceContext.tsx');
