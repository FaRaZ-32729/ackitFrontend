import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Building2, 
  MapPin, 
  Wind, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CustomDropdown } from '../ui/CustomDropdown';
import { getVenuesByOrganization } from '../../api/venueApi';
import {
  createDevice,
  getDeviceBrandOptions,
  type DeviceBrandOption,
} from '../../api/deviceApi';
import type { Venue } from '../../types';
import axios from 'axios';

interface AddDeviceOverlayPageProps {
  onClose: () => void;
}

export function AddDeviceOverlayPage({ onClose }: AddDeviceOverlayPageProps) {
  const { setUnits, orgs } = useAppContext();

  // Form State
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState(orgs[0]?.id || '');
  const [venueId, setVenueId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [capacity, setCapacity] = useState('1.5');
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);
  const [brandOptions, setBrandOptions] = useState<DeviceBrandOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!orgId && orgs.length > 0) setOrgId(orgs[0].id);
  }, [orgId, orgs]);

  useEffect(() => {
    let active = true;
    setVenueId('');
    setAvailableVenues([]);
    if (!orgId) return () => { active = false; };

    getVenuesByOrganization(orgId)
      .then((list) => {
        if (!active) return;
        setAvailableVenues(list);
        setVenueId(list[0]?.id || '');
      })
      .catch(() => {
        if (active) setError('Failed to load venues for this organization');
      });

    return () => { active = false; };
  }, [orgId]);

  useEffect(() => {
    let active = true;
    getDeviceBrandOptions()
      .then((list) => {
        if (!active) return;
        setBrandOptions(list);
        setBrandId(list[0]?.id || '');
      })
      .catch(() => {
        if (active) setError('Failed to load AC brands');
      })
      .finally(() => {
        if (active) setIsLoadingOptions(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field Validation
    if (!name.trim()) {
      setError('Device Name is required');
      return;
    }
    if (!orgId) {
      setError('Organization is required');
      return;
    }
    if (!venueId) {
      setError('Venue is required. Please create a venue first if none exist.');
      return;
    }
    if (!brandId) {
      setError('AC Brand is required. Please create a brand profile first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newDevice = await createDevice({
        name: name.trim(),
        organization: String(orgId),
        venue: String(venueId),
        brand: String(brandId),
        capacity: Number(capacity),
      });
      setUnits((prev) => [...prev, newDevice]);
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as {
          message?: string;
          errors?: Array<{ message: string }>;
        };
        const details = data?.errors?.map((e) => e.message).filter(Boolean).join(' · ');
        const apiMessage = data?.message || '';
        const isNameTaken =
          status === 409 &&
          (/already exists/i.test(apiMessage) ||
            /name is already/i.test(apiMessage) ||
            /name already/i.test(details || ''));
        setError(
          isNameTaken
            ? 'This name is already present in this venue'
            : details || apiMessage || err.message
        );
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create device');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none animate-in fade-in slide-in-from-bottom-4 duration-300 px-5 pt-4 pb-6">
      
      {/* Header Bar - Fixed at top */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
            Add Directory Record
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            New Device
          </h1>
        </div>
        
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all active:scale-90"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {isSuccess ? (
        /* SUCCESS STATE */
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Device Registered!
          </h2>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed font-semibold">
            Device <strong className="text-slate-800">{name}</strong> has been registered successfully.
          </p>
        </div>
      ) : (
        /* FORM ENTRY SCREEN */
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Scrollable Fields Wrapper */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-2 scrollbar-thin">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              
              {/* Error Callout */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input: Device Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSUET Seminar Hall AC"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full bg-slate-50/50 text-slate-800 text-xs font-bold pl-4 pr-10 py-3 rounded-2xl border border-slate-200/50 focus:outline-none focus:border-blue-500 focus:bg-white shadow-inner transition-all placeholder:text-slate-400"
                  />
                  <Cpu className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Input: Organization Dropdown */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Select Organization <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  value={orgId}
                  onChange={setOrgId}
                  icon={Building2}
                  placeholder="Select organization"
                  disabled={orgs.length === 0}
                  options={orgs.map((org) => ({ value: org.id, label: org.name }))}
                />
              </div>

              {/* Input: Venue Dropdown */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Select Venue <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  value={venueId}
                  onChange={setVenueId}
                  icon={MapPin}
                  placeholder="No venues available"
                  options={
                    availableVenues.length > 0
                      ? availableVenues.map((v) => ({ value: v.id, label: v.name }))
                      : [{ value: '', label: 'No venues available', disabled: true }]
                  }
                />
              </div>

              {/* Grid: Brand and Capacity */}
              <div className="grid grid-cols-2 gap-4 min-w-0">
                {/* Input: Brand Dropdown */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    AC Brand
                  </label>
                  <CustomDropdown
                    value={brandId}
                    onChange={setBrandId}
                    icon={Wind}
                    placeholder={isLoadingOptions ? 'Loading brands…' : 'No brands available'}
                    disabled={isLoadingOptions || brandOptions.length === 0}
                    options={brandOptions.map((brand) => ({
                      value: brand.id,
                      label: brand.name,
                    }))}
                  />
                </div>

                {/* Input: Capacity Dropdown */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    AC Capacity
                  </label>
                  <CustomDropdown
                    value={capacity}
                    onChange={setCapacity}
                    icon={Wind}
                    options={[
                      { value: '1', label: '1.0 Ton' },
                      { value: '1.5', label: '1.5 Ton' },
                      { value: '2', label: '2.0 Ton' },
                      { value: '2.5', label: '2.5 Ton' },
                      { value: '3', label: '3.0 Ton' },
                      { value: '3.5', label: '3.5 Ton' },
                    ]}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-4 grid grid-cols-2 gap-4 shrink-0 border-t border-slate-100/50 bg-[#f8fafc]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-black uppercase tracking-wider rounded-full text-center transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-full text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save Device</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
