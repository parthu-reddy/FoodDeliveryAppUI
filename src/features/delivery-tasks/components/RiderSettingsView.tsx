import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, User, Phone, Mail, Car, Image as ImageIcon, AlertCircle, LogOut, ShieldCheck, CheckCircle } from 'lucide-react';
import { deliveryApi, identityApi, walletApi } from "@/lib/zodiosClients";
import { useToast } from '@/contexts/ToastContext';
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import DocumentUploadField from "@features/kyc/components/DocumentUploadField";
import { TransactionHistoryTable, WalletTransaction } from "@shared/ui";
import { z } from 'zod';
import { parseApiError } from '@/lib/parseApiError';

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
  theme,
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
  const [dlNumber, setDlNumber] = useState('');
  const [dob, setDob] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [dlDocumentKey, setDlDocumentKey] = useState('');
  const [rcDocumentKey, setRcDocumentKey] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [selfieDocumentKey, setSelfieDocumentKey] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<string | null>(null);
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
        setSessions(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await identityApi.auth.delete('/api/v1/internal/auth/sessions/:sessionId', undefined, { params: { sessionId }, headers: { 'X-Calling-Service': 'DeliveryExecutiveApplication' } });
      await loadSessions();
    } catch (e: any) {
      if (e.status === 401) {
        window.location.href = '/';
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
        } catch (verErr: any) {
          console.error("Error loading verification status:", verErr);
        }
      } catch (e: any) {
        if (e?.status !== 404) {
          console.error("Error loading profile:", e);
        }
      }
    };

    loadData();
    loadSessions();
  }, [riderPhone]);

  useEffect(() => {
    if (userId) {
      loadWalletData(txPage);
    }
  }, [userId, txPage]);

  const loadWalletData = async (page: number) => {
    if (!userId) return;
    setTxLoading(true);
    try {
      const balanceRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId', { params: { entityType: 'DRIVER', entityId: userId } });
      if (balanceRes.data) setWalletBalance(balanceRes.data.balance);
      
      const txRes = await walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId/transactions', { params: { entityType: 'DRIVER', entityId: userId }, queries: { page } });
      if (txRes.data) {
        setTransactions(txRes.data.content || []);
        setTxTotalPages(txRes.data.totalPages || 1);
      }
    } catch (e) {
      console.warn("Error loading wallet data:", e);
    } finally {
      setTxLoading(false);
    }
  };

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

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.response?.data?.error || e.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const submitVerificationDoc = async (type: string, payload: any) => {
    setIsSubmittingDoc(type);
    try {
      let res: any;
      switch (type) {
        case 'vehicle-rc':
          res = await deliveryApi.deliveryVerification.post('/api/delivery/verification/vehicle-rc', payload);
          break;
        case 'driving-license':
          res = await deliveryApi.deliveryVerification.post('/api/delivery/verification/driving-license', payload);
          break;
        case 'biometric':
          res = await deliveryApi.deliveryVerification.post('/api/delivery/verification/biometric', payload);
          break;
        case 'bank-account':
          res = await deliveryApi.deliveryVerification.post('/api/delivery/verification/bank-account', payload);
          break;
        default:
          throw new Error('Invalid document type');
      }
      showSuccess(res.message || 'Document submitted for verification');
      // Reload status
      const verRes = await deliveryApi.deliveryVerification.get(`/api/delivery/verification/status`, {});
      if (verRes?.data) setVerificationStatus(verRes.data);
    } catch (e: any) {
      showError(e.response?.data?.error || 'Failed to submit document');
    } finally {
      setIsSubmittingDoc(null);
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
              <p className="text-xs text-slate-500">Loading devices...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-500">No active devices found.</p>
            ) : (
              sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/10 dark:bg-slate-900/10 border border-rose-500/10 backdrop-blur-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-[#f0ede6]">{s.deviceInfo || 'Unknown Device'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">IP: {s.ipAddress}</p>
                    <p className="text-[10px] text-slate-500">Last active: {new Date(s.lastActive).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => revokeSession(s.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    title="Sign out this device"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ))
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
