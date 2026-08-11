import React from 'react';
import { Smartphone, Shield, KeyRound, AlertCircle, Utensils, Store, Bike } from 'lucide-react';
import { motion } from 'motion/react';
import { RoleName, UserRole } from '../../types';
import { Button, Input, Spinner } from '../ui';

interface AuthFormProps {
  theme: 'light' | 'dark';
  selectedRole: UserRole;
  phone: string;
  setPhone: (val: string) => void;
  otpCode: string;
  setOtpCode: (val: string) => void;
  otpSent: boolean;
  loading: boolean;
  error: string;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
  onResendOtp: () => void;
  onAutofillOtp: () => void;
}

export function AuthForm({
  theme,
  selectedRole,
  phone,
  setPhone,
  otpCode,
  setOtpCode,
  otpSent,
  loading,
  error,
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
  onAutofillOtp
}: AuthFormProps) {
  
  const getRoleIcon = () => {
    switch (selectedRole) {
      case RoleName.CUSTOMER: return <Utensils className="w-3.5 h-3.5" />;
      case RoleName.RESTAURANT: return <Store className="w-3.5 h-3.5" />;
      case RoleName.ADMIN: return <Shield className="w-3.5 h-3.5" />;
      default: return <Bike className="w-3.5 h-3.5" />;
    }
  };

  const getRoleLabel = () => {
    switch (selectedRole) {
      case RoleName.CUSTOMER: return 'Customer';
      case RoleName.RESTAURANT: return 'Restaurant Partner';
      case RoleName.ADMIN: return 'System Admin';
      default: return 'Delivery Rider';
    }
  };

  const getRoleStyle = () => {
    switch (selectedRole) {
      case RoleName.CUSTOMER:
      case RoleName.RESTAURANT:
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case RoleName.ADMIN:
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  return (
    <motion.div
      key="otp-form"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-xl mx-auto w-full"
    >
      <div className="space-y-2">
        <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${getRoleStyle()}`}>
          {getRoleIcon()}
          {getRoleLabel()}
        </span>
        <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          {!otpSent ? 'Login / Register' : 'OTP Verification'}
        </h2>
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>
          {!otpSent 
            ? 'Enter your mobile number to retrieve your secure credentials'
            : 'We sent a 6-digit security code to your phone'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!otpSent ? (
        <form onSubmit={onSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold tracking-wider font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>PHONE NUMBER</label>
            <div className={`flex backdrop-blur-md border rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors ${
              theme === 'dark' ? 'bg-slate-900/20 border-rose-500/30' : 'bg-white/20 border-rose-500/20'
            }`}>
              <div className={`px-4 flex items-center border-r font-mono text-sm ${
                theme === 'dark' ? 'bg-slate-800/20 text-slate-300 border-rose-500/30' : 'bg-slate-100/60 text-slate-500 dark:text-slate-300 border-rose-500/20'
              }`}>
                +91
              </div>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className={`!bg-transparent !border-0 !ring-0 font-mono text-base tracking-wide flex-1 !px-4 !py-3.5 !rounded-none ${theme === 'dark' ? '!text-white' : '!text-slate-800'}`}
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full !bg-gradient-to-r !from-orange-500 !to-amber-500 !text-white !font-bold !py-4 !rounded-2xl hover:!brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10 !border !border-white/20"
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Smartphone className="w-5 h-5" />
                Send One-Time OTP
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold tracking-wider font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>ENTER SECURE CODE</label>
            <div className={`flex backdrop-blur-md border rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors ${
              theme === 'dark' ? 'bg-slate-900/20 border-rose-500/30' : 'bg-white/20 border-rose-500/20'
            }`}>
              <div className={`px-4 flex items-center border-r ${theme === 'dark' ? 'bg-slate-800/20 border-rose-500/30' : 'bg-slate-100/60 border-rose-500/20'}`}>
                <KeyRound className="w-4 h-4 text-orange-500" />
              </div>
              <Input
                type="password"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="- - - - - -"
                className={`!bg-transparent !border-0 !ring-0 flex-1 !px-4 !py-3.5 !rounded-none font-mono text-xl text-center tracking-[1em] ${theme === 'dark' ? '!text-white' : '!text-slate-800'}`}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onResendOtp}
              className="text-xs text-orange-600 font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              Resend SMS Code
            </button>
            <button
              type="button"
              onClick={onAutofillOtp}
              className={`text-xs font-medium cursor-pointer bg-transparent border-0 ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800'}`}
            >
              Autofill Code
            </button>
          </div>

          <Button
            type="submit"
            className="w-full !bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-white !font-bold !py-4 !rounded-2xl hover:!brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 !border !border-white/20"
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verify & Secure Log In
              </>
            )}
          </Button>
        </form>
      )}
    </motion.div>
  );
}
