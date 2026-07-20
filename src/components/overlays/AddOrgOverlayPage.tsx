import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';

interface AddOrgOverlayPageProps {
  onClose: () => void;
}

export function AddOrgOverlayPage({ onClose }: AddOrgOverlayPageProps) {
  const { createOrganization } = useAppContext();
  
  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Organization Name is required');
      return;
    }

    if (name.trim().length < 3) {
      setError('Organization name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrganization(name.trim(), address.trim() || undefined);
      setIsSuccess(true);
      window.setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      let message = 'Failed to create organization';
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
      
      {/* Header Bar - Fixed at top */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
            Add Directory Record
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            New Organization
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
        /* SUCCESS LOTTIE-LIKE ANIMATED STATE */
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Organization Created!
          </h2>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed font-semibold">
            The new organization <strong className="text-slate-800">{name}</strong> has been added successfully to your command directory.
          </p>
        </div>
      ) : (
        /* FORM ENTRY SCREEN */
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Centered form card — extra top/bottom space when form is small */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-h-full flex flex-col justify-center py-4 pr-1">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 w-full shrink-0">
              
              {/* Error Callout */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input: Org Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sir Syed University"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Input: Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  Address <span className="text-slate-300 font-bold normal-case tracking-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Optional street / city"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Sticky Action */}
          <div className="shrink-0 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Organization
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
