import React, { useEffect } from 'react';
import { useAdminWorkspace } from '../context/AdminWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { Building2, MapPin, MonitorSmartphone, Loader2 } from 'lucide-react';

/** Admin organizations page — markup/CSS preserved from legacy AdminView */
export function OrganizationsPage() {
  const {
    fetchAllOrganizations,
    fetchAllVenues,
    fetchManagers,
    orgsLoading,
    orgsError,
  } = useAppContext();

  const {
    managers, orgs, venues, units,
  } = useAdminWorkspace();

  useEffect(() => {
    void Promise.allSettled([
      fetchAllOrganizations(),
      fetchAllVenues(),
      fetchManagers(),
    ]);
  }, [fetchAllOrganizations, fetchAllVenues, fetchManagers]);

  return (
    <>
      <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Card 1: Total organizations */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total organizations</span>
                          <span className="text-2xl font-black text-slate-800">{orgs.length}</span>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
      
                      {/* Card 2: Total venues */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total venues</span>
                          <span className="text-2xl font-black text-slate-800">{venues.length}</span>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                          <MapPin className="w-4 h-4" />
                        </div>
                      </div>
      
                      {/* Card 3: Total devices */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Total devices</span>
                          <span className="text-2xl font-black text-slate-800">{units.length}</span>
                        </div>
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                          <MonitorSmartphone className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
      
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">All organizations</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Every organization across all managers on the platform</p>
                    </div>

                    {orgsError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                        {orgsError}
                      </div>
                    )}
      
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                            <th className="py-3 px-5">ORGANIZATION</th>
                            <th className="py-3 px-4">MANAGER</th>
                            <th className="py-3 px-4">VENUES</th>
                            <th className="py-3 px-4">DEVICES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orgsLoading && orgs.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center">
                                <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading organizations...
                                </span>
                              </td>
                            </tr>
                          )}
                          {!orgsLoading && orgs.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-xs font-semibold text-slate-400">
                                No organizations found
                              </td>
                            </tr>
                          )}
                          {orgs.map((org) => {
                            const m = managers.find((mgr) => mgr.id === org.managerId);
                            const orgVenues = venues.filter((v) => v.orgId === org.id);
                            const orgDevices = units.filter((u) => orgVenues.some((v) => v.id === u.venueId));
                            return (
                              <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-all">
                                <td className="py-4 px-5 text-sm font-bold text-slate-900">
                                  {org.name}
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm font-bold text-slate-800 block">
                                    {m?.name || org.ownerName || 'Unknown Manager'}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                                    {m?.email || org.ownerEmail || 'No email'}
                                  </span>
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
                        </tbody>
                      </table>
                    </div>
                  </div>
    </>
  );
}
