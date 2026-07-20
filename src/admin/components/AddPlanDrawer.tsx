import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Building2, MapPin, MonitorSmartphone, Sparkles, Crown, Gift, Shield, X, Loader2 } from 'lucide-react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';

/** Root-level admin drawer (legacy markup/CSS unchanged) */
export function AddPlanDrawer() {
  const {
    showAddPlan, setShowAddPlan,
    newPlanName, setNewPlanName,
    newPlanType, setNewPlanType,
    newPlanDescription, setNewPlanDescription,
    newPlanPrice, setNewPlanPrice,
    newPlanDuration, setNewPlanDuration,
    newPlanMaxOrgs, setNewPlanMaxOrgs,
    newPlanMaxVenues, setNewPlanMaxVenues,
    newPlanMaxDevices, setNewPlanMaxDevices,
    newPlanMaxUsers, setNewPlanMaxUsers,
    newPlanAssignedEmail, setNewPlanAssignedEmail,
    isCreatingPlan, createPlanError,
    handleAddPlan,
  } = useAdminWorkspace();

  return (
          <AnimatePresence>
            {showAddPlan && (
              <>
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isCreatingPlan && setShowAddPlan(false)}
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
                      onClick={() => !isCreatingPlan && setShowAddPlan(false)}
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
                              onClick={() => setNewPlanType(pt.id as 'free' | 'basic' | 'premium' | 'custom')}
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
                        rows={3}
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
                          value={newPlanType === 'free' ? 15 : newPlanDuration}
                          onChange={(e) => setNewPlanDuration(Number(e.target.value))}
                          disabled={newPlanType === 'free'}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all disabled:bg-slate-50 disabled:text-slate-400"
                          min={1}
                        />
                      </div>
                    </div>

                    {/* Assign custom plan to manager */}
                    {newPlanType === 'custom' && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Assign to Manager
                        </label>
                        <input
                          type="email"
                          value={newPlanAssignedEmail}
                          onChange={(e) => setNewPlanAssignedEmail(e.target.value)}
                          placeholder="manager@example.com"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm font-semibold transition-all"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
                          Enter the manager email to create and assign this custom plan.
                        </p>
                      </div>
                    )}
    
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
                            min={1}
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
                            min={1}
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
                            min={1}
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
                            min={1}
                          />
                        </div>
                      </div>
                    </div>

                    {createPlanError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                        {createPlanError}
                      </div>
                    )}
                  </div>
    
                  {/* Bottom Sticky Action Panel */}
                  <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-3 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => !isCreatingPlan && setShowAddPlan(false)}
                      disabled={isCreatingPlan}
                      className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAddPlan()}
                      disabled={isCreatingPlan}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      {isCreatingPlan ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        '+ Create plan'
                      )}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
  );
}
