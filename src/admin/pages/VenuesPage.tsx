import React, { useEffect } from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { MapPin, MonitorSmartphone, Loader2 } from 'lucide-react';

/** Admin venues page — markup/CSS preserved from legacy AdminView */
export function VenuesPage() {
  const {
    fetchAllVenues,
    fetchAllOrganizations,
    venuesLoading,
    venuesError,
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

  useEffect(() => {
    void Promise.allSettled([fetchAllVenues(), fetchAllOrganizations()]);
  }, [fetchAllVenues, fetchAllOrganizations]);

  return (
    <>
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

                    {venuesError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                        {venuesError}
                      </div>
                    )}
      
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
                          {venuesLoading && venues.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-10 text-center">
                                <div className="inline-flex items-center gap-2 text-slate-400 text-xs font-semibold">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading venues…
                                </div>
                              </td>
                            </tr>
                          )}
                          {!venuesLoading && venues.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-10 text-center text-xs font-semibold text-slate-400">
                                No venues found
                              </td>
                            </tr>
                          )}
                          {venues.map((venue) => {
                            const org = orgs.find((o) => o.id === venue.orgId);
                            const venueDevices = units.filter((u) => u.venueId === venue.id);
                            return (
                              <tr key={venue.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                                <td className="py-4 px-5 text-sm font-bold text-slate-900">
                                  {venue.name}
                                </td>
                                <td className="py-4 px-4 text-xs font-bold text-slate-500">
                                  {org?.name || venue.orgName || 'Unknown Org'}
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
    </>
  );
}
