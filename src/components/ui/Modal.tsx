import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-hidden bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-[1.75rem] sm:rounded-2xl shadow-xl border border-slate-100 max-h-[92vh] sm:max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag hint */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 sm:p-6 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{title}</h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-all p-2 sm:p-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl shrink-0 active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 sm:p-6 overflow-y-auto scrollbar-hide flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
