import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, User, Phone, Mail, Car, Image as ImageIcon, AlertCircle, LogOut, ShieldCheck, CheckCircle } from 'lucide-react';
import { deliveryApi, identityApi, walletApi } from "@/lib/zodiosClients";
import { useToast } from '@/contexts/ToastContext';
import ImageUploadField from "@features/kyc/components/ImageUploadField";

import { TransactionHistoryTable, WalletTransaction } from "@shared/ui";
import { z } from 'zod';

import { fromContract } from '../../../lib/untypedResponse';

const riderProfileSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.').max(100, 'Name cannot exceed 100 characters.'),
  email: z.string().min(1, 'Please enter your email address.').email('Please enter a valid email address.').max(255, 'Email cannot exceed 255 characters.'),
  vehicle: z.string().min(1, 'Please enter your vehicle registration.').max(50, 'Vehicle registration cannot exceed 50 characters.'),
  vehicleType: z.string().min(1, 'Please select your vehicle type.'),
  photoUrl: z.string().url('Please enter a valid URL for your profile photo.').max(1000, 'URL cannot exceed 1000 characters.').optional().or(z.literal(''))
});

interface RiderSettingsViewProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  onLogout: () => void;
  isProfileMandatory: boolean;
  riderPhone: string;
  onProfileUpdated: () => void;
}

