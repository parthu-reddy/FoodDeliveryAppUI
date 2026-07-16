import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '../lib/apiClient';
import { getToken } from '../lib/tokenStore';
import { MenuItem } from '../types';

interface OutletMenuEditorProps {
  restaurantId: string; // Outlet ID
  brandId: string;      // Brand UUID from the backend
  menuList: MenuItem[];
  onRefresh: () => void;
}

export default function OutletMenuEditor({ restaurantId, brandId, menuList, onRefresh }: OutletMenuEditorProps) {
  const [selectedOutlet, setSelectedOutlet] = useState<string>(restaurantId);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isAddingOutletItem, setIsAddingOutletItem] = useState(false);

  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [mName, setMName] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [mCatId, setMCatId] = useState('');
  const [mImg, setMImg] = useState('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80');
  const [mVeg, setMVeg] = useState(true);

  // Override states
  const [overrides, setOverrides] = useState<any[]>([]);
  const [isAddingOverride, setIsAddingOverride] = useState<string | null>(null);
  const [oPrice, setOPrice] = useState('');
  const [oActive, setOActive] = useState(true);

  useEffect(() => {
    if (restaurantId && restaurantId !== selectedOutlet) {
      setSelectedOutlet(restaurantId);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOverrides(selectedOutlet);
  }, [selectedOutlet]);

  useEffect(() => {
    if (brandId) {
      fetchCategories();
      fetchMasterItems();
      fetchOutlets();
    }
  }, [brandId]);

  const fetchCategories = async () => {
    try {
      const data = await apiGet('/api/v1/categories');
      setCategories(data.data || []);
      if (data.data && data.data.length > 0) {
          setMCatId(data.data[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchOutlets = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await apiGet(`/api/v1/brands/${brandId}/outlets`);
      setOutlets(response.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchMasterItems = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await apiGet(`/api/v1/brands/${brandId}/master-menu`);
      setMasterItems(response.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchOverrides = async (targetOutlet: string) => {
    if (!targetOutlet) return;
    try {
      const response = await apiGet(`/api/v1/outlets/${targetOutlet}/menu-overrides`);
      setOverrides(response.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateOverride = async (e: React.FormEvent, masterItemId: string) => {
    e.preventDefault();
    const payload = {
      price: oPrice ? parseFloat(oPrice) : undefined,
      isAvailable: oActive
    };
    await apiPost(`/api/v1/outlets/${selectedOutlet}/menu-overrides/${masterItemId}`, payload);
    setIsAddingOverride(null);
    setOPrice("");
    setOActive(true);
    fetchOverrides(selectedOutlet);
    onRefresh();
  };

  const handleCreateOutletItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: mName,
      basePrice: parseFloat(mPrice) || 0,
      description: mDesc,
      categoryId: mCatId,
      imageUrl: mImg,
      isVeg: mVeg,
      defaultPrepTimeMinutes: 15
    };
    const newMaster = await apiPost(`/api/v1/brands/${brandId}/master-menu`, payload);
    const overridePayload = {
      price: oPrice ? parseFloat(oPrice) : undefined,
      isAvailable: oActive
    };
    await apiPost(`/api/v1/outlets/${selectedOutlet}/menu-overrides/${newMaster.data.id}`, overridePayload);
    setIsAddingOutletItem(false);
    setMName(""); setMPrice(""); setMDesc(""); setOPrice(""); setOActive(true);
    fetchMasterItems();
    fetchOverrides(selectedOutlet);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider">Configure Overrides</h5>
            <button onClick={() => setIsAddingOutletItem(true)} className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">
              <Plus className="w-3 h-3" /> Add Outlet Item
            </button>

          </div>


        </div>
        {isAddingOutletItem && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-4">
            <h6 className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6] mb-3">Add New Item for Outlet</h6>
            <form onSubmit={handleCreateOutletItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
                <input required type="number" step="0.01" placeholder="Master Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]" />
                <select required value={mCatId} onChange={e=>setMCatId(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase block mb-1">Override Price (Optional)</label>
                  <input type="number" step="0.01" placeholder="Override Price" value={oPrice} onChange={e=>setOPrice(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase block mb-1">Status</label>
                  <select value={oActive ? "true" : "false"} onChange={e=>setOActive(e.target.value === "true")} className="w-full bg-white dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingOutletItem(false)} className="flex-1 py-2 rounded-lg border border-rose-500/20 dark:border-rose-500/30 text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600">Save Outlet Item</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {masterItems.map(item => {
            const currentOverride = overrides.find(o => o.masterMenuItemId === item.id);
            const isOverriding = isAddingOverride === item.id;
            
            return (
              <div key={item.id} className="bg-white/50 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6]">{item.name}</h6>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1">{item.categoryName || 'Food'}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-300">Base: ${item.basePrice.toFixed(2)}</span>
                      {currentOverride && (
                        <>
                          {currentOverride.price !== undefined && <span className="text-xs font-bold text-rose-500">Override: ${currentOverride.price.toFixed(2)}</span>}
                          <span className={`text-xs font-bold ${currentOverride.isAvailable ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-300'}`}>{currentOverride.isAvailable ? 'Active' : 'Inactive'}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!isOverriding && (
                    <button onClick={() => { setIsAddingOverride(item.id); setOPrice(currentOverride?.price?.toString() || ''); setOActive(currentOverride?.isAvailable ?? true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-300 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isOverriding && (
                  <form onSubmit={(e) => handleCreateOverride(e, item.id)} className="mt-4 pt-4 border-t border-rose-500/20 dark:border-rose-500/30 flex gap-3 items-end">
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Override Price</label>
                      <input type="number" step="0.01" value={oPrice} onChange={e=>setOPrice(e.target.value)} placeholder={`Base: ${item.basePrice}`} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase block">Status</label>
                      <select value={oActive ? 'true' : 'false'} onChange={e=>setOActive(e.target.value === 'true')} className="bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]">
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 h-9">Save</button>
                    <button type="button" onClick={() => setIsAddingOverride(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-[#f0ede6] text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 h-9">Cancel</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
