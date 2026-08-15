import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit3, X, Clock, Save, Layers } from 'lucide-react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '../../lib/zodiosClients';
import { MenuItem } from '../../types';
import CategorySelector from './CategorySelector';
import ImageUploadField from '../shared/ImageUploadField';
import { z } from 'zod';

const masterItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Item name cannot exceed 100 characters'),
  basePrice: z.number().min(0, 'Base price cannot be negative'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  imageUrl: z.string().url('Invalid Image URL').max(1000, 'URL too long').optional().or(z.literal(''))
});

const overrideSchema = z.object({
  overriddenPrice: z.number().min(0, 'Override price cannot be negative').nullable().optional(),
  overriddenPrepTimeMinutes: z.number().min(1, 'Prep time must be at least 1 min').nullable().optional()
});

interface OutletMenuEditorProps {
  restaurantId: string; // Outlet ID
  brandId: string;      // Brand UUID from the backend
  menuList: MenuItem[];
  onRefresh: () => void;
}

export default function OutletMenuEditor({ restaurantId, brandId, menuList, onRefresh }: OutletMenuEditorProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [selectedOutlet, setSelectedOutlet] = useState<string>(restaurantId);
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Override Add/Edit State
  const [addingItemToCatId, setAddingItemToCatId] = useState<string | null>(null);
  const [isAddingOverride, setIsAddingOverride] = useState<string | null>(null);

  // General Item Add State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [mCatId, setMCatId] = useState('');
  
  // Create New Outlet Item State
  const [mName, setMName] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mPackingCharge, setMPackingCharge] = useState('0');
  const [mPrepTime, setMPrepTime] = useState('15');
  const [mDesc, setMDesc] = useState('');
  const [mImg, setMImg] = useState('');
  const [mVeg, setMVeg] = useState(true);
  
  // Override Value State
  const [oPrice, setOPrice] = useState('');
  const [oPrepTime, setOPrepTime] = useState('');
  const [oActive, setOActive] = useState(true);
  const [overrides, setOverrides] = useState<any[]>([]);

  // Category Timing Edit State
  const [editingTimingCatId, setEditingTimingCatId] = useState<string | null>(null);
  const [tOpening, setTOpening] = useState('00:00');
  const [tClosing, setTClosing] = useState('23:59');

  useEffect(() => {
    if (restaurantId && restaurantId !== selectedOutlet) {
      setSelectedOutlet(restaurantId);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOverrides(selectedOutlet);
  }, [selectedOutlet]);

  useEffect(() => {
    if (brandId && selectedOutlet) {
      fetchCategories();
      fetchMasterItems();
    }
  }, [brandId, selectedOutlet]);

  const fetchCategories = async () => {
    try {
      const data = await (customerApi.get as any)(`/api/v1/brands/${brandId}/categories`);
      if (data.success && data.data) {
        const updatedCategories = await Promise.all(
          data.data.map(async (cat: any) => {
            let catData = { ...cat };
            try {
                // Fetch outlet timings
                const oRes = await (customerApi.get as any)(`/api/v1/outlets/${selectedOutlet}/categories/${cat.id}/timings`);
                if (oRes.success && oRes.data && oRes.data.length > 0) {
                    catData.timings = oRes.data;
                } else {
                    catData.timings = [];
                }
            } catch (e) { catData.timings = []; }
            
            try {
                // Fetch brand timings as fallback
                const bRes = await (customerApi.get as any)(`/api/v1/brands/${brandId}/categories/${cat.id}/timings`);
                if (bRes.success && bRes.data && bRes.data.length > 0) {
                    catData.brandTimings = bRes.data;
                } else {
                    catData.brandTimings = [];
                }
            } catch (e) { catData.brandTimings = []; }
            
            return catData;
          })
        );
        setCategories(updatedCategories);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMasterItems = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await (customerApi.get as any)(`/api/v1/brands/${brandId}/master-menu`);
      setMasterItems(response.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchOverrides = async (targetOutlet: string) => {
    if (!targetOutlet) return;
    try {
      const response = await (customerApi.get as any)(`/api/v1/outlets/${targetOutlet}/menu-overrides`);
      setOverrides(response.data || []);
    } catch (e) { console.error(e); }
  };

  const handleSaveTimings = async (catId: string) => {
    try {
        const payload = {
            categoryId: catId,
            timings: [{
                openingTime: `${tOpening}:00`,
                closingTime: `${tClosing}:00`
            }]
        };
        await (customerApi.post as any)(`/api/v1/outlets/${selectedOutlet}/categories/timings`, payload);
        setEditingTimingCatId(null);
        fetchCategories();
    } catch (e) {
        console.error(e);
        showError("Failed to save timings");
    }
  };

  const handleCreateOverride = async (e: React.FormEvent, masterItemId: string) => {
    e.preventDefault();
    const payload = {
      overriddenPrice: oPrice ? parseFloat(oPrice) : null,
      isAvailable: oActive,
      overriddenPrepTimeMinutes: oPrepTime ? parseInt(oPrepTime) : null
    };

    const validation = overrideSchema.safeParse({ overriddenPrice: payload.overriddenPrice });
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

    await (customerApi.post as any)(`/api/v1/outlets/${selectedOutlet}/menu-overrides/${masterItemId}`, payload);
    setIsAddingOverride(null);
    setOPrice("");
    setOPrepTime("");
    setOActive(true);
    fetchOverrides(selectedOutlet);
    onRefresh();
  };

  const handleCreateOutletItem = async (e: React.FormEvent, catId: string) => {
    e.preventDefault();
    const payload = {
      name: mName,
      basePrice: parseFloat(mPrice) || 0,
      packingCharge: parseFloat(mPackingCharge) || 0,
      description: mDesc,
      categoryId: catId || null,
      imageUrl: mImg,
      isVeg: mVeg,
      defaultPrepTimeMinutes: parseInt(mPrepTime) || 15
    };

    const validation = masterItemSchema.safeParse({
      name: payload.name,
      basePrice: payload.basePrice,
      description: payload.description,
      imageUrl: payload.imageUrl
    });

    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

    const newMaster = await (customerApi.post as any)(`/api/v1/brands/${brandId}/master-menu`, payload);
    const overridePayload = {
      overriddenPrice: oPrice ? parseFloat(oPrice) : null,
      isAvailable: oActive,
      overriddenPrepTimeMinutes: oPrepTime ? parseInt(oPrepTime) : null
    };
    
    const overrideValidation = overrideSchema.safeParse({ 
      overriddenPrice: overridePayload.overriddenPrice,
      overriddenPrepTimeMinutes: overridePayload.overriddenPrepTimeMinutes
    });
    if (!overrideValidation.success) {
      showError(overrideValidation.error.issues[0].message);
      return;
    }

    await (customerApi.post as any)(`/api/v1/outlets/${selectedOutlet}/menu-overrides/${newMaster.data.id}`, overridePayload);
    setAddingItemToCatId(null);
    setIsAddingItem(false);
    setMName(""); setMPrice(""); setMPackingCharge("0"); setMPrepTime("15"); setMDesc(""); setMCatId('');
    setOPrice(""); setOPrepTime(""); setOActive(true);
    fetchMasterItems();
    fetchOverrides(selectedOutlet);
    onRefresh();
  };

  const openAddOutletItem = (catId: string) => {
    setAddingItemToCatId(catId);
    setIsAddingOverride(null);
    setMName(''); setMPrice(''); setMPackingCharge('0'); setMPrepTime('15'); setMDesc('');
    setOPrice(''); setOActive(true); setOPrepTime('');
  };
  
  const startEditingOverride = (item: any, currentOverride: any) => {
    setIsAddingOverride(item.id);
    setAddingItemToCatId(null);
    if (currentOverride) {
        setOPrice(currentOverride.overriddenPrice ? currentOverride.overriddenPrice.toString() : '');
        setOPrepTime(currentOverride.overriddenPrepTimeMinutes ? currentOverride.overriddenPrepTimeMinutes.toString() : '');
        setOActive(currentOverride.isAvailable !== false);
    } else {
        setOPrice('');
        setOPrepTime('');
        setOActive(true);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider">Menu Catalog Editor</h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Manage outlet-specific overrides, items, and category availability.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsAddingItem(true); setMName(''); setMPrice(''); setMPackingCharge('0'); setMPrepTime('15'); setMDesc(''); setMCatId(''); setOPrice(''); setOPrepTime(''); setOActive(true); }} className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </div>

      {isAddingItem && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-emerald-500/20 dark:border-emerald-500/30 p-4 rounded-2xl animate-fade-in shadow-sm relative z-50">
          <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] mb-3">Create New Outlet Item</h6>
          <form onSubmit={(e) => handleCreateOutletItem(e, mCatId)} className="space-y-3">
            <input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
            <div className="flex gap-2">
              <input required type="number" step="0.01" min="0" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              <input type="number" step="0.01" min="0" max="9.99" placeholder="Pack Chg" value={mPackingCharge} onChange={e=>setMPackingCharge(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              <input required type="number" min="1" placeholder="Prep (mins)" value={mPrepTime} onChange={e=>setMPrepTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
            </div>
            <input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]" />
            <div className="z-[60] relative">
              <ImageUploadField value={mImg} onChange={setMImg} folderId={restaurantId} placeholder="Image URL (Optional)" imageType="menu" />
            </div>
            <div className="z-[60] relative">
              <CategorySelector categories={categories} value={mCatId} onChange={setMCatId} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" step="0.01" min="0" placeholder="Override Price (optional)" value={oPrice} onChange={e=>setOPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              <input type="number" min="1" placeholder="Override Prep (optional)" value={oPrepTime} onChange={e=>setOPrepTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              <select value={oActive ? "true" : "false"} onChange={e=>setOActive(e.target.value === "true")} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 py-2 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-500/20">Save Item</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {categories.map((cat) => {
          const items = masterItems.filter(i => i.categoryId === cat.id);
          const hasTimings = cat.timings && cat.timings.length > 0 && !(cat.timings.length === 1 && cat.timings[0].openingTime === '00:00:00' && cat.timings[0].closingTime === '23:59:59');
          const hasBrandTimings = cat.brandTimings && cat.brandTimings.length > 0 && !(cat.brandTimings.length === 1 && cat.brandTimings[0].openingTime === '00:00:00' && cat.brandTimings[0].closingTime === '23:59:59');

          return (
            <div key={cat.id} className="bg-white/20 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Category Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6] uppercase tracking-widest">{cat.name}</h5>
                  </div>
                  {cat.description && <p className="text-[10px] text-slate-500 dark:text-slate-400">{cat.description}</p>}
                </div>
                
                {/* Timing Config */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/50 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Outlet Override Timings
                    </span>
                    {editingTimingCatId !== cat.id && (
                      <button onClick={() => {
                          setEditingTimingCatId(cat.id);
                          if (hasTimings) {
                              setTOpening(cat.timings[0].openingTime.substring(0,5));
                              setTClosing(cat.timings[0].closingTime.substring(0,5));
                          } else {
                              setTOpening('00:00');
                              setTClosing('23:59');
                          }
                      }} className="text-[9px] font-bold text-emerald-500 hover:text-emerald-600 uppercase">
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {editingTimingCatId === cat.id ? (
                    <div className="space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <input type="time" value={tOpening} onChange={e=>setTOpening(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-xs font-mono font-bold dark:text-[#f0ede6] w-full" />
                            <span className="text-slate-400 font-bold">-</span>
                            <input type="time" value={tClosing} onChange={e=>setTClosing(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-xs font-mono font-bold dark:text-[#f0ede6] w-full" />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setEditingTimingCatId(null)} className="flex-1 py-1 text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 rounded hover:bg-slate-300 dark:hover:bg-slate-700">Cancel</button>
                            <button onClick={() => handleSaveTimings(cat.id)} className="flex-1 py-1 text-[10px] font-bold text-white bg-emerald-500 rounded hover:bg-emerald-600 flex justify-center items-center gap-1"><Save className="w-3 h-3"/> Save</button>
                        </div>
                        <p className="text-[9px] text-slate-400 italic text-center mt-1">Set 00:00 to 23:59 for All Day</p>
                    </div>
                  ) : (
                    <div>
                      {hasTimings ? (
                        <div className="space-y-1">
                            {cat.timings.map((t: any, i: number) => (
                                <div key={i} className="text-[10px] font-mono font-bold rounded px-2 py-1 w-fit text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                                {t.openingTime.substring(0,5)} - {t.closingTime.substring(0,5)}
                                </div>
                            ))}
                        </div>
                      ) : (
                        <div className="mt-1">
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 italic mb-1">
                              Fallback to Brand timings:
                          </div>
                          {hasBrandTimings ? (
                              <div className="space-y-1">
                              {cat.brandTimings.map((t: any, i: number) => (
                                  <div key={i} className="text-[10px] font-mono font-bold rounded px-2 py-0.5 w-fit text-orange-600 dark:text-orange-400 bg-orange-500/10 opacity-75">
                                  {t.openingTime.substring(0,5)} - {t.closingTime.substring(0,5)}
                                  </div>
                              ))}
                              </div>
                          ) : (
                              <div className="text-[10px] font-mono font-bold rounded px-2 py-0.5 w-fit text-slate-500 bg-slate-500/10 opacity-75">
                              All Day
                              </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 bg-white/10 dark:bg-slate-950/20">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                    <Layers className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Items Yet</p>
                    <p className="text-[10px] mt-1">This category has no items. Add items from the Brand Master Menu.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => {
                        const currentOverride = overrides.find(o => o.masterMenuItemId === item.id);
                        
                        return (
                          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm transition-all hover:shadow-md">
                            {isAddingOverride === item.id ? (
                              <form onSubmit={(e) => handleCreateOverride(e, item.id)} className="space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6]">Edit Override for {item.name}</h6>
                                  <button type="button" onClick={() => setIsAddingOverride(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase block mb-1">Price</label>
                                    <input type="number" step="0.01" min="0" placeholder={`₹${item.basePrice.toFixed(2)}`} value={oPrice} onChange={e=>setOPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-xs font-bold dark:text-[#f0ede6]" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase block mb-1">Prep</label>
                                    <input type="number" min="1" placeholder={`${item.defaultPrepTimeMinutes}m`} value={oPrepTime} onChange={e=>setOPrepTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-xs font-bold dark:text-[#f0ede6]" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase block mb-1">Status</label>
                                    <select value={oActive ? "true" : "false"} onChange={e=>setOActive(e.target.value === "true")} className="w-full bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-xs font-bold dark:text-[#f0ede6]">
                                      <option value="true">Active</option>
                                      <option value="false">Inactive</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                  <button type="submit" className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">Save Override</button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                  <div>
                                      <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] mb-2">{item.name}</h6>
                                      <div className="flex items-center gap-2">
                                          {currentOverride && currentOverride.overriddenPrice !== null && currentOverride.overriddenPrice !== undefined ? (
                                            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full px-2 py-0.5">
                                              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-through">
                                                ${(item.basePrice + (item.packingCharge || 0)).toFixed(2)}
                                              </span>
                                              <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-400">
                                                ${(currentOverride.overriddenPrice + (item.packingCharge || 0)).toFixed(2)}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 border border-slate-200 dark:border-slate-700">
                                              <span className="text-xs font-extrabold text-slate-500 dark:text-[#f0ede6]">
                                                ${(item.basePrice + (item.packingCharge || 0)).toFixed(2)}
                                              </span>
                                            </div>
                                          )}
                                          {currentOverride && currentOverride.isAvailable === false ? (
                                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">Unavailable</span>
                                          ) : (
                                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">Available</span>
                                          )}
                                          {currentOverride && currentOverride.overriddenPrepTimeMinutes !== null && currentOverride.overriddenPrepTimeMinutes !== undefined ? (
                                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                                              <Clock className="w-2.5 h-2.5" /> {currentOverride.overriddenPrepTimeMinutes} min <span className="text-[8px] opacity-70">(edited)</span>
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                                              <Clock className="w-2.5 h-2.5" /> {item.defaultPrepTimeMinutes} min
                                            </span>
                                          )}
                                      </div>
                                  </div>
                                  <button onClick={() => startEditingOverride(item, currentOverride)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Uncategorized Items (if any exist that were mapped incorrectly or created without category) */}
        {masterItems.filter(i => !categories.find(c => c.id === i.categoryId)).length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4">Uncategorized</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {masterItems.filter(i => !categories.find(c => c.id === i.categoryId)).map(item => {
                      const currentOverride = overrides.find(o => o.masterMenuItemId === item.id);
                      return (
                        <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h6 className="font-bold text-xs text-slate-800 dark:text-[#f0ede6] mb-1">{item.name}</h6>
                                    <div className="flex items-center gap-2">
                                        {currentOverride && currentOverride.overriddenPrice !== null && currentOverride.overriddenPrice !== undefined ? (
                                            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full px-2 py-0.5">
                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-through">
                                                    ${item.basePrice.toFixed(2)}
                                                </span>
                                                <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-400">
                                                    ${currentOverride.overriddenPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 border border-slate-200 dark:border-slate-700">
                                                <span className="text-[10px] font-extrabold text-slate-500 dark:text-[#f0ede6]">
                                                    ${item.basePrice.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => startEditingOverride(item, currentOverride)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20 opacity-0 group-hover:opacity-100">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                      )
                  })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
