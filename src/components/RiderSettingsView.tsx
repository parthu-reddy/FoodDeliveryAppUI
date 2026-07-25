import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, User, Phone, Mail, Car, Image as ImageIcon, AlertCircle, LogOut } from 'lucide-react';
import { apiGet, apiPut, apiDelete, apiPost } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import ImageUploadField from './ImageUploadField';
import { z } from 'zod';

const riderProfileSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.').max(100, 'Name cannot exceed 100 characters.'),
  email: z.string().min(1, 'Please enter your email address.').email('Please enter a valid email address.').max(255, 'Email cannot exceed 255 characters.'),
  vehicle: z.string().min(1, 'Please enter your vehicle registration.').max(50, 'Vehicle registration cannot exceed 50 characters.'),
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
  const [editPhoto, setEditPhoto] = useState('');

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await apiGet('/api/v1/internal/auth/sessions');
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
      await apiDelete(`/api/v1/internal/auth/sessions/${sessionId}`);
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
        const identityRes = await apiGet('/api/v1/users/profile');
        if (identityRes?.data) {
          setEditName(identityRes.data.name || '');
          setInitialName(identityRes.data.name || '');
          setEditEmail(identityRes.data.email || '');
          setInitialEmail(identityRes.data.email || '');
          setUserId(identityRes.data.id || '');
        }

        // Load Delivery Profile
        const deliveryRes = await apiGet(`/api/delivery/profile?phoneNumber=${encodeURIComponent(riderPhone)}`);
        if (deliveryRes && deliveryRes.data) {
          const profile = deliveryRes.data;
          setEditVehicle(profile.vehicleNumber || '');
          setEditPhoto(profile.photoUrl || '');
          // Delivery Profile might also have fullName but identity has it too.
          if (profile.fullName && !identityRes?.data?.name) {
             setEditName(profile.fullName);
             setInitialName(profile.fullName);
          }
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

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const validation = riderProfileSchema.safeParse({
      name: editName.trim(),
      email: editEmail.trim(),
      vehicle: editVehicle.trim(),
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
         await apiPut('/api/v1/users/profile', {
           id: userId,
           name: editName,
           email: editEmail,
           phone: riderPhone
         });
      }

      // 2. Onboard/Update Delivery Profile
      await apiPost('/api/delivery/onboard', {
        phoneNumber: riderPhone,
        fullName: editName,
        vehicleNumber: editVehicle,
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
              className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors ${!!initialName ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50 focus:bg-white/40 dark:focus:bg-slate-900/40'}`}
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
              className={`w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-sm font-medium text-slate-900 dark:text-[#f0ede6] outline-none transition-colors ${!!initialEmail ? 'opacity-70 cursor-not-allowed' : 'focus:border-rose-500/50 focus:bg-white/40 dark:focus:bg-slate-900/40'}`}
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
        
        <div className="pt-4">
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
