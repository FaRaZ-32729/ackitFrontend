import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Crown,
  Gift,
  Loader2,
  LogOut,
  Shield,
} from 'lucide-react';
import axios from 'axios';
import { ACKitLogo } from '../components/ui/ACKitLogo';
import { useAppContext } from '../context/AppContext';
import { getPurchasablePlans } from '../api/planApi';
import type { SubscriptionPlan } from '../types';

export function BuyPlanPage() {
  const {
    role,
    authLoading,
    hasActiveSubscription,
    purchasePlan,
    logout,
  } = useAppContext();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const nextPlans = await getPurchasablePlans();
        if (!cancelled) setPlans(nextPlans);
      } catch (err) {
        if (!cancelled) {
          let message = 'Failed to load available plans';
          if (axios.isAxiosError(err)) {
            message = (err.response?.data as { message?: string })?.message || message;
          }
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'manager') {
    return <Navigate to={`/${role}`} replace />;
  }

  if (hasActiveSubscription) {
    return <Navigate to="/manager" replace />;
  }

  const handlePurchase = async (planId: string) => {
    setError('');
    setSuccess('');
    setPurchasingId(planId);
    try {
      await purchasePlan(planId);
      setSuccess('Plan activated successfully. Opening dashboard...');
      navigate('/manager', { replace: true });
    } catch (err) {
      let message = 'Failed to activate plan. Please try again.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as {
          message?: string;
          errors?: { message: string }[];
        } | undefined;
        message = data?.errors?.[0]?.message || data?.message || message;
      }
      setError(message);
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ACKitLogo variant="full" size="sm" />
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            Choose your plan
          </span>
        </div>
        <button
          type="button"
          onClick={() => void logout().then(() => navigate('/login'))}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Select a subscription plan
          </h1>
          <p className="text-sm text-slate-400 font-semibold mt-2 max-w-xl mx-auto">
            Choose Free, Basic, or Premium to unlock your manager dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm font-semibold">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-semibold">
            No purchasable plans are available yet. Please contact your administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {plans.map((plan) => {
              const TypeIcon =
                plan.planType === 'free' ? Gift :
                  plan.planType === 'premium' ? Crown :
                    Shield;
              const isPurchasing = purchasingId === plan.id;

              return (
                <div
                  key={plan.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col transition-all hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-slate-900 leading-tight truncate">
                          {plan.name}
                        </h4>
                        {plan.planType && (
                          <div className="flex items-center gap-1 mt-1">
                            <TypeIcon className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 capitalize">
                              {plan.planType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-slate-900">
                        {plan.pricePkr === 0 ? 'Free' : `Rs. ${plan.pricePkr ?? 0}`}
                      </span>
                      <span className="text-[9px] block text-slate-400 font-bold mt-0.5">
                        / {plan.durationDays || 30} Days
                      </span>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-slate-500 mb-4 bg-slate-50/55 p-2.5 rounded-lg border border-slate-100 font-medium">
                      {plan.description}
                    </p>
                  )}

                  <div className="space-y-2.5 mb-6 flex-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Organizations</span>
                      <span className="font-bold text-slate-800">{plan.maxOrgs}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Venues</span>
                      <span className="font-bold text-slate-800">{plan.maxVenues}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Devices</span>
                      <span className="font-bold text-slate-800">{plan.maxDevices}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Users</span>
                      <span className="font-bold text-slate-800">{plan.maxUsers ?? 1}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handlePurchase(plan.id)}
                    disabled={!!purchasingId}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Activating...
                      </>
                    ) : plan.pricePkr === 0 ? (
                      'Start Free Plan'
                    ) : (
                      'Buy Plan'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
