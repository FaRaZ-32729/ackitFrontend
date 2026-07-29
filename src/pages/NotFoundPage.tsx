import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-8">
          <img
            src="/logo.png"
            alt="Ackit"
            className="h-11 w-auto object-contain"
          />
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <Link
            to="/login"
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
