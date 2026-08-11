import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageSquare, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoleName, UserRole } from '../../types';
import { RoleSelector } from './RoleSelector';
import { AuthForm } from './AuthForm';
import LaBouffeLogo from '../shared/LaBouffeLogo';
import { LaBouffeLogoMark } from '../shared/LaBouffeLogoMark';
import { apiPost, apiGet } from '../../lib/apiClient';
import { setToken, setUserProfile, decodeJwt, getToken, clearAllLocalData } from '../../lib/tokenStore';
import { logout } from '../../lib/authStore';
import SessionManagementModal from '../shared/SessionManagementModal';
import CompleteProfileModal from '../shared/CompleteProfileModal';
import { z } from 'zod';

const phoneSchema = z.string().min(8, 'Phone number must be at least 8 digits').max(20, 'Phone number cannot exceed 20 digits');
const otpSchema = z.string().length(6, 'Please enter the 6-digit code');

const roleToServiceName = (role: UserRole): string => {
  switch (role) {
    case RoleName.CUSTOMER: return RoleName.CUSTOMER;
    case RoleName.RESTAURANT: return RoleName.RESTAURANT;
    case RoleName.DELIVERY: return RoleName.DELIVERY;
    case RoleName.ADMIN: return RoleName.ADMIN;
    default: return RoleName.CUSTOMER;
  }
};

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, phone: string, name: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onAddApiLog?: (log: any) => void;
}

