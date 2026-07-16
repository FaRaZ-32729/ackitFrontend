import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Shield, Users } from 'lucide-react';
import { ACKitLogo } from '../components/ui/ACKitLogo';
import { useAppContext } from '../context/AppContext';

export function RegisterPage() {
  const { setRole } = useAppContext();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleType, setRoleType] = useState<'manager' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSuccess('Account registered successfully! Logging you in...');
    setTimeout(() => {
      setRole(roleType);
      navigate(`/${roleType}`);
    }, 1500);
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
            Create your account
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Get started with your smart A/C fleet console
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
          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Register As
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoleType('user')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  roleType === 'user'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Standard User</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleType('manager')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  roleType === 'manager'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manager</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

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
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Password
            </label>
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
            <span>Register & Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Switch to Login */}
        <div className="mt-5 text-center text-xs font-semibold text-slate-400">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
