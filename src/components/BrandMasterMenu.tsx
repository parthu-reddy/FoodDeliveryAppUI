import React, { useState, useEffect } from 'react';
import { Plus, Layers } from 'lucide-react';
import { apiGet, apiPost } from '../lib/apiClient';

interface BrandMasterMenuProps {
  brandId: string;
  onRefresh: () => void;
}

export default function BrandMasterMenu({ brandId, onRefresh }: BrandMasterMenuProps) {
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  const [mName, setMName] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [mCatId, setMCatId] = useState('');
  const [mImg, setMImg] = useState('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80');
  const [mVeg, setMVeg] = useState(true);

  useEffect(() => {
    if (brandId) {
      fetchCategories();
      fetchMasterItems();
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

  const fetchMasterItems = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await apiGet(`/api/v1/brands/${brandId}/master-menu`);
      setMasterItems(response.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateMaster = async (e: React.FormEvent) => {
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
    await apiPost(`/api/v1/brands/${brandId}/master-menu`, payload);
    setIsAddingMaster(false);
    setMName(''); setMPrice(''); setMDesc('');
    fetchMasterItems();
    onRefresh(); // To reload effective catalog anywhere else
  };

  return (
    <div className="space-y-4 animate-fade-in mt-6">
      <div className="flex justify-between items-center">
        <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider">Brand Master Menu</h5>
        <button onClick={() => setIsAddingMaster(true)} className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors">
          <Plus className="w-3 h-3" /> Add Master Item
        </button>
      </div>

      {isAddingMaster && (
        <div className="bg-white dark:bg-slate-900 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl">
          <form onSubmit={handleCreateMaster} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              <input required type="number" step="0.01" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]" />
              <select required value={mCatId} onChange={e=>setMCatId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAddingMaster(false)} className="flex-1 py-2 rounded-lg border border-rose-500/20 dark:border-rose-500/30 text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-slate-900 dark:bg-[#f0ede6] text-white dark:text-black text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100">Save Master Item</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {masterItems.map(item => (
          <div key={item.id} className="bg-white/50 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex gap-3 shadow-sm">
            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] truncate">{item.name}</h6>
                <span className="font-mono text-xs font-bold text-orange-500">${item.basePrice.toFixed(2)}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 mt-1 uppercase tracking-wide">{item.categoryName || 'Food'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
