import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-all p-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
