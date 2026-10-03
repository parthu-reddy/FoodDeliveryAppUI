import { Input, Select, Surface, surfaceStyle } from '@shared/ui';
import { restaurantApi } from '@/lib/zodiosClients';
import { useBrandOrganisationSelection } from '../../model/useBrandOrganisationSelection';
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, CreditCard, Plus, Sparkles, Store } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React, { useState } from 'react';
import { brandSchema } from '../../model/brandRegistrationSchema';
import { Spinner } from '@shared/ui';

export default function BrandRegistration({ onRefresh }: { onRefresh: () => void }) {
 const formId = React.useId();
 const presets = useMotionPresets();
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
 const { organisationId, setOrganisationId, isLoadingOrganisations, isOrganisationSelectionReady, choices,
   prepareOrganisationSelection, ensureOrganisation } = useBrandOrganisationSelection(isOpen, setError);

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
 organisationId
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
 const targetId = await ensureOrganisation(name);
 await restaurantApi.restaurantOnboarding.post(`/api/v1/brands`, { ...newBrand, organisationId: targetId }, {});
 setIsOpen(false);
 resetForm();
 onRefresh();
 } catch (err: unknown) {
 const axiosErr = err as { response?: { data?: { message?: string, error?: string } }, message?: string };
 setError(axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message || 'Failed to register brand');
 } finally {
 setIsSaving(false);
 }
 };

 if (!isOpen) {
 return (
 <button
 onClick={() => { prepareOrganisationSelection(); setError(''); setIsOpen(true); }}
 className="w-full p-4 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-300 hover:text-rose-500 transition cursor-pointer"
 style={{
 ...surfaceStyle({ variant: 'sunken', radius: 'lg', elevation: 0 }),
 border: '2px dashed var(--color-rose-300)',
 }}
 >
 <Plus className="w-5 h-5" />
 <span className="font-bold text-sm">Register New Brand</span>
 </button>
 );
 }

 return (
 <Surface radius="xl" elevation={1} className="p-5 overflow-hidden">
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
 <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 ">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span className="font-bold">{error}</span>
 </div>
 )}

 <div className="relative">
 {isLoadingOrganisations && <p role="status" className="mb-3 text-sm text-slate-500">Loading your organisations…</p>}
 {choices.length > 0 && (
   <div className="mb-4 space-y-1">
     <label htmlFor="brand-organisation" className="text-xs font-bold text-slate-500">Organisation</label>
     <Select id="brand-organisation" value={organisationId} onChange={setOrganisationId}
       disabled={isSaving} options={choices.map(org => ({ value: org.id, label: org.displayName }))} />
   </div>
 )}
 <AnimatePresence mode="wait">
 {step === 1 && (
 <motion.div
 key="step1" {...presets.slideInX}
 transition={{ duration: 0.3 }}
 className="space-y-4"
 >
 <div className="flex items-center gap-2 text-slate-800 dark:text-[#f0ede6] mb-2 border-b border-rose-500/10 pb-2">
 <Store className="w-4 h-4 text-rose-500" />
 <span className="font-bold text-xs uppercase tracking-wider">Business Details</span>
 </div>
 <div className="space-y-1">
 <label htmlFor={`${formId}-name`} className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Brand Name</label>
 <Input
 id={`${formId}-name`}
 type="text" required value={name} onChange={e => setName(e.target.value)}
 className="font-bold focus:ring-2 focus:ring-rose-500/50"
 placeholder="e.g. KFC"
 />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 <div className="space-y-1">
 <label htmlFor={`${formId}-gstin`} className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">GSTIN (15 char)</label>
 <Input
 id={`${formId}-gstin`}
 type="text" required minLength={15} maxLength={15} value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
 className="font-bold uppercase focus:ring-2 focus:ring-rose-500/50"
 />
 </div>
 <div className="space-y-1">
 <label htmlFor={`${formId}-pan`} className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">PAN (10 char)</label>
 <Input
 id={`${formId}-pan`}
 type="text" required minLength={10} maxLength={10} value={pan} onChange={e => setPan(e.target.value.toUpperCase())}
 className="font-bold uppercase focus:ring-2 focus:ring-rose-500/50"
 />
 </div>
 <div className="space-y-1 col-span-2 sm:col-span-1">
 <label htmlFor={`${formId}-cin`} className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">CIN (21 char)</label>
 <Input
 id={`${formId}-cin`}
 type="text" required minLength={21} maxLength={21} value={cin} onChange={e => setCin(e.target.value.toUpperCase())}
 className="font-bold uppercase focus:ring-2 focus:ring-rose-500/50"
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
 className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black rounded-xl transition flex items-center justify-center gap-2 hover:scale-[1.02]"
 >
 Next <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 )}

 {step === 2 && (
 <motion.div
 key="step2" {...presets.slideInX}
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
 <label htmlFor={`${formId}-bank`} className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Bank Account #</label>
 <Input
 id={`${formId}-bank`}
 type="text" required value={bankAccount} onChange={e => setBankAccount(e.target.value)}
 className="font-bold focus:ring-2 focus:ring-rose-500/50"
 />
 </div>
 <div className="space-y-1">
 <label htmlFor={`${formId}-ifsc`} className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">IFSC Code (11 char)</label>
 <Input
 id={`${formId}-ifsc`}
 type="text" required minLength={11} maxLength={11} value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())}
 className="font-bold uppercase focus:ring-2 focus:ring-rose-500/50"
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
 disabled={isSaving || isLoadingOrganisations || !isOrganisationSelectionReady}
 className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-rose-500 text-white text-sm font-black rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
 >
 {isSaving ? (
 <Spinner size="sm" color="#ffffff" label="" />
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
 </Surface>
 );
}
