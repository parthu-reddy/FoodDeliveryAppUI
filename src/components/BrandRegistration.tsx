import React, { useState } from 'react';
import { Plus, Building, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { apiPost } from '../lib/apiClient';

export default function BrandRegistration({ onRefresh }: { onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [cin, setCin] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
    
    try {
      await apiPost(`/api/v1/brands`, newBrand);
      setIsOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to register brand');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 border-2 border-dashed border-rose-300 dark:border-rose-700/50 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-300 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold text-sm">Register New Brand</span>
      </button>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] p-5 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 text-rose-500 mb-4">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <h4 className="font-extrabold text-sm tracking-tight uppercase">New Brand Registration</h4>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Brand Name</label>
          <input
            type="text" required value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            placeholder="e.g. KFC"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">GSTIN</label>
            <input
              type="text" required minLength={15} maxLength={15} value={gstin} onChange={e => setGstin(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">PAN</label>
            <input
              type="text" required minLength={10} maxLength={10} value={pan} onChange={e => setPan(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">CIN</label>
            <input
              type="text" required minLength={21} maxLength={21} value={cin} onChange={e => setCin(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Bank Account #</label>
            <input
              type="text" required value={bankAccount} onChange={e => setBankAccount(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">IFSC Code</label>
            <input
              type="text" required minLength={11} maxLength={11} value={ifsc} onChange={e => setIfsc(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button" onClick={() => setIsOpen(false)}
            className="flex-1 py-2 rounded-xl border border-rose-500/20 dark:border-rose-500/30 text-slate-600 dark:text-[#f0ede6] text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Register Brand
          </button>
        </div>
      </form>
    </div>
  );
}