export default function RiderSettingsView({
  onBack,
  onLogout,
  isProfileMandatory,
  riderPhone,
  onProfileUpdated
}: RiderSettingsViewProps) {
  // Identity Service Profile
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [initialName, setInitialName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');

  // Delivery Profile
  const [editVehicle, setEditVehicle] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('BICYCLE');
  const [editPhoto, setEditPhoto] = useState('');

  // Document Verification State

  const [verificationStatus, setVerificationStatus] = useState<{ allDocsApproved?: boolean; bankApproved?: boolean } | null>(null);

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessions, setSessions] = useState<{ id: string; deviceInfo?: string; ipAddress?: string; lastActive: string | number }[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const { showSuccess, showError } = useToast();
  
  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await identityApi.auth.get('/api/v1/internal/auth/sessions', { headers: { 'X-Calling-Service': 'DeliveryExecutiveApplication' } });
      if (res?.data) {
        // @ts-expect-error auto-migration type suppression
        setSessions(res.data);
      }
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await identityApi.auth.delete('/api/v1/internal/auth/sessions/:sessionId', undefined, { params: { sessionId }, headers: { 'X-Calling-Service': 'DeliveryExecutiveApplication' } });
      await loadSessions();
    } catch (e: unknown) {
      // @ts-expect-error auto-migration type suppression
      if (e.status === 401) {
        window.location.assign('/');
      } else {
        console.error(e);
        showError('Failed to revoke session');
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Identity Profile
        const identityRes = await identityApi.user.get('/api/v1/users/profile', { headers: { "X-User-Id": riderPhone || "" } });
        if (identityRes?.data) {
          setEditName(identityRes.data.name || '');
          setInitialName(identityRes.data.name || '');
          setEditEmail(identityRes.data.email || '');
          setInitialEmail(identityRes.data.email || '');
          setUserId(identityRes.data.id || '');
        }

        // Load Delivery Profile
        const deliveryRes = await deliveryApi.deliveryExecutive.get('/api/delivery/profile', { queries: { phoneNumber: riderPhone || "" }, headers: { "X-User-Id": riderPhone || "" } });
        if (deliveryRes && deliveryRes.data) {
          const profile = deliveryRes.data;
          setEditVehicle(profile.vehicleNumber || '');
          setEditVehicleType(profile.vehicleType || 'BICYCLE');
          setEditPhoto(profile.photoUrl || '');
          if (profile.fullName && !identityRes?.data?.name) {
             setEditName(profile.fullName);
             setInitialName(profile.fullName);
          }
        }

        // Load Verification Status
        try {
          const verRes = await deliveryApi.deliveryVerification.get(`/api/delivery/verification/status`, {});
          if (verRes?.data) {
            setVerificationStatus(verRes.data);
          }
        } catch (verErr: unknown) {
          console.error("Error loading verification status:", verErr);
        }
      } catch (e: unknown) {
        // @ts-expect-error auto-migration type suppression
        if (e?.status !== 404) {
          console.error("Error loading profile:", e);
        }
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [riderPhone]);

  const loadWalletData = useCallback(async (page: number) => {
    if (!userId) return;
    setTxLoading(true);
    try {
      const balanceRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId', { params: { entityType: 'DRIVER', entityId: userId } });
      if (balanceRes) setWalletBalance(balanceRes.balance ?? 0);
      
      const txRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId/transactions', { params: { entityType: 'DRIVER', entityId: userId }, queries: { page } });
      if (txRes.data) {
        const typedTxRes = txRes as { content?: unknown[], totalPages?: number };
        setTransactions(fromContract(typedTxRes.content ?? []) as WalletTransaction[]);
        setTxTotalPages(txRes.totalPages || 1);
      }
    } catch (e: unknown) {
      console.warn("Error loading wallet data:", e);
    } finally {
      setTxLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadWalletData(txPage);
    }
  }, [userId, txPage, loadWalletData]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const validation = riderProfileSchema.safeParse({
      name: editName.trim(),
      email: editEmail.trim(),
      vehicle: editVehicle.trim(),
      vehicleType: editVehicleType,
      photoUrl: editPhoto.trim()
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    
    try {
      // 1. Update Identity Profile if not set
      if (!initialName || !initialEmail) {
         await identityApi.user.put('/api/v1/users/profile', {
                    id: userId,
                    name: editName,
                    email: editEmail,
                    phone: riderPhone
                  }, { headers: { "X-User-Id": userId || riderPhone || "" } });
      }

      // 2. Onboard/Update Delivery Profile
      await deliveryApi.deliveryExecutive.post('/api/delivery/onboard', {
              phoneNumber: riderPhone,
              fullName: editName,
              vehicleNumber: editVehicle,
              vehicleType: editVehicleType as "BICYCLE" | "EV_TWO_WHEELER" | "MCWG" | "LMV",
              photoUrl: editPhoto
            });

      // Refresh unified profile data in parent dashboard
      onProfileUpdated();
      showSuccess('Profile updated successfully');

    } catch (e: unknown) {
      console.error(e);
      const typedErr = e as { response?: { data?: { error?: string } }, message?: string };
      setErrorMsg(typedErr.response?.data?.error || typedErr.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent max-w-3xl mx-auto mt-2"
    >
      <div className="flex items-center gap-3 shrink-0 mb-2">
        {!isProfileMandatory && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Rider Settings</h4>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {isProfileMandatory ? 'Please complete your profile to go online.' : 'Manage your driver profile and account'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pr-1">
        <form onSubmit={saveProfile} className="space-y-4">
          
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-red-600 dark:text-red-400 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. John Doe"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={!!initialName}
              className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors ${initialName ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50 focus:bg-white/40 dark:focus:bg-slate-900/40'}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input 
              type="email" 
              required
              placeholder="rider@example.com"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={!!initialEmail}
              className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors ${initialEmail ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50 focus:bg-white/40 dark:focus:bg-slate-900/40'}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Phone className="w-3.5 h-3.5" /> Phone Number
            </label>
            <input 
              type="tel" 
              value={riderPhone}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md text-sm font-medium text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Car className="w-3.5 h-3.5" /> Vehicle Registration
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. KA01AB1234"
              value={editVehicle}
              onChange={(e) => setEditVehicle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors focus:border-rose-500/50 focus:bg-white/40 dark:focus:bg-slate-900/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Car className="w-3.5 h-3.5" /> Vehicle Type
            </label>
            <select
              value={editVehicleType}
              onChange={(e) => setEditVehicleType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors focus:border-rose-500/50 focus:bg-white/40 dark:focus:bg-slate-900/40 appearance-none"
            >
              <option value="BICYCLE">Bicycle (No License Required)</option>
              <option value="EV_TWO_WHEELER">EV Two-Wheeler</option>
              <option value="MCWG">Motorcycle / Scooter (MCWG)</option>
              <option value="LMV">Light Motor Vehicle (Car)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <ImageIcon className="w-3.5 h-3.5" /> Profile Photo URL
            </label>
            <ImageUploadField 
              value={editPhoto} 
              onChange={setEditPhoto} 
              folderId={userId || 'default_rider'} 
              placeholder="Profile Photo URL" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        <div className="pt-8 mt-8 border-t border-rose-500/20 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Document Verification
            </h4>
            <div className="mt-4 p-4 rounded-xl bg-white/10 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">Verification Status</p>
                <p className="text-xs text-slate-500 mt-1">
                  Documents: {verificationStatus?.allDocsApproved ? <span className="text-emerald-500 font-bold">Approved</span> : <span className="text-amber-500 font-bold">Pending</span>} | 
                  Bank: {verificationStatus?.bankApproved ? <span className="text-emerald-500 font-bold">Approved</span> : <span className="text-amber-500 font-bold">Pending</span>}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
                {verificationStatus?.allDocsApproved && verificationStatus?.bankApproved ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-rose-500/20">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">Logged-in Devices</h4>
          </div>
          <div className="space-y-2">
            {isLoadingSessions ? (
              <div className="text-center text-slate-500 text-sm py-8">Loading devices...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                No active sessions found.
              </div>
            ) : (
              sessions.map((s: unknown) => {
                const session = s as { id?: string; sessionId?: string; deviceInfo?: string; browser?: string; os?: string; serviceName?: string; lastActive?: number };
                const sessionId = session.sessionId || session.id || "";
                const os = session.os || "Unknown";
                const browser = session.browser || "Unknown";
                return (
                <div key={sessionId} className="p-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex-1 overflow-hidden pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        RIDER
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {os} • {browser}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate" title={session.deviceInfo}>{session.deviceInfo || 'Unknown Device'}</p>
                    <p className="text-[9px] text-rose-500 mt-0.5">Last Active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : ''}</p>
                  </div>
                  <button
                    onClick={() => revokeSession(sessionId)}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold p-1 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Wallet Transactions */}
        <div className="pt-8 mt-8 border-t border-rose-500/20">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">Earnings Wallet</h4>
            <span className="font-black text-slate-900 dark:text-[#f0ede6] text-lg">₹{walletBalance.toFixed(2)}</span>
          </div>
          <TransactionHistoryTable 
            transactions={transactions}
            isLoading={txLoading}
            page={txPage}
            totalPages={txTotalPages}
            onPageChange={setTxPage}
          />
        </div>
        
        <div className="pt-4 mt-8">
          <button 
            onClick={onLogout}
            className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

      </div>
    </motion.div>
  );
}
