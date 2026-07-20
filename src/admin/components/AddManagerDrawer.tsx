import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';

/** Root-level admin drawer (legacy markup/CSS unchanged) */
export function AddManagerDrawer() {
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
    isCreatingManager, createManagerError,
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

  return (
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
    
                        {createManagerError && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                            {createManagerError}
                          </div>
                        )}
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
                        disabled={isCreatingManager}
                        className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAddManager()}
                        disabled={isCreatingManager}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        {isCreatingManager ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending Invite...
                          </>
                        ) : (
                          'Invite Manager'
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
  );
}
