import React from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
import { ChevronDown, Search, X, Check, Trash2, Zap, CloudUpload, RefreshCw } from 'lucide-react';

/** Admin ota-management page — markup/CSS preserved from legacy AdminView */
export function OtaManagementPage() {
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
    </>
  );
}
