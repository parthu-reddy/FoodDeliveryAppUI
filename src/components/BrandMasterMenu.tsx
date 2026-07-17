import React, { useState, useEffect } from 'react';
import { Plus, Layers, Edit3, X } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../lib/apiClient';
import CategorySelector from './CategorySelector';

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
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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
      categoryId: mCatId || null,
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

  const handleEditMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;
    const payload = {
      name: mName,
      basePrice: parseFloat(mPrice) || 0,
      description: mDesc,
      categoryId: mCatId || null,
      imageUrl: mImg,
      isVeg: mVeg,
      defaultPrepTimeMinutes: 15
    };
    await apiPut(`/api/v1/brands/${brandId}/master-menu/${editingItemId}`, payload);
    setEditingItemId(null);
    setMName(''); setMPrice(''); setMDesc('');
    fetchMasterItems();
    onRefresh();
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setMName(item.name);
    setMPrice(item.basePrice.toString());
    setMDesc(item.description);
    setMCatId(item.categoryId || '');
    setMImg(item.imageUrl || '');
    setIsAddingMaster(false);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setMName(''); setMPrice(''); setMDesc('');
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
        <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl">
          <form onSubmit={handleCreateMaster} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
              <input required type="number" step="0.01" min="0" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
            </div>
            <div className="grid grid-cols-2 gap-3 z-10 relative">
              <input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]" />
              <CategorySelector 
                categories={categories} 
                value={mCatId} 
                onChange={setMCatId} 
              />
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
          <div key={item.id} className="bg-white/20 dark:bg-slate-900/20 border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex flex-col shadow-sm transition-all hover:shadow-md">
            {editingItemId === item.id ? (
              <form onSubmit={handleEditMaster} className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6]">Edit Master Item</h6>
                  <button type="button" onClick={cancelEditing} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
                  <input required type="number" step="0.01" min="0" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs font-bold dark:text-[#f0ede6]" />
                </div>
                <div className="grid grid-cols-2 gap-3 z-10 relative">
                  <input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/20 dark:border-rose-500/30 rounded-lg px-3 py-2 text-xs dark:text-[#f0ede6]" />
                  <CategorySelector 
                    categories={categories} 
                    value={mCatId} 
                    onChange={setMCatId} 
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-[#f0ede6] text-white dark:text-black text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="flex gap-3 h-full">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] truncate pr-2">{item.name}</h6>
                      <span className="font-mono text-xs font-bold text-orange-500 shrink-0">${item.basePrice.toFixed(2)}</span>
                    </div>
                    {item.categoryId && categories.find(c => c.id === item.categoryId) && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded text-[10px] font-bold uppercase tracking-wide">
                          {categories.find(c => c.id === item.categoryId)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={() => startEditing(item)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-[#f0ede6] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
