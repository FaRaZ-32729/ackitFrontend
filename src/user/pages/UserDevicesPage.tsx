import React, { useEffect, useRef, useState } from 'react';
import { useUserWorkspace } from '../context/UserWorkspaceContext';
import {
  MonitorSmartphone,
  Plus,
  Edit,
  Trash2,
  Check,
  Copy,
  Building2,
  MapPin,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { getACPowerDraw, type ACUnit, type Venue } from '../../types';
import { AC_BRANDS } from '../constants';
import { getDevicesByVenue } from '../../api/deviceApi';
import { getVenuesByOrganization } from '../../api/venueApi';

/** User devices page — markup/CSS preserved from legacy UserView */
export function UserDevicesPage() {
  const {
    user, orgs, venues,
    onDeleteDevice,
    deviceName, setDeviceName, acBrand, setAcBrand,
    selectedOrgId, setSelectedOrgId, selectedVenueId, setSelectedVenueId,
    editingUnitId, setEditingUnitId, revealApiKey, setRevealApiKey, copied, setCopied,
    handleEditClick, resetForm, handleSave, handleCopy, currentApiKey,
    selectedDeviceVenueId, setSelectedDeviceVenueId,
  } = useUserWorkspace();

  const [listOrgId, setListOrgId] = useState(orgs[0]?.id || '');
  const [listVenueId, setListVenueId] = useState('');
  const [orgVenues, setOrgVenues] = useState<Venue[]>([]);
  const [venueDevices, setVenueDevices] = useState<ACUnit[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const pendingVenueDeepLink = useRef<string | null>(
    selectedDeviceVenueId && selectedDeviceVenueId !== 'all'
      ? selectedDeviceVenueId
      : null
  );

  const assignedVenueIds = user?.assignedVenueIds || [];

  useEffect(() => {
    if (selectedDeviceVenueId && selectedDeviceVenueId !== 'all') {
      pendingVenueDeepLink.current = selectedDeviceVenueId;
    }
  }, [selectedDeviceVenueId]);

  useEffect(() => {
    if (orgs.length === 0) {
      if (listOrgId) setListOrgId('');
      return;
    }

    const deepLinkVenueId = pendingVenueDeepLink.current;
    if (deepLinkVenueId) {
      if (venues.length === 0) return;
      const linkedVenue = venues.find((v) => v.id === deepLinkVenueId);
      if (linkedVenue?.orgId && orgs.some((o) => o.id === linkedVenue.orgId)) {
        if (listOrgId !== linkedVenue.orgId) {
          setListOrgId(linkedVenue.orgId);
        }
        return;
      }
    }

    if (!listOrgId || !orgs.some((o) => o.id === listOrgId)) {
      setListOrgId(orgs[0].id);
    }
  }, [orgs, venues, listOrgId]);

  useEffect(() => {
    let active = true;
    setListVenueId('');
    setOrgVenues([]);
    setVenueDevices([]);
    if (!listOrgId) return () => { active = false; };

    getVenuesByOrganization(listOrgId)
      .then((list) => {
        if (!active) return;
        const filtered =
          assignedVenueIds.length > 0
            ? list.filter((v) => assignedVenueIds.includes(v.id))
            : list;
        setOrgVenues(filtered);

        const deepLinkVenueId = pendingVenueDeepLink.current;
        if (deepLinkVenueId && filtered.some((v) => v.id === deepLinkVenueId)) {
          setListVenueId(deepLinkVenueId);
          pendingVenueDeepLink.current = null;
          setSelectedDeviceVenueId('all');
        } else {
          setListVenueId(filtered[0]?.id || '');
        }
      })
      .catch(() => {
        if (!active) return;
        setOrgVenues([]);
      });

    return () => { active = false; };
  }, [listOrgId, assignedVenueIds.join(','), setSelectedDeviceVenueId]);

  useEffect(() => {
    let active = true;
    setVenueDevices([]);
    if (!listVenueId) {
      setLoadingDevices(false);
      return () => { active = false; };
    }

    setLoadingDevices(true);
    getDevicesByVenue(listVenueId)
      .then((list) => {
        if (!active) return;
        setVenueDevices(list);
      })
      .catch(() => {
        if (!active) return;
        setVenueDevices([]);
      })
      .finally(() => {
        if (active) setLoadingDevices(false);
      });

    return () => { active = false; };
  }, [listVenueId]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
                {/* Page Title Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-shrink-0">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                        <MonitorSmartphone className="w-5 h-5" />
                      </div>
                      Device Core Manager
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure and manage hardware assets for your climate settings</p>
                  </div>
                </div>
      
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
                  {/* Left Section: Devices List */}
                  <div className="lg:col-span-7 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col min-h-0 h-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch flex-shrink-0 mb-4">
                      {/* Organization filter */}
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 px-1.5 uppercase tracking-wide shrink-0">Org:</span>
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={listOrgId}
                          onChange={(e) => setListOrgId(e.target.value)}
                          className="bg-transparent text-[11px] font-black text-slate-700 outline-none border-none py-1 pr-1 cursor-pointer min-w-0 flex-1 truncate"
                        >
                          {orgs.length === 0 && <option value="">No organizations</option>}
                          {orgs.map((org) => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                          ))}
                        </select>
                      </div>
      
                      {/* Venue filter */}
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 px-1.5 uppercase tracking-wide shrink-0">Venue:</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={listVenueId}
                          onChange={(e) => setListVenueId(e.target.value)}
                          className="bg-transparent text-[11px] font-black text-slate-700 outline-none border-none py-1 pr-1 cursor-pointer min-w-0 flex-1 truncate"
                        >
                          {orgVenues.length === 0 && <option value="">No venues</option>}
                          {orgVenues.map((venue) => (
                            <option key={venue.id} value={venue.id}>{venue.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
      
                    {/* Devices Card List - ONLY SCROLLER HERE */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                      {loadingDevices ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                          <p className="text-xs font-bold uppercase tracking-wider">Loading devices…</p>
                        </div>
                      ) : venueDevices.length > 0 ? (
                        venueDevices.map(unit => {
                          const venue = orgVenues.find(v => v.id === unit.venueId) || venues.find(v => v.id === unit.venueId);
                          const org = orgs.find(o => o.id === venue?.orgId) || orgs.find(o => o.id === listOrgId);
                          const brand = unit.brand || '—';
      
                          return (
                            <div
                              key={unit.id}
                              className={`p-3.5 bg-slate-50/50 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 ${
                                editingUnitId === unit.id 
                                  ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                                  : 'border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                                  editingUnitId === unit.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <MonitorSmartphone className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-base leading-snug">{unit.name}</span>
                                    <span className="px-1.5 py-0.5 bg-slate-100/80 text-slate-650 text-[10px] font-black rounded border border-slate-200/40">
                                      {brand}
                                    </span>
                                    {unit.isOn ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System ON" />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-slate-300" title="System OFF" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-0.5">
                                      <Building2 className="w-3 h-3" />
                                      {org?.name || 'No Org'}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-3 h-3" />
                                      {venue?.name || 'No Venue'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 mb-1.5">ID: {unit.id}</p>
                                  
                                  {/* Live Power Consumption Info */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50/80 border border-blue-100/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                      <Zap className="w-3 h-3 fill-blue-500" />
                                      {unit.hasEnergySensor !== false ? (
                                        <span>Power: {getACPowerDraw(unit).power} kW</span>
                                      ) : (
                                        <span>Power: Sensor Off</span>
                                      )}
                                    </span>
                                    {unit.hasEnergySensor !== false && (
                                      <span className="text-[10px] font-bold text-slate-500">
                                        Today: {getACPowerDraw(unit).energyToday} kWh
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
      
                              {/* Flat UI Icon-only Edit/Delete Action Panel */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => handleEditClick(unit)}
                                  className={`p-2 rounded-xl transition-all ${
                                    editingUnitId === unit.id
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50/50'
                                  }`}
                                  title="Edit details"
                                >
                                  <Edit className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you absolutely sure you want to delete this device?')) {
                                      onDeleteDevice(unit.id);
                                      setVenueDevices((prev) => prev.filter((d) => d.id !== unit.id));
                                      if (editingUnitId === unit.id) resetForm();
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Delete device"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
                          <MonitorSmartphone className="w-10 h-10 text-slate-300 mb-2" />
                          <p className="font-bold text-slate-800 text-sm">No Climate Devices Found</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {listVenueId ? 'No devices for this venue yet' : 'Select organization and venue above'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Add/Edit Device — hidden on mobile */}
                  <div className="hidden lg:flex lg:col-span-5 flex-col gap-4 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
                    
                    {/* Device Compact Form card (STAYS ON TOP) */}
                    <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                          </div>
                          {editingUnitId ? 'Edit Configuration' : 'Add New Hardware'}
                        </h3>
                        {editingUnitId && (
                          <button
                            onClick={resetForm}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800"
                          >
                            Create Mode Instead
                          </button>
                        )}
                      </div>
      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Name field */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Device Name</label>
                            <input
                              type="text"
                              value={deviceName}
                              onChange={(e) => setDeviceName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                              placeholder="e.g. Living Room AC"
                            />
                          </div>
      
                          {/* Brand field */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AC Brand</label>
                            <select
                              value={acBrand}
                              onChange={(e) => setAcBrand(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            >
                              {AC_BRANDS.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                              ))}
                            </select>
                          </div>
                        </div>
      
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Organization field */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organization</label>
                            <select
                              value={selectedOrgId}
                              onChange={(e) => setSelectedOrgId(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            >
                              {orgs.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                              ))}
                            </select>
                          </div>
      
                          {/* Venue field */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Venue</label>
                            <select
                              value={selectedVenueId}
                              onChange={(e) => setSelectedVenueId(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            >
                              {venues.filter(v => v.orgId === selectedOrgId).map(venue => (
                                <option key={venue.id} value={venue.id}>{venue.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
      
                        {/* Action button */}
                        <div className="pt-2 flex gap-2">
                          {editingUnitId && (
                            <button
                              onClick={resetForm}
                              className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={handleSave}
                            disabled={!deviceName.trim() || !selectedVenueId}
                            className="flex-[2] py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex justify-center items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{editingUnitId ? 'Update Device' : 'Save Device'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
      
                    {/* Dynamic Bottom-Right API Key card */}
                    {editingUnitId && (
                      <div className="bg-gradient-to-tr from-amber-50/50 to-amber-100/30 border border-amber-200/60 p-4 rounded-3xl space-y-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Device Key Credential</span>
                          </div>
                        </div>
      
                        <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-amber-200/50 shadow-inner">
                          <span className="font-mono text-[13px] font-extrabold text-slate-900 select-all truncate flex-1 leading-none tracking-tight">
                            {revealApiKey ? currentApiKey : currentApiKey.replace(/(?<=.{12})./g, '•')}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setRevealApiKey(!revealApiKey)}
                              className="p-1.5 hover:bg-amber-100/50 rounded-lg text-slate-400 hover:text-amber-700 transition-all"
                              title={revealApiKey ? "Hide Key" : "Show Key"}
                            >
                              {revealApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={handleCopy}
                              className="p-1.5 hover:bg-amber-100/50 rounded-lg text-slate-400 hover:text-amber-700 transition-all whitespace-nowrap"
                              title="Copy Key"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
    </>
  );
}
