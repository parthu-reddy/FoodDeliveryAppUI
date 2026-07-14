import React, { useState } from 'react';
import { Plus, Store, CheckCircle } from 'lucide-react';
import { apiPost } from '../lib/apiClient';

interface OutletRegistrationProps {
  onRefresh: () => void;
  brandId: string;
}

export default function OutletRegistration({ onRefresh, brandId }: OutletRegistrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [fssai, setFssai] = useState('');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
  
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("23:00");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOutlet = {
      name,
      fssaiLicenseNumber: fssai,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      openingTime: openingTime + ":00",
      closingTime: closingTime + ":00",
      bannerUrl: banner,
      createdAt: new Date().toISOString()
    };

    // Use brandId from props

    await apiPost(`/api/v1/brands/${brandId}/outlets`, newOutlet);

    setIsOpen(false);
    setName('');
    setFssai('');
    setLat("12.9716");
    setLng("77.5946");
    setOpeningTime("09:00");
    setClosingTime("23:00");
    onRefresh();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 border-2 border-dashed border-rose-500/30 dark:border-rose-500/30 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold text-sm">Register New Outlet</span>
      </button>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] p-5 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 text-orange-500 mb-4">
        <Store className="w-5 h-5" />
        <h4 className="font-extrabold text-sm tracking-tight uppercase">New Outlet Registration</h4>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Outlet Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            placeholder="e.g. Bella Italia (Downtown)"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">FSSAI License</label>
            <input
              type="text"
              required
              value={fssai}
              onChange={e => setFssai(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="14-digit FSSAI number"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Banner Image URL</label>
            <input
              type="url"
              required
              value={banner}
              onChange={e => setBanner(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Latitude</label>
            <input
              type="number"
              step="any"
              required
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Longitude</label>
            <input
              type="number"
              step="any"
              required
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Opening Time</label>
            <input
              type="time"
              required
              value={openingTime}
              onChange={e => setOpeningTime(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Closing Time</label>
            <input
              type="time"
              required
              value={closingTime}
              onChange={e => setClosingTime(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2 rounded-xl border border-rose-500/20 dark:border-rose-500/30 text-slate-600 dark:text-[#f0ede6] text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Register Outlet
          </button>
        </div>
      </form>
    </div>
  );
}
