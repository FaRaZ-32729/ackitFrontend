import React from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
import { Users, Activity, Plus, Sparkles, Crown, Gift, Shield } from 'lucide-react';

/** Admin plans page — markup/CSS preserved from legacy AdminView */
export function PlansPage() {
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
    newPlanVisibility, setNewPlanVisibility,
    handleAddManager, closeAddManagerModal, handleAddPlan,
    toggleVisibility, toggleManager,
    totalManagersCount, activeManagersCount, inactiveManagersCount,
  } = useAdminWorkspace();

  return (
    <>
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
    </>
  );
}
