import React, { useEffect, useState } from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
import { Users, Building2, MapPin, MonitorSmartphone, Plus, Check, ChevronRight, ShieldAlert, Loader2, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Modal } from '../../components/ui/Modal';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import axios from 'axios';

/** Admin managers page — markup/CSS preserved from legacy AdminView */
export function ManagersPage() {
  const {
    fetchManagers,
    managersLoading,
    managersError,
    fetchPlans,
    fetchUsersByManager,
    fetchAllOrganizations,
    fetchAllVenues,
    usersLoading,
    usersError,
    suspendManager,
    deleteManager,
  } = useAppContext();
  const {
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
    handleAddManager, closeAddManagerModal, handleAddPlan,
    toggleManager,
    totalManagersCount, activeManagersCount, inactiveManagersCount,
  } = useAdminWorkspace();

  const [showDeleteManager, setShowDeleteManager] = useState(false);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    void Promise.allSettled([fetchManagers(), fetchPlans()]);
  }, [fetchManagers, fetchPlans]);

  useEffect(() => {
    if (!selectedManagerId) return;
    void Promise.allSettled([
      fetchUsersByManager(selectedManagerId),
      fetchAllOrganizations(),
      fetchAllVenues(),
    ]);
  }, [
    selectedManagerId,
    fetchUsersByManager,
    fetchAllOrganizations,
    fetchAllVenues,
  ]);

  const openEditStatus = () => {
    const manager = managers.find((m) => m.id === selectedManagerId);
    if (!manager) return;
    setEditStatus(manager.status === 'active' ? 'active' : 'inactive');
    setSuspensionReason('');
    setActionError('');
    setShowEditStatus(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedManagerId) return;
    if (editStatus === 'inactive' && !suspensionReason.trim()) {
      setActionError('Suspension reason is required when deactivating a manager');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await suspendManager(
        selectedManagerId,
        editStatus === 'active',
        editStatus === 'inactive' ? suspensionReason.trim() : undefined
      );
      setShowEditStatus(false);
      setSuspensionReason('');
    } catch (err) {
      let message = 'Failed to update manager status';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message || message;
      }
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedManagerId) return;
    setActionLoading(true);
    setActionError('');
    try {
      await deleteManager(selectedManagerId);
      setShowDeleteManager(false);
      setSelectedManagerId(null);
    } catch (err) {
      let message = 'Failed to delete manager';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message || message;
      }
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
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
                              <div className="space-y-1 flex-1 min-w-0">
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
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={openEditStatus}
                                  className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                  title="Edit status"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError('');
                                    setShowDeleteManager(true);
                                  }}
                                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Delete manager"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                                  {usersError && (
                                    <div className="m-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                                      {usersError}
                                    </div>
                                  )}
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
                                      {usersLoading && selectedManagerUsers.length === 0 && (
                                        <tr>
                                          <td colSpan={7} className="py-8 text-center">
                                            <div className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium">
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              Loading sub-users…
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                      {selectedManagerUsers.map((u) => {
                                        const userVenues = venues.filter((v) => u.assignedVenueIds?.includes(v.id));
                                        const userOrgCount =
                                          u.organizationIds?.length ||
                                          orgs.filter((o) =>
                                            (u.organizationIds || []).includes(o.id) ||
                                            userVenues.some((v) => v.orgId === o.id)
                                          ).length;
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
                                                user
                                              </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                              {userOrgCount}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                              {u.assignedVenueIds?.length || userVenues.length}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-bold text-slate-800">
                                              {units.filter((unit) => u.assignedVenueIds?.includes(unit.venueId)).length}
                                            </td>
                                            <td className="py-4 px-4">
                                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                                u.status === 'active'
                                                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                                  : u.status === 'pending'
                                                    ? 'border-amber-100 bg-amber-50 text-amber-700'
                                                    : 'border-slate-100 bg-slate-50 text-slate-500'
                                              }`}>
                                                <span className={`w-1 h-1 rounded-full ${
                                                  u.status === 'active'
                                                    ? 'bg-emerald-500'
                                                    : u.status === 'pending'
                                                      ? 'bg-amber-500'
                                                      : 'bg-slate-400'
                                                }`} />
                                                {u.status === 'pending' ? 'Pending' : u.status}
                                              </span>
                                            </td>
                                            <td className="py-4 px-4 text-right text-slate-400">
                                              <ChevronRight className="w-4 h-4 ml-auto" />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {!usersLoading && selectedManagerUsers.length === 0 && (
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

                          {managersError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                              {managersError}
                            </div>
                          )}
      
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
                                {managersLoading && managers.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading managers...
                                      </span>
                                    </td>
                                  </tr>
                                )}
                                {!managersLoading && managers.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="py-12 text-center text-xs font-semibold text-slate-400">
                                      No managers found
                                    </td>
                                  </tr>
                                )}
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

      <Modal
        isOpen={showEditStatus}
        onClose={() => {
          if (actionLoading) return;
          setShowEditStatus(false);
          setActionError('');
          setSuspensionReason('');
        }}
        title="Edit Manager Status"
      >
        <div className="space-y-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <CustomDropdown
              value={editStatus}
              onChange={(v) => {
                setEditStatus(v as 'active' | 'inactive');
                setActionError('');
                if (v === 'active') setSuspensionReason('');
              }}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          {editStatus === 'inactive' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Suspension Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={3}
                placeholder="Explain why this manager is being deactivated…"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              {actionError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                setShowEditStatus(false);
                setActionError('');
                setSuspensionReason('');
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading || (editStatus === 'inactive' && !suspensionReason.trim())}
              onClick={() => {
                void handleSaveStatus();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Status'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteManager}
        onClose={() => {
          if (actionLoading) return;
          setShowDeleteManager(false);
          setActionError('');
        }}
        title="Delete Manager"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Are you sure you want to delete this manager? This will also remove their organizations, venues, devices, and sub-users. This action cannot be undone.
            </p>
          </div>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              {actionError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                setShowDeleteManager(false);
                setActionError('');
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                void handleConfirmDelete();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Manager'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
