import { restaurantApi } from '@/lib/zodiosClients';
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, CreditCard, Plus, Sparkles, Store } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { z } from 'zod';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required.').max(100, 'Brand name cannot exceed 100 characters.'),
  gstin: z.string().length(15, 'GSTIN must be exactly 15 characters.'),
  pan: z.string().length(10, 'PAN must be exactly 10 characters.'),
  cin: z.string().length(21, 'CIN must be exactly 21 characters.'),
  bankAccount: z.string().min(1, 'Bank Account is required.').max(30, 'Bank Account number too long.'),
  ifsc: z.string().length(11, 'IFSC must be exactly 11 characters.'),
  logoUrl: z.string().url('Invalid Logo URL.').max(1000, 'Logo URL cannot exceed 1000 characters.').optional().or(z.literal(''))
});

export default function BrandRegistration({ onRefresh }: { onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [cin, setCin] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setStep(1);
    setName('');
    setGstin('');
    setPan('');
    setCin('');
    setBankAccount('');
    setIfsc('');
    setLogoUrl('');
    setError('');
  };

  const handleNext = () => {
    setError('');
    if (!name.trim()) {
      setError('Brand Name is required');
      return;
    }
    if (gstin.length !== 15) {
      setError('GSTIN must be exactly 15 characters');
      return;
    }
    if (pan.length !== 10) {
      setError('PAN must be exactly 10 characters');
      return;
    }
    if (cin.length !== 21) {
      setError('CIN must be exactly 21 characters');
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    const newBrand = {
      name,
      gstin,
      pan,
      cin,
      bankAccountNumber: bankAccount,
      ifscCode: ifsc,
      logoUrl,
      owner: 'Logged In User',
      createdAt: new Date().toISOString()
    };
    
    const validation = brandSchema.safeParse({
      name: newBrand.name,
      gstin: newBrand.gstin,
      pan: newBrand.pan,
      cin: newBrand.cin,
      bankAccount: newBrand.bankAccountNumber,
      ifsc: newBrand.ifscCode,
      logoUrl: newBrand.logoUrl
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    
    try {
      setIsSaving(true);
      await restaurantApi.restaurantOnboarding.post(`/api/v1/brands`, newBrand, {});
      setIsOpen(false);
      resetForm();
      onRefresh();
    } catch (err: unknown) {
      // @ts-expect-error auto-migration type suppression
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).response?.data?.message || (err as any).response?.data?.error || err.message || 'Failed to register brand');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 border-2 border-dashed border-rose-300 dark:border-rose-700/50 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-300 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)]"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold text-sm">Register New Brand</span>
      </button>
    );
  }

  return (
    <div className="bg-white/20 dark:bg-slate-900/20 border border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] p-5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-rose-500">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h4 className="font-extrabold text-sm tracking-tight uppercase">New Brand Registration</h4>
        </div>
        <div className="flex gap-1.5">
          <div className={`h-1.5 w-6 rounded-full transition-colors ${step >= 1 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <div className={`h-1.5 w-6 rounded-full transition-colors ${step >= 2 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-slate-800 dark:text-[#f0ede6] mb-2 border-b border-rose-500/10 pb-2">
                <Store className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-xs uppercase tracking-wider">Business Details</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Brand Name</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  placeholder="e.g. KFC"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">GSTIN (15 char)</label>
                  <input
                    type="text" required minLength={15} maxLength={15} value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50 uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">PAN (10 char)</label>
                  <input
                    type="text" required minLength={10} maxLength={10} value={pan} onChange={e => setPan(e.target.value.toUpperCase())}
                    className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50 uppercase"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">CIN (21 char)</label>
                  <input
                    type="text" required minLength={21} maxLength={21} value={cin} onChange={e => setCin(e.target.value.toUpperCase())}
                    className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50 uppercase"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Brand Logo</label>
                <ImageUploadField 
                  value={logoUrl} 
                  onChange={setLogoUrl} 
                  folderId={name ? name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'default' : 'default'} 
                  placeholder="Logo Image URL (Optional)" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => { setIsOpen(false); resetForm(); }}
                  className="w-1/3 py-2.5 rounded-xl border border-rose-500/20 text-slate-600 dark:text-[#f0ede6] text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={handleNext}
                  className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-slate-800 dark:text-[#f0ede6] mb-2 border-b border-rose-500/10 pb-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-xs uppercase tracking-wider">Bank Details</span>
              </div>
              
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Bank details are strictly verified against the PAN provided in Step 1. Ensure the account belongs to the registered entity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Bank Account #</label>
                  <input
                    type="text" required value={bankAccount} onChange={e => setBankAccount(e.target.value)}
                    className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">IFSC Code (11 char)</label>
                  <input
                    type="text" required minLength={11} maxLength={11} value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())}
                    className="w-full bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50 uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl border border-rose-500/20 text-slate-600 dark:text-[#f0ede6] text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
                >
                  {isSaving ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isSaving ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
