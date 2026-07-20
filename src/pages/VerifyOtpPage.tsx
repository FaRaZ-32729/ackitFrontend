import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';
import axios from 'axios';
import { ACKitLogo } from '../components/ui/ACKitLogo';
import { resendOtp, verifyOtp } from '../api/authApi';

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(
    Number(searchParams.get('expiresAt')) || 0
  );
  const [now, setNow] = useState(Date.now());
  const remainingSeconds = Math.max(0, Math.ceil((otpExpiresAt - now) / 1000));

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter the email address used for registration');
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp(email.trim().toLowerCase(), otp);
      setSuccess(response.message);

      if (response.requiresPasswordSetup) {
        if (!response.setupToken) {
          setError('Password setup token was not returned. Please request a new invitation.');
          return;
        }
        navigate(`/setup-password/${encodeURIComponent(response.setupToken)}`);
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'OTP verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter your email address before requesting another OTP');
      return;
    }

    setResending(true);
    try {
      const response = await resendOtp(email.trim().toLowerCase());
      setSuccess(response.message);
      setOtpExpiresAt(new Date(response.otpExpiresAt).getTime());
      setNow(Date.now());
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { otpExpiresAt?: string } | undefined;
        if (data?.otpExpiresAt) {
          setOtpExpiresAt(new Date(data.otpExpiresAt).getTime());
          setNow(Date.now());
        }
      }
      setError(getErrorMessage(err, 'Failed to resend OTP. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 transition-all">
        <div className="flex flex-col items-center justify-center mb-6">
          <ACKitLogo variant="full" size="md" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            ACCOUNT VERIFICATION
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Verify your email</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2.5">
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

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              placeholder="000000"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center text-xl tracking-[0.45em] font-black text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify OTP
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs font-semibold text-slate-400">
          {remainingSeconds > 0 ? (
            <span>
              You can request a new code in{' '}
              <span className="text-slate-600 font-bold">
                {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
              </span>
            </span>
          ) : (
            <>
              OTP expired?{' '}
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className="text-indigo-600 font-bold hover:text-indigo-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </>
          )}
        </div>
        <div className="mt-3 text-center">
          <Link to="/login" className="text-[10px] font-bold text-slate-400 hover:text-slate-600">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
