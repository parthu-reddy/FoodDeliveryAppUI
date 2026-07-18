import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Shield, ArrowLeft, Utensils, Store, Bike, KeyRound, AlertCircle, MessageSquare, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import LaBouffeLogo from './LaBouffeLogo';
import { LaBouffeLogoMark } from './LaBouffeLogoMark';
import { apiPost, apiGet } from '../lib/apiClient';
import { setToken, setUserProfile, decodeJwt, getToken, clearAllLocalData } from '../lib/tokenStore';
import { logout } from '../lib/authStore';
import SessionManagementModal from './SessionManagementModal';
import { z } from 'zod';

const phoneSchema = z.string().min(8, 'Phone number must be at least 8 digits').max(20, 'Phone number cannot exceed 20 digits');
const otpSchema = z.string().length(6, 'Please enter the 6-digit code');

const roleToServiceName = (role: UserRole): string => {
  switch (role) {
    case 'customer': return 'customer';
    case 'restaurant': return 'restaurant';
    case 'delivery': return 'delivery';
    case 'admin': return 'admin';
    default: return 'customer';
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

  const [scrollY, setScrollY] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const handleCardsScroll = () => {
    if (!cardsContainerRef.current) return;
    const scrollLeft = cardsContainerRef.current.scrollLeft;
    // Card width 290px + gap 24px (6)
    const cardWidth = 290 + 24;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(2, Math.max(0, index)));
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

      onLoginSuccess(selectedRole!, phone, name);
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
            /* ROLE SELECTOR */
            <motion.div
              key="role-selector"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
              className="pt-4 sm:pt-6 md:pt-8"
            >
              {/* Desktop view: Stable, spacious 3-column grid with deep hover-glow highlights */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full px-4">
                {/* Customer Card */}
                <button
                  onClick={() => setSelectedRole('customer')}
                  className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
                    theme === 'dark'
                      ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(249,115,22,0.25)] hover:border-orange-500/40'
                      : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(249,115,22,0.18)] hover:border-orange-400/40'
                  }`}
                >
                  <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Utensils className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
                      theme === 'dark' 
                        ? 'text-white group-hover:text-orange-400' 
                        : 'text-slate-800 group-hover:text-orange-600'
                    }`}>
                      Order Food
                    </h3>
                    <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      Browse top restaurants, customize dishes & order hot food
                    </p>
                  </div>
                </button>

                {/* Restaurant Partner */}
                <button
                  onClick={() => setSelectedRole('restaurant')}
                  className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
                    theme === 'dark'
                      ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(239,68,68,0.25)] hover:border-red-500/40'
                      : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all'
                  }`}
                >
                  <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
                      theme === 'dark' 
                        ? 'text-white group-hover:text-orange-400' 
                        : 'text-slate-800 group-hover:text-orange-600'
                    }`}>
                      Restaurant Partner
                    </h3>
                    <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      Manage incoming cooking tickets, stock statuses & earnings
                    </p>
                  </div>
                </button>

                {/* Delivery Executive */}
                <button
                  onClick={() => setSelectedRole('delivery')}
                  className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
                    theme === 'dark'
                      ? 'bg-slate-900/20 hover:bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:border-emerald-500/40'
                      : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(16,185,129,0.18)] hover:border-emerald-400/40'
                  }`}
                >
                  <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Bike className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
                      theme === 'dark' 
                        ? 'text-white group-hover:text-emerald-400' 
                        : 'text-slate-800 group-hover:text-emerald-600'
                    }`}>
                      Delivery Executive
                    </h3>
                    <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      Accept shipping contracts, view live map routes & payout stats
                    </p>
                  </div>
                </button>

                {/* System Admin */}
                <button
                  onClick={() => setSelectedRole('admin')}
                  className={`group flex flex-col items-center justify-center text-center p-8 rounded-3xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden cursor-pointer shadow-lg hover:-translate-y-1.5 min-h-[260px] ${
                    theme === 'dark'
                      ? 'bg-slate-900/20 hover:bg-slate-900/20 border-indigo-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_45px_rgba(99,102,241,0.25)] hover:border-indigo-500/40'
                      : 'bg-white/20 hover:bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(99,102,241,0.18)] hover:border-indigo-400/40'
                  }`}
                >
                  <div className="mb-4.5 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold transition-colors text-lg mb-2 ${
                      theme === 'dark' 
                        ? 'text-white group-hover:text-indigo-400' 
                        : 'text-slate-800 group-hover:text-indigo-600'
                    }`}>
                      System Admin
                    </h3>
                    <p className={`text-xs leading-relaxed max-w-[210px] mx-auto ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      Manage overall operations, manual assignments, and system settings
                    </p>
                  </div>
                </button>
              </div>

              {/* Mobile/Tablet view: Gorgeous Centered Looping Carousel with adjacent card peeks */}
              <div className="lg:hidden relative w-full max-w-lg mx-auto overflow-hidden px-10 sm:px-12 py-6">
                {/* Floating Navigation Chevrons for Circular Connection */}
                <button
                  onClick={() => setActiveCardIndex((prev) => (prev - 1 + 3) % 3)}
                  className={`absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full border backdrop-blur-xl transition-all cursor-pointer z-30 shadow-md ${
                    theme === 'dark'
                      ? 'bg-slate-900/20 border-rose-500/30/80 text-white hover:bg-slate-900/20'
                      : 'bg-white/20 border-rose-500/20 text-slate-700 hover:bg-white/20'
                  }`}
                  aria-label="Previous card"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  onClick={() => setActiveCardIndex((prev) => (prev + 1) % 3)}
                  className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full border backdrop-blur-xl transition-all cursor-pointer z-30 shadow-md ${
                    theme === 'dark'
                      ? 'bg-slate-900/20 border-rose-500/30/80 text-white hover:bg-slate-900/20'
                      : 'bg-white/20 border-rose-500/20 text-slate-700 hover:bg-white/20'
                  }`}
                  aria-label="Next card"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Sliding Carousel track with adjacent card peeks */}
                <div className="w-full flex justify-center">
                  <motion.div 
                    className="flex items-center gap-4 cursor-grab active:cursor-grabbing py-2"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragEnd={(event, info) => {
                      const threshold = 40;
                      if (info.offset.x < -threshold) {
                        setActiveCardIndex((prev) => (prev + 1) % 3);
                      } else if (info.offset.x > threshold) {
                        setActiveCardIndex((prev) => (prev - 1 + 3) % 3);
                      }
                    }}
                    animate={{
                      x: `calc(50% - ${250 / 2}px - ${activeCardIndex * (250 + 16)}px)`
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    style={{ width: 'max-content' }}
                  >
                    {/* CUSTOMER CARD */}
                    <button
                      onClick={() => activeCardIndex === 0 ? setSelectedRole('customer') : setActiveCardIndex(0)}
                      className={`shrink-0 w-[250px] group flex flex-col items-center justify-center text-center p-6 rounded-3xl transition-all duration-500 border backdrop-blur-xl relative overflow-hidden cursor-pointer ${
                        activeCardIndex === 0
                          ? 'scale-102 opacity-100 z-20'
                          : 'scale-90 opacity-40 z-10'
                      } ${
                        theme === 'dark'
                          ? 'bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)]'
                          : 'bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)]'
                      } ${
                        activeCardIndex === 0 
                          ? theme === 'dark'
                            ? 'shadow-[0_20px_45px_rgba(249,115,22,0.25)] border-orange-500/40'
                            : 'shadow-[0_20px_45px_rgba(249,115,22,0.18)] border-orange-400/40'
                          : ''
                      }`}
                    >
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/20 transition-transform duration-300 group-hover:scale-105 shrink-0">
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-extrabold transition-colors text-base mb-1.5 ${
                          theme === 'dark' 
                            ? 'text-white group-hover:text-orange-400' 
                            : 'text-slate-800 group-hover:text-orange-600'
                        }`}>
                          Order Food
                        </h3>
                        <p className={`text-xs leading-relaxed max-w-[190px] mx-auto ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          Browse top restaurants, customize dishes & order hot food
                        </p>
                      </div>
                    </button>

                    {/* RESTAURANT CARD */}
                    <button
                      onClick={() => activeCardIndex === 1 ? setSelectedRole('restaurant') : setActiveCardIndex(1)}
                      className={`shrink-0 w-[250px] group flex flex-col items-center justify-center text-center p-6 rounded-3xl transition-all duration-500 border backdrop-blur-xl relative overflow-hidden cursor-pointer ${
                        activeCardIndex === 1
                          ? 'scale-102 opacity-100 z-20'
                          : 'scale-90 opacity-40 z-10'
                      } ${
                        theme === 'dark'
                          ? 'bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)]'
                          : 'bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)]'
                      } ${
                        activeCardIndex === 1 
                          ? theme === 'dark'
                            ? 'shadow-[0_20px_45px_rgba(239,68,68,0.25)] border-red-500/40'
                            : 'shadow-[0_20px_45px_rgba(239,68,68,0.18)] border-red-400/40'
                          : ''
                      }`}
                    >
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 transition-transform duration-300 group-hover:scale-105 shrink-0">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-extrabold transition-colors text-base mb-1.5 ${
                          theme === 'dark' 
                            ? 'text-white group-hover:text-orange-400' 
                            : 'text-slate-800 group-hover:text-orange-600'
                        }`}>
                          Restaurant Partner
                        </h3>
                        <p className={`text-xs leading-relaxed max-w-[190px] mx-auto ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          Manage incoming cooking tickets, stock statuses & earnings
                        </p>
                      </div>
                    </button>

                    {/* DELIVERY CARD */}
                    <button
                      onClick={() => activeCardIndex === 2 ? setSelectedRole('delivery') : setActiveCardIndex(2)}
                      className={`shrink-0 w-[250px] group flex flex-col items-center justify-center text-center p-6 rounded-3xl transition-all duration-500 border backdrop-blur-xl relative overflow-hidden cursor-pointer ${
                        activeCardIndex === 2
                          ? 'scale-102 opacity-100 z-20'
                          : 'scale-90 opacity-40 z-10'
                      } ${
                        theme === 'dark'
                          ? 'bg-slate-900/20 border-rose-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)]'
                          : 'bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)]'
                      } ${
                        activeCardIndex === 2 
                          ? theme === 'dark'
                            ? 'shadow-[0_20px_45px_rgba(16,185,129,0.25)] border-emerald-500/40'
                            : 'shadow-[0_20px_45px_rgba(16,185,129,0.18)] border-emerald-400/40'
                          : ''
                      }`}
                    >
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105 shrink-0">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-extrabold transition-colors text-base mb-1.5 ${
                          theme === 'dark' 
                            ? 'text-white group-hover:text-emerald-400' 
                            : 'text-slate-800 group-hover:text-emerald-600'
                        }`}>
                          Delivery Executive
                        </h3>
                        <p className={`text-xs leading-relaxed max-w-[190px] mx-auto ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          Accept shipping contracts, view live map routes & payout stats
                        </p>
                      </div>
                    </button>

                    {/* ADMIN CARD */}
                    <button
                      onClick={() => activeCardIndex === 3 ? setSelectedRole('admin') : setActiveCardIndex(3)}
                      className={`shrink-0 w-[250px] group flex flex-col items-center justify-center text-center p-6 rounded-3xl transition-all duration-500 border backdrop-blur-xl relative overflow-hidden cursor-pointer ${
                        activeCardIndex === 3
                          ? 'scale-102 opacity-100 z-20'
                          : 'scale-90 opacity-40 z-10'
                      } ${
                        theme === 'dark'
                          ? 'bg-slate-900/20 border-indigo-500/30/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)]'
                          : 'bg-white/20 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.06)]'
                      } ${
                        activeCardIndex === 3 
                          ? theme === 'dark'
                            ? 'shadow-[0_20px_45px_rgba(99,102,241,0.25)] border-indigo-500/40'
                            : 'shadow-[0_20px_45px_rgba(99,102,241,0.18)] border-indigo-400/40'
                          : ''
                      }`}
                    >
                      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105 shrink-0">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className={`font-extrabold transition-colors text-base mb-1.5 ${
                          theme === 'dark' 
                            ? 'text-white group-hover:text-indigo-400' 
                            : 'text-slate-800 group-hover:text-indigo-600'
                        }`}>
                          System Admin
                        </h3>
                        <p className={`text-xs leading-relaxed max-w-[190px] mx-auto ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          Manage overall operations, manual assignments, and system settings
                        </p>
                      </div>
                    </button>
                  </motion.div>
                </div>

                {/* Mobile/Tablet Carousel Indicators (clickable) */}
                <div className="flex justify-center items-center gap-2 mt-5">
                  {[0, 1, 2, 3].map((idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveCardIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        activeCardIndex === idx 
                          ? 'w-6 bg-orange-500' 
                          : `w-2 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-300 hover:bg-slate-400'}`
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* PHONE AND OTP SCREEN */
            <motion.div
              key="otp-form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 max-w-xl mx-auto w-full"
            >
              <div className="space-y-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${
                  selectedRole === 'customer' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                  selectedRole === 'restaurant' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                  selectedRole === 'admin' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                }`}>
                  {selectedRole === 'customer' ? <Utensils className="w-3.5 h-3.5" /> :
                   selectedRole === 'restaurant' ? <Store className="w-3.5 h-3.5" /> :
                   selectedRole === 'admin' ? <Shield className="w-3.5 h-3.5" /> :
                   <Bike className="w-3.5 h-3.5" />}
                  {selectedRole === 'customer' ? 'Customer' : selectedRole === 'restaurant' ? 'Restaurant Partner' : selectedRole === 'admin' ? 'System Admin' : 'Delivery Rider'}
                </span>
                <h2 className={`text-3xl font-black tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {!otpSent ? 'Login / Register' : 'OTP Verification'}
                </h2>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
                }`}>
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
                /* SEND OTP FORM */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold tracking-wider font-mono ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
                    }`}>PHONE NUMBER</label>
                    <div className={`flex backdrop-blur-md border rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-900/20 border-rose-500/30'
                        : 'bg-white/20 border-rose-500/20'
                    }`}>
                      <div className={`px-4 flex items-center border-r font-mono text-sm ${
                        theme === 'dark' ? 'bg-slate-800/20 text-slate-300 border-rose-500/30' : 'bg-slate-100/60 text-slate-500 dark:text-slate-300 border-rose-500/20'
                      }`}>
                        +91
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className={`flex-1 px-4 py-3.5 bg-transparent outline-none font-mono text-base tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-slate-800'
                        }`}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10 border border-white/20"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5" />
                        Send One-Time OTP
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* VERIFY OTP FORM */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold tracking-wider font-mono ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
                    }`}>ENTER SECURE CODE</label>
                    <div className={`flex backdrop-blur-md border rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-900/20 border-rose-500/30'
                        : 'bg-white/20 border-rose-500/20'
                    }`}>
                      <div className={`px-4 flex items-center border-r ${
                        theme === 'dark' ? 'bg-slate-800/20 border-rose-500/30' : 'bg-slate-100/60 border-rose-500/20'
                      }`}>
                        <KeyRound className="w-4 h-4 text-orange-500" />
                      </div>
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="- - - - - -"
                        className={`flex-1 px-4 py-3.5 bg-transparent outline-none font-mono text-xl text-center tracking-[1em] ${
                          theme === 'dark' ? 'text-white' : 'text-slate-800'
                        }`}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={async () => {
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
                      className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                    >
                      Resend SMS Code
                    </button>
                    <button
                      type="button"
                      onClick={autofillOtp}
                      className={`text-xs font-medium cursor-pointer ${
                        theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800'
                      }`}
                    >
                      Autofill Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 border border-white/20"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Verify & Secure Log In
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
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
        onSuccess={(token) => {
          setShowSessionModal(false);
          setToken(token);
          const decoded = decodeJwt(token);
          const name = decoded?.name || decoded?.phone || phone;
          const id = decoded?.sub;
          const role = selectedRole!;
          setUserProfile({ id, phone, role, name });
          onLoginSuccess(role, phone, name);
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
