import React, { useMemo, useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  MapPin, 
  Building2,
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { CustomDropdown } from '../ui/CustomDropdown';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';

interface AddUserOverlayPageProps {
  onClose: () => void;
}

export function AddUserOverlayPage({ onClose }: AddUserOverlayPageProps) {
  const { createSubUser, orgs, venues } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'manage'>('view');
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [assignedVenueIds, setAssignedVenueIds] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const venueOptions = useMemo(
    () =>
      venues
        .filter((v) => organizationIds.includes(v.orgId))
        .map((v) => ({ value: v.id, label: v.name })),
    [venues, organizationIds]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address');
      return;
    }
    if (organizationIds.length === 0) {
      setError('Select at least one organization');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubUser({
        name: name.trim(),
        email: email.trim(),
        organizations: organizationIds,
        venues: assignedVenueIds,
        permission,
      });
      setIsSuccess(true);
      window.setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      let message = 'Failed to create user';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as {
          message?: string;
          errors?: { message: string }[];
        } | undefined;
        message = data?.errors?.[0]?.message || data?.message || message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none animate-in fade-in slide-in-from-bottom-4 duration-300 px-5 pt-4 pb-6">
      
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
            Add Directory Record
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            New User
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
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            User Created!
          </h2>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed font-semibold">
            Verification OTP sent to <strong className="text-slate-800">{email}</strong>. After OTP verification they can set a password and join.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-h-full flex flex-col justify-center py-4 pr-1">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 w-full shrink-0">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-50/50 text-slate-800 text-xs font-bold pl-4 pr-10 py-3 rounded-2xl border border-slate-200/50 focus:outline-none focus:border-blue-500 focus:bg-white shadow-inner transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-50/50 text-slate-800 text-xs font-bold pl-4 pr-10 py-3 rounded-2xl border border-slate-200/50 focus:outline-none focus:border-blue-500 focus:bg-white shadow-inner transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Organizations <span className="text-red-500">*</span>
                </label>
                <MultiSelectDropdown
                  values={organizationIds}
                  onChange={(ids) => {
                    setOrganizationIds(ids);
                    setAssignedVenueIds((prev) =>
                      prev.filter((venueId) => {
                        const venue = venues.find((v) => v.id === venueId);
                        return venue ? ids.includes(venue.orgId) : false;
                      })
                    );
                  }}
                  icon={Building2}
                  placeholder="Select organizations…"
                  options={orgs.map((org) => ({ value: org.id, label: org.name }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Permission
                </label>
                <CustomDropdown
                  value={permission}
                  onChange={(v) => setPermission(v as 'view' | 'manage')}
                  options={[
                    { value: 'view', label: 'View' },
                    { value: 'manage', label: 'Manage' },
                  ]}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Assign Venues
                </label>
                <MultiSelectDropdown
                  values={assignedVenueIds}
                  onChange={setAssignedVenueIds}
                  icon={MapPin}
                  placeholder={
                    organizationIds.length === 0
                      ? 'Select organizations first…'
                      : 'Select venues…'
                  }
                  options={venueOptions}
                  disabled={isSubmitting || organizationIds.length === 0}
                />
              </div>

              </div>
            </div>
          </div>

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
              disabled={isSubmitting || !name.trim() || !email.trim() || organizationIds.length === 0}
              className="py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-full text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  <span>Save User</span>
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
