import React from 'react';
import { Smartphone, Shield, KeyRound, AlertCircle, Utensils, Store, Bike } from 'lucide-react';
import { motion } from 'motion/react';
import { RoleName, UserRole } from "@/types";
import { Button, Input, Spinner } from '@shared/ui';
import { useTheme } from "@/context/ThemeContext";

interface AuthFormProps {
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
  const { theme } = useTheme();
  
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
      className="max-w-xl mx-auto w-full"
    >
      <div className="glass-card p-8 sm:p-10 space-y-6 relative overflow-hidden">
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
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
          <div className="relative z-10 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={onSendOtp} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold tracking-wider font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>PHONE NUMBER</label>
              <div className={`flex glass-input rounded-2xl overflow-hidden focus-within:border-rose-400 transition-colors`}>
                <div className="px-4 flex items-center border-r border-white/10 font-mono text-sm bg-white/5">
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
              variant="primary"
              className="w-full !py-4 !rounded-2xl"
              loading={loading}
              icon={<Smartphone className="w-5 h-5" />}
            >
              Send One-Time OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold tracking-wider font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>ENTER SECURE CODE</label>
              <div className={`flex glass-input rounded-2xl overflow-hidden focus-within:border-rose-400 transition-colors`}>
                <div className="px-4 flex items-center border-r border-white/10 bg-white/5">
                  <KeyRound className="w-4 h-4 text-rose-400" />
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
                className="text-xs text-rose-400 font-bold hover:underline cursor-pointer bg-transparent border-0"
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
              variant="success"
              className="w-full !py-4 !rounded-2xl"
              loading={loading}
              icon={<Shield className="w-5 h-5" />}
            >
              Verify & Secure Log In
            </Button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
