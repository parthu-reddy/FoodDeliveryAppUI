import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { RiderWalletSection } from '@features/delivery-tasks/components/RiderWalletSection';
import { useRiderSettingsForm } from '@features/delivery-tasks/model/useRiderSettingsForm';
import { Button, Input, Select, Surface } from '@shared/ui';
import { ActiveSessions } from "@shared/ui/ActiveSessions";
import { AlertCircle, Car, CheckCircle, Image as ImageIcon, LogOut, Mail, Phone, ShieldCheck, User, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';

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
  const {
    editName, setEditName,
    editEmail, setEditEmail,
    editVehicle, setEditVehicle,
    editVehicleType, setEditVehicleType,
    editPhoto, setEditPhoto,
    userId,
    initialName,
    initialEmail,
    verificationStatus,
    isSaving,
    errorMsg,
    saveProfile,
  } = useRiderSettingsForm({ riderPhone, onProfileUpdated });
  






  const presets = useMotionPresets();
  return (
    <motion.div {...presets.fade} 
      className="w-full p-5 flex flex-col space-y-4 bg-transparent max-w-3xl mx-auto mt-2"
    >
      <div className="flex items-center gap-3 shrink-0 mb-2">
        {!isProfileMandatory && (
          <Button
            variant="secondary"
            size="touch-icon"
            aria-label="Close settings"
            onClick={onBack}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Rider Settings</h4>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {isProfileMandatory ? 'Please complete your profile to go online.' : 'Manage your driver profile and account'}
          </p>
        </div>
      </div>

      <div className="flex-1 pr-1">
        <form onSubmit={saveProfile} className="space-y-4">
          
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <Input
              type="text"
              inputSize="lg"
              required
              placeholder="e.g. John Doe"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={!!initialName}
              className="font-medium focus:ring-2 focus:ring-rose-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <Input
              type="email"
              inputSize="lg"
              required
              placeholder="rider@example.com"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={!!initialEmail}
              className="font-medium focus:ring-2 focus:ring-rose-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Phone className="w-3.5 h-3.5" /> Phone Number
            </label>
            <Input
              type="tel"
              inputSize="lg"
              value={riderPhone}
              disabled
              className="font-medium opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Car className="w-3.5 h-3.5" /> Vehicle Registration
            </label>
            <Input
              type="text"
              inputSize="lg"
              required
              placeholder="e.g. KA01AB1234"
              value={editVehicle}
              onChange={(e) => setEditVehicle(e.target.value)}
              className="font-medium focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
               <Car className="w-3.5 h-3.5" /> Vehicle Type
            </label>
            <Select
              selectSize="lg"
              aria-label="Vehicle Type"
              value={editVehicleType}
              onChange={setEditVehicleType}
              options={[
                { value: 'BICYCLE', label: 'Bicycle (No License Required)' },
                { value: 'EV_TWO_WHEELER', label: 'EV Two-Wheeler' },
                { value: 'MCWG', label: 'Motorcycle / Scooter (MCWG)' },
                { value: 'LMV', label: 'Light Motor Vehicle (Car)' },
              ]}
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
            <Button type="submit" size="touch" fullWidth loading={isSaving}>
              Save Profile Changes
            </Button>
          </div>
        </form>

        <div className="pt-8 mt-8 border-t border-rose-500/20 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#f0ede6] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Document Verification
            </h4>
            <Surface radius="md" elevation={0} className="mt-4 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">Verification Status</p>
                <p className="text-xs text-slate-500 mt-1">
                  Documents: {verificationStatus?.allDocsApproved ? <span className="text-amber-500 font-bold">Approved</span> : <span className="text-amber-500 font-bold">Pending</span>} | 
                  Bank: {verificationStatus?.bankApproved ? <span className="text-amber-500 font-bold">Approved</span> : <span className="text-amber-500 font-bold">Pending</span>}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
                {verificationStatus?.allDocsApproved && verificationStatus?.bankApproved ? <CheckCircle className="w-5 h-5 text-amber-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
              </div>
            </Surface>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-rose-500/20">
          <ActiveSessions callingService="DeliveryExecutiveApplication" />
        </div>

        <RiderWalletSection userId={userId} />
        
        <div className="pt-4 mt-8">
          <Button
            variant="secondary"
            size="touch"
            fullWidth
            onClick={onLogout}
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>

      </div>
    </motion.div>
  );
}
