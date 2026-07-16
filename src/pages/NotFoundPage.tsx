import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import { ACKitLogo } from '../components/ui/ACKitLogo';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-8">
          <ACKitLogo variant="full" size="md" />
        </div>

        {/* 404 Visual Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Content */}
        <h1 className="text-3xl font-black text-slate-800 font-sans tracking-tight">404</h1>
        <h2 className="text-base font-bold text-slate-700 mt-2">Page Not Found</h2>
        <p className="text-xs text-slate-400 font-semibold mt-2 leading-relaxed">
          The requested page could not be found or you may not have permission to view it. Please check the address or return to the main console.
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-1 gap-3 w-full mt-8">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
