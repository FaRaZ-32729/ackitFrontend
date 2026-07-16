import React from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
import { MonitorSmartphone, Cpu, Activity } from 'lucide-react';

/** Admin devices page — markup/CSS preserved from legacy AdminView */
export function DevicesPage() {
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
    </>
  );
}
