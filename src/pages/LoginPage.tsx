import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Users, User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ACKitLogo } from '../components/ACKitLogo';
import { useAppContext } from '../context/AppContext';
import { Role } from '../types';

export function LoginPage() {
  const { setRole } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail === 'admin@example.com') {
      setSuccess('Welcome Admin! Loading console...');
      setTimeout(() => {
        setRole('admin');
        navigate('/admin');
      }, 1000);
    } else if (lowerEmail === 'alice@example.com') {
      setSuccess('Welcome Manager! Loading console...');
      setTimeout(() => {
        setRole('manager');
        navigate('/manager');
      }, 1000);
    } else if (lowerEmail === 'bob@example.com') {
      setSuccess('Welcome back! Loading dashboard...');
      setTimeout(() => {
        setRole('user');
        navigate('/user');
      }, 1000);
    } else {
      setSuccess('Login successful! Loading dashboard...');
      setTimeout(() => {
        setRole('user');
        navigate('/user');
      }, 1000);
    }
  };

  const handleQuickBypass = (roleType: Role) => {
    setError('');
    setSuccess('');
    
    if (roleType === 'admin') {
      setEmail('admin@example.com');
    } else if (roleType === 'manager') {
      setEmail('alice@example.com');
    } else {
      setEmail('bob@example.com');
    }
    setPassword('••••••••');

    setSuccess(`Bypassing auth as ${roleType.toUpperCase()}...`);
    setTimeout(() => {
      setRole(roleType);
      navigate(`/${roleType}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 transition-all">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <ACKitLogo variant="full" size="md" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            IOTIFY ADMIN CONSOLE
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Sign in to monitor & control connected devices
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Password
              </label>
              <a href="#forgot" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-10 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-5 text-center text-xs font-semibold text-slate-400">
          <span>Don't have an account? </span>
          <Link
            to="/register"
            className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
          >
            Register now
          </Link>
        </div>

        {/* Bypass buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-center mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5">
              OR QUICK ACCESS DEMO ROLES
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickBypass('admin')}
              className="group p-3 rounded-xl border border-slate-100 hover:border-violet-200 bg-slate-50/50 hover:bg-violet-50/20 text-center transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-slate-600 group-hover:text-violet-700 transition-colors uppercase tracking-tight block">
                Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickBypass('manager')}
              className="group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/20 text-center transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-700 transition-colors uppercase tracking-tight block">
                Manager
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickBypass('user')}
              className="group p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 text-center transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-slate-600 group-hover:text-emerald-700 transition-colors uppercase tracking-tight block">
                User
              </span>
            </button>
          </div>

          <div className="text-center mt-3.5">
            <span className="text-[9px] font-semibold text-slate-400 block leading-tight">
              Tip: Click any bypass button above for instant dashboard entry.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