export default function LoginScreen({ onLoginSuccess, theme = 'light', onToggleTheme, onAddApiLog }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  const [scrollY, setScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const foodImages = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', // Burger
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', // Pizza
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', // Sushi
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', // Pasta
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Salad
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'  // Dessert
  ];

  const foodNames = [
    'Smashed Cheeseburger',
    'Wood-Fired Neapolitan Pizza',
    'Premium Sushi & Sashimi Platter',
    'Handmade Italian Pasta',
    'Mediterranean Garden Salad',
    'Artisanal Glazed Dessert'
  ];

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    // Proactively clear backend session and local data if a user lands on login
    // This handles the edge case where session is lost locally but active on backend.
    const token = getToken();
    if (token) {
      logout().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % foodImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto dismiss or show SMS simulation
  useEffect(() => {
    if (otpSent && generatedOtp && ((import.meta as any).env.DEV || (import.meta as any).env.VITE_ENABLE_DEV_OTP === 'true')) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [otpSent, generatedOtp]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = phoneSchema.safeParse(phone);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    
    if (onAddApiLog) {
      onAddApiLog({ id: 'auth_initiate', label: 'POST /api/v1/internal/auth/initiate', method: 'POST' });
    }

    try {
      const serviceName = roleToServiceName(selectedRole!);
      await apiPost(
        `/api/v1/internal/auth/initiate?phoneNumber=${encodeURIComponent(phone)}`,
        undefined,
        { 'X-Calling-Service': serviceName }
      );
      
      // Try to fetch the OTP via admin endpoint (dev convenience or feature flag)
      if ((import.meta as any).env.DEV || (import.meta as any).env.VITE_ENABLE_DEV_OTP === 'true') {
        try {
          const adminResp = await apiGet(`/api/v1/internal/auth/admin/otp?phoneNumber=${encodeURIComponent(phone)}&serviceName=${encodeURIComponent(serviceName)}`);
          if (adminResp?.data) {
            setGeneratedOtp(adminResp.data);
          } else if (typeof adminResp === 'string') {
            setGeneratedOtp(adminResp);
          }
        } catch {
          console.warn("Could not fetch OTP from admin endpoint.");
        }
      }

      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = otpSchema.safeParse(otpCode);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    
    if (onAddApiLog) {
      onAddApiLog({ id: 'auth_verify', label: 'POST /api/v1/internal/auth/verify', method: 'POST' });
    }

    try {
      const serviceName = roleToServiceName(selectedRole!);
      const resp = await apiPost(
        `/api/v1/internal/auth/verify?phoneNumber=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otpCode)}`,
        undefined,
        { 'X-Calling-Service': serviceName }
      );

      // The backend returns { success: true, data: "<jwt_token>", message: "Login successful" }
      const token = resp?.data || resp;
      if (!token || typeof token !== 'string') {
        throw new Error('No token received from server');
      }

      // Store JWT
      setToken(token);

      // Decode user info from JWT
      const decoded = decodeJwt(token);
      const name = decoded?.name || decoded?.phone || phone;
      const id = decoded?.sub;

      // Store profile for session persistence
      setUserProfile({ id, phone, role: selectedRole!, name });

      // Fetch profile to check if it is complete
      try {
        const profileResp = await apiGet('/api/v1/users/profile');
        const p = profileResp?.data;
        if (!p?.name || !p?.email || p.name.trim() === '' || p.email.trim() === '') {
          setPendingLoginData({ id, phone, role: selectedRole!, name });
          setShowProfileModal(true);
          return;
        } else {
          // If profile is already complete, just proceed
          setUserProfile({ id, phone, role: selectedRole!, name: p.name });
          onLoginSuccess(selectedRole!, phone, p.name);
        }
      } catch (profileErr) {
        // If there's an error fetching profile, show the modal as a fallback
        setPendingLoginData({ id, phone, role: selectedRole!, name });
        setShowProfileModal(true);
        return;
      }
    } catch (err: any) {
      if (err.status === 409 && err.data?.data?.activeSessions) {
        setActiveSessions(err.data.data.activeSessions);
        setShowSessionModal(true);
      } else {
        setError(err.message || 'OTP verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (otpSent) {
      setOtpSent(false);
      setOtpCode('');
      setShowNotification(false);
    } else {
      setSelectedRole(null);
      setPhone('');
      setScrollY(0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
    setError('');
  };

  const autofillOtp = () => {
    setOtpCode(generatedOtp);
    setError('');
  };

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="w-full flex-1 flex flex-col justify-between bg-transparent pt-0 px-0 pb-4 sm:pt-0 sm:pb-6 relative overflow-y-auto overflow-x-hidden"
    >
      {/* Background ambient blurs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Sticky Shrinking Logo Header (only shown when selecting roles) */}
      {!selectedRole && (
        <div 
          className={`sticky top-0 left-0 right-0 z-30 transition-all duration-300 flex flex-col items-center justify-center text-center pb-5 px-4 sm:px-6 rounded-b-3xl border-b backdrop-blur-xl ${
            theme === 'dark'
              ? 'bg-slate-900/20 border-rose-500/30/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
              : 'bg-white/20 border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
          }`}
          style={{
            paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 16px))'
          }}
        >
          {/* Theme Toggle inside Sticky Header */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 p-2.5 rounded-xl border backdrop-blur-xl transition-all cursor-pointer z-40 ${
                theme === 'dark'
                  ? 'bg-slate-900/20 border-rose-500/30/40 text-amber-400 hover:text-amber-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                  : 'bg-white/20 border-white/30 text-indigo-600 hover:text-indigo-800 shadow-sm'
              }`}
              style={{
                right: 'calc(1.5rem + env(safe-area-inset-right, 0px))'
              }}
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Smoothly scaling logo wrapper */}
          <div 
            className="transition-all duration-300 transform origin-center"
            style={{
              transform: `scale(${Math.max(0.72, Math.min(1.0, 1 - scrollY / 300))})`,
              opacity: Math.max(0.9, Math.min(1.0, 1 - scrollY / 550))
            }}
          >
            <LaBouffeLogo 
              className="flex flex-col items-center gap-2.5 w-full" 
              iconSize={scrollY > 10 ? "w-11 h-11" : "w-18 h-18"}
              align="center"
              textColorClass={theme === 'dark' ? 'text-white' : 'text-slate-800'}
            />
          </div>
          

        </div>
      )}

      {/* SMS Alert Notification Overlay */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.95 }}
            className="absolute left-4 right-4 max-w-md mx-auto backdrop-blur-2xl bg-white/20 dark:bg-slate-900/20 border border-rose-500/20 dark:border-rose-500/30 text-slate-800 dark:text-[#f0ede6] p-4 rounded-2xl shadow-[0_15px_30px_rgba(249,115,22,0.1)] z-50 flex items-start gap-3 cursor-pointer hover:border-orange-500/50 transition-all hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
            style={{
              top: 'calc(1rem + env(safe-area-inset-top, 16px))'
            }}
            onClick={autofillOtp}
          >
            <div className="bg-orange-500 p-2 rounded-xl text-white shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-orange-600 dark:text-orange-400 font-mono tracking-wider">SMS GATEWAY</span>
                <span className="text-[10px] text-slate-300 dark:text-slate-300">Just now</span>
              </div>
              <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-[#f0ede6]">Your La Bouffe Login OTP is <span className="text-orange-600 dark:text-orange-400 font-mono text-base font-bold underline decoration-dotted">{generatedOtp}</span></p>
              <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] mt-0.5 block">Tap this notification to autofill and proceed.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {selectedRole && (
        <div 
          className="shrink-0 flex items-center justify-between relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8"
          style={{
            marginTop: 'calc(0.375rem + env(safe-area-inset-top, 16px))'
          }}
        >
          <button
            onClick={handleBack}
            className={`p-2.5 rounded-xl transition-all border cursor-pointer backdrop-blur-md ${
              theme === 'dark' ? 'bg-slate-900 border-rose-500/30 text-slate-300 hover:bg-slate-800' : 'bg-white/20 border-rose-500/20 text-slate-600 dark:text-slate-300 hover:bg-white/20'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <LaBouffeLogoMark className="w-6 h-6" />
            <span className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>La Bouffe</span>
          </div>
          {onToggleTheme ? (
            <button
              onClick={onToggleTheme}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                theme === 'dark'
                  ? 'bg-slate-900 border-rose-500/30 text-amber-400 hover:text-amber-300'
                  : 'bg-white/20 border-rose-500/20 text-indigo-600 hover:bg-white/20'
              }`}
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-start my-3 sm:my-6 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <RoleSelector theme={theme} onSelectRole={setSelectedRole} />
          ) : (
            <AuthForm
              theme={theme}
              selectedRole={selectedRole}
              phone={phone}
              setPhone={setPhone}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              otpSent={otpSent}
              loading={loading}
              error={error}
              onSendOtp={handleSendOtp}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={async () => {
                setError('');
                setShowNotification(false);
                try {
                  const serviceName = roleToServiceName(selectedRole!);
                  await apiPost(
                    `/api/v1/internal/auth/initiate?phoneNumber=${encodeURIComponent(phone)}`,
                    undefined,
                    { 'X-Calling-Service': serviceName }
                  );
                  if ((import.meta as any).env.DEV || (import.meta as any).env.VITE_ENABLE_DEV_OTP === 'true') {
                    try {
                      const adminResp = await apiGet(`/api/v1/internal/auth/admin/otp?phoneNumber=${encodeURIComponent(phone)}&serviceName=${encodeURIComponent(serviceName)}`);
                      if (adminResp?.data) {
                        setGeneratedOtp(adminResp.data);
                      } else if (typeof adminResp === 'string') {
                        setGeneratedOtp(adminResp);
                      }
                      setTimeout(() => setShowNotification(true), 1200);
                    } catch {
                      console.warn("Could not fetch OTP from admin endpoint.");
                    }
                  }
                } catch (err: any) {
                  setError(err.message || 'Failed to resend OTP.');
                }
              }}
              onAutofillOtp={autofillOtp}
            />
          )}
        </AnimatePresence>
      </div>

      <SessionManagementModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        sessions={activeSessions}
        phone={phone}
        otpCode={otpCode}
        serviceName={selectedRole ? roleToServiceName(selectedRole) : ''}
        theme={theme}
        onSuccess={async (token) => {
          setShowSessionModal(false);
          setToken(token);
          const decoded = decodeJwt(token);
          const name = decoded?.name || decoded?.phone || phone;
          const id = decoded?.sub;
          const role = selectedRole!;
          setUserProfile({ id, phone, role, name });

          try {
            const profileResp = await apiGet('/api/v1/users/profile');
            const p = profileResp?.data;
            if (!p?.name || !p?.email || p.name.trim() === '' || p.email.trim() === '') {
              setPendingLoginData({ id, phone, role, name });
              setShowProfileModal(true);
            } else {
              setUserProfile({ id, phone, role, name: p.name });
              onLoginSuccess(role, phone, p.name);
            }
          } catch (err) {
            setPendingLoginData({ id, phone, role, name });
            setShowProfileModal(true);
          }
        }}
      />

      <CompleteProfileModal
        isOpen={showProfileModal}
        theme={theme}
        profileId={pendingLoginData?.id || ''}
        onComplete={(p) => {
          setShowProfileModal(false);
          const finalName = p.name || pendingLoginData?.name;
          if (pendingLoginData) {
            setUserProfile({ ...pendingLoginData, name: finalName });
            onLoginSuccess(pendingLoginData.role, pendingLoginData.phone, finalName);
          }
        }}
      />

      {/* Footer Disclaimer */}
      <div className="shrink-0 text-center space-y-1 sm:space-y-1.5 mt-auto relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8">
        <p className="text-[9.5px] sm:text-[10px] text-slate-300 dark:text-slate-300">
          By continuing, you agree to our terms & instant delivery guidelines. 
        </p>
        <div className="flex items-center justify-center gap-3 text-[9px] sm:text-[10px] text-slate-300 dark:text-slate-300 font-mono">
          <span>SECURE END-TO-END</span>
          <span>•</span>
          <span>BIOMETRIC READY</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1 sm:mt-2 text-[9px] font-mono tracking-wider text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full w-fit mx-auto border border-orange-500/15">
          <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
          <span>TODAY'S SPECIAL: {foodNames[currentBgIndex].toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
