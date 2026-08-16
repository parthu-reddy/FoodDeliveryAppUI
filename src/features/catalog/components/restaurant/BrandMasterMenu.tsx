import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit3, X, Clock, Save, Layers } from 'lucide-react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '@/lib/zodiosClients';
import CategorySelector from './CategorySelector';
import ImageUploadField from "@features/kyc/components/ImageUploadField";
import ImageLoader from '@shared/ui/ImageLoader';
import { z } from 'zod';
import { Button, Input, FormField, Badge } from '@shared/ui';
import { parseApiError } from '@/lib/parseApiError';

const masterItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Item name cannot exceed 100 characters'),
  basePrice: z.number().min(0, 'Base price cannot be negative'),
  defaultPrepTimeMinutes: z.number().min(1, 'Prep time must be at least 1 minute'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  imageUrl: z.string().url('Invalid Image URL').max(1000, 'URL too long').optional().or(z.literal(''))
});

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name cannot exceed 100 characters'),
  description: z.string().max(255, 'Description cannot exceed 255 characters').optional()
});

interface BrandMasterMenuProps {
  brandId: string;
  onRefresh: () => void;
}

const BrandMasterMenu = React.memo(function BrandMasterMenu({ brandId, onRefresh }: BrandMasterMenuProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Master Item Add State
  const [addingItemToCatId, setAddingItemToCatId] = useState<string | null>(null);
  const [mName, setMName] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mPrepTime, setMPrepTime] = useState('15');
  const [mDesc, setMDesc] = useState('');
  const [mImg, setMImg] = useState('');
  const [mVeg, setMVeg] = useState(true);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [mCatId, setMCatId] = useState('');

  // Category Add State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // General Item Add State
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Category Timing Edit State
  const [editingTimingCatId, setEditingTimingCatId] = useState<string | null>(null);
  const [tOpening, setTOpening] = useState('00:00');
  const [tClosing, setTClosing] = useState('23:59');

  useEffect(() => {
    if (brandId) {
      fetchCategories();
      fetchMasterItems();
    }
  }, [brandId]);

  const fetchCategories = async () => {
    try {
      const data = await restaurantApi.category.get('/api/v1/brands/:brandId/categories', { params: { brandId } });
      if (data.success && data.data) {
        const updatedCategories = await Promise.all(
          data.data.map(async (cat: any) => {
            try {
              const tRes = await restaurantApi.category.get('/api/v1/brands/:brandId/categories/:categoryId/timings', { params: { brandId, categoryId: cat.id } });
              return { ...cat, timings: (tRes.success && tRes.data) ? tRes.data : [] };
            } catch (e) {
              return { ...cat, timings: [] };
            }
          })
        );
        setCategories(updatedCategories);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMasterItems = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await restaurantApi.catalog.get('/api/v1/brands/:brandId/master-menu', { params: { brandId } });
      setMasterItems(response.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = categorySchema.safeParse({ name: newCatName, description: newCatDesc });
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }
    
    try {
      await restaurantApi.category.post('/api/v1/brands/:brandId/categories', { name: newCatName, description: newCatDesc }, { params: { brandId } });
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, "Failed to create category").message);
    }
  };

  const handleCreateMaster = async (e: React.FormEvent, catId: string) => {
    e.preventDefault();
    const payload = {
      name: mName,
      basePrice: parseFloat(mPrice) || 0,
      description: mDesc,
      categoryId: catId || null,
      imageUrl: mImg,
      isVeg: mVeg,
      defaultPrepTimeMinutes: parseInt(mPrepTime) || 15
    };

    const validation = masterItemSchema.safeParse({
      name: payload.name,
      basePrice: payload.basePrice,
      defaultPrepTimeMinutes: payload.defaultPrepTimeMinutes,
      description: payload.description,
      imageUrl: payload.imageUrl
    });

    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

    try {
      await restaurantApi.catalog.post('/api/v1/brands/:brandId/master-menu', payload, { params: { brandId } });
      setAddingItemToCatId(null);
      setIsAddingItem(false);
      setMName(''); setMPrice(''); setMPrepTime('15'); setMDesc(''); setMCatId('');
      fetchMasterItems();
      onRefresh(); 
    } catch (e: any) {
      console.error(e);
      showError(e?.response?.data?.message || "Failed to create menu item. Please try again.");
    }
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
      defaultPrepTimeMinutes: parseInt(mPrepTime) || 15
    };

    const validation = masterItemSchema.safeParse({
      name: payload.name,
      basePrice: payload.basePrice,
      defaultPrepTimeMinutes: payload.defaultPrepTimeMinutes,
      description: payload.description,
      imageUrl: payload.imageUrl
    });

    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

    try {
      await restaurantApi.catalog.put('/api/v1/brands/:brandId/master-menu/:itemId', payload, { params: { brandId, itemId: editingItemId } });
      setEditingItemId(null);
      setMName(''); setMPrice(''); setMPrepTime('15'); setMDesc(''); setMCatId('');
      fetchMasterItems();
      onRefresh();
    } catch (e: any) {
      console.error(e);
      showError(e?.response?.data?.message || "Failed to update menu item. Please try again.");
    }
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
        await restaurantApi.category.post('/api/v1/brands/:brandId/categories/timings', payload, { params: { brandId } });
        setEditingTimingCatId(null);
        fetchCategories();
    } catch (e) {
        console.error(e);
        showError(parseApiError(e, "Failed to save timings").message);
    }
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setMName(item.name);
    setMPrice(item.basePrice.toString());
    setMPrepTime(item.defaultPrepTimeMinutes?.toString() || '15');
    setMDesc(item.description);
    setMCatId(item.categoryId || '');
    setMImg(item.imageUrl || '');
    setAddingItemToCatId(null);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setMName(''); setMPrice(''); setMPrepTime('15'); setMDesc('');
  };

  const openAddItem = (catId: string) => {
    setAddingItemToCatId(catId);
    setEditingItemId(null);
    setIsAddingItem(false);
    setMName(''); setMPrice(''); setMPrepTime('15'); setMDesc('');
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider">Brand Master Menu</h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Manage categories, menu items, and global availability hours.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setIsAddingItem(true); setIsAddingCategory(false); setMName(''); setMPrice(''); setMPrepTime('15'); setMDesc(''); setMCatId(''); }} variant="warning" className="shadow-sm shadow-orange-500/20">
            <Plus className="w-3 h-3" /> Add Item
          </Button>
          <Button onClick={() => { setIsAddingCategory(true); setIsAddingItem(false); }} variant="primary" className="shadow-sm shadow-rose-500/20">
            <Plus className="w-3 h-3" /> Add Category
          </Button>
        </div>
      </div>

      {isAddingCategory && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl animate-fade-in shadow-sm">
          <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] mb-3">Create New Category</h6>
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <FormField label="Category Name (e.g. Appetizers)" required>
              <Input required placeholder="Category Name" value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
            </FormField>
            <FormField label="Description (Optional)">
              <Input placeholder="Description" value={newCatDesc} onChange={e=>setNewCatDesc(e.target.value)} />
            </FormField>
            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={() => setIsAddingCategory(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1">Save Category</Button>
            </div>
          </form>
        </div>
      )}

      {isAddingItem && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-orange-500/20 dark:border-orange-500/30 p-4 rounded-2xl animate-fade-in shadow-sm relative z-50">
          <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] mb-3">Create New Menu Item</h6>
          <form onSubmit={(e) => handleCreateMaster(e, mCatId)} className="space-y-3">
            <FormField label="Item Name" required>
              <Input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} />
            </FormField>
            <div className="flex gap-2">
              <FormField label="Base Price" required className="flex-1">
                <Input required type="number" step="0.01" min="0" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} />
              </FormField>
              <FormField label="Prep (mins)" required className="flex-1">
                <Input required type="number" min="1" placeholder="Prep (mins)" value={mPrepTime} onChange={e=>setMPrepTime(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Description" required>
              <Input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} />
            </FormField>
            <div className="z-[60] relative">
              <ImageUploadField value={mImg} onChange={setMImg} folderId={brandId} placeholder="Image URL (Optional)" imageType="menu" />
            </div>
            <div className="z-[60] relative">
              <CategorySelector categories={categories} value={mCatId} onChange={setMCatId} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={() => setIsAddingItem(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button type="submit" variant="warning" className="flex-1">Save Item</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {categories.map((cat) => {
          const items = masterItems.filter(i => i.categoryId === cat.id);
          const hasTimings = cat.timings && cat.timings.length > 0 && !(cat.timings.length === 1 && cat.timings[0].openingTime === '00:00:00' && cat.timings[0].closingTime === '23:59:59');

          return (
            <div key={cat.id} className="bg-white/20 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {/* Category Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-rose-500" />
                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6] uppercase tracking-widest">{cat.name}</h5>
                  </div>
                  {cat.description && <p className="text-[10px] text-slate-500 dark:text-slate-400">{cat.description}</p>}
                </div>
                
                {/* Timing Config */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/50 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Active Windows
                    </span>
                    {editingTimingCatId !== cat.id && (
                      <Button variant="ghost" size="xs" onClick={() => {
                          setEditingTimingCatId(cat.id);
                          if (hasTimings) {
                              setTOpening(cat.timings[0].openingTime.substring(0,5));
                              setTClosing(cat.timings[0].closingTime.substring(0,5));
                          } else {
                              setTOpening('00:00');
                              setTClosing('23:59');
                          }
                      }} className="!text-orange-500 hover:!text-orange-600">
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingTimingCatId === cat.id ? (
                    <div className="space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <Input type="time" value={tOpening} onChange={e=>setTOpening(e.target.value)} className="w-full" />
                            <span className="text-slate-400 font-bold">-</span>
                            <Input type="time" value={tClosing} onChange={e=>setTClosing(e.target.value)} className="w-full" />
                        </div>
                        <div className="flex gap-1">
                            <Button variant="secondary" size="xs" onClick={() => setEditingTimingCatId(null)} className="flex-1">Cancel</Button>
                            <Button variant="success" size="xs" onClick={() => handleSaveTimings(cat.id)} className="flex-1" icon={<Save className="w-3 h-3"/>}>Save</Button>
                        </div>
                        <p className="text-[9px] text-slate-400 italic text-center mt-1">Set 00:00 to 23:59 for All Day</p>
                    </div>
                  ) : (
                    <div>
                      {hasTimings ? (
                        <div className="space-y-1">
                            {cat.timings.map((t: any, i: number) => (
                                <Badge key={i} variant="warning" className="font-mono">
                                  {t.openingTime.substring(0,5)} - {t.closingTime.substring(0,5)}
                                </Badge>
                            ))}
                        </div>
                      ) : (
                        <Badge variant="neutral" className="font-mono">
                            Fallback to Default (All Day)
                        </Badge>
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
                    <p className="text-[10px] mt-1">Click Add Item above to create items in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                      <div key={item.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col shadow-sm transition-all hover:shadow-md ${editingItemId === item.id ? 'relative z-50' : ''}`}>
                        {editingItemId === item.id ? (
                          <form onSubmit={handleEditMaster} className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                              <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6]">Edit Item</h6>
                              <Button type="button" variant="ghost" size="xs" onClick={cancelEditing} className="!text-slate-400 hover:!text-rose-500 p-0">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <FormField label="Item Name" required>
                                <Input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} />
                              </FormField>
                              <div className="flex gap-2">
                                <FormField label="Base Price" required className="flex-1">
                                  <Input required type="number" step="0.01" min="0" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} />
                                </FormField>
                                <FormField label="Prep (mins)" required className="flex-1">
                                  <Input required type="number" min="1" placeholder="Prep Time (mins)" value={mPrepTime} onChange={e=>setMPrepTime(e.target.value)} />
                                </FormField>
                              </div>
                              <FormField label="Description" required>
                                <Input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} />
                              </FormField>
                              <div className="z-[60] relative">
                                  <ImageUploadField value={mImg} onChange={setMImg} folderId={brandId} placeholder="Image URL (Optional)" imageType="menu" />
                              </div>
                              <div className="z-[60] relative">
                                  <CategorySelector categories={categories} value={mCatId} onChange={setMCatId} />
                              </div>
                            </div>
                            <div className="flex justify-end pt-2">
                              <Button type="submit" variant="primary" size="sm">Save</Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex gap-3 h-full">
                            <ImageLoader src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg shrink-0" containerClassName="shrink-0" loading="lazy" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6] truncate pr-2">{item.name}</h6>
                                  <span className="font-mono text-xs font-bold text-orange-500 shrink-0">₹{item.basePrice.toFixed(2)}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <Badge variant="warning" className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {item.defaultPrepTimeMinutes} min
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button variant="ghost" size="sm" onClick={() => startEditing(item)} className="p-1 !text-slate-400 hover:!text-orange-500">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {masterItems.filter(i => !categories.find(c => c.id === i.categoryId)).map(item => (
                    <div key={item.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col shadow-sm transition-all hover:shadow-md ${editingItemId === item.id ? 'relative z-50' : ''}`}>
                      {editingItemId === item.id ? (
                        <form onSubmit={handleEditMaster} className="space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6]">Edit Item</h6>
                            <Button type="button" variant="ghost" size="xs" onClick={cancelEditing} className="!text-slate-400 hover:!text-rose-500 p-0">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <FormField label="Item Name" required>
                              <Input required placeholder="Item Name" value={mName} onChange={e=>setMName(e.target.value)} />
                            </FormField>
                            <div className="flex gap-2">
                              <FormField label="Base Price" required className="flex-1">
                                <Input required type="number" step="0.01" min="0" placeholder="Base Price" value={mPrice} onChange={e=>setMPrice(e.target.value)} />
                              </FormField>
                              <FormField label="Prep (mins)" required className="flex-1">
                                <Input required type="number" min="1" placeholder="Prep Time (mins)" value={mPrepTime} onChange={e=>setMPrepTime(e.target.value)} />
                              </FormField>
                            </div>
                            <FormField label="Description" required>
                              <Input required placeholder="Description" value={mDesc} onChange={e=>setMDesc(e.target.value)} />
                            </FormField>
                            <div className="z-[60] relative">
                                <ImageUploadField value={mImg} onChange={setMImg} folderId={brandId} placeholder="Image URL (Optional)" imageType="menu" />
                            </div>
                            <div className="z-[60] relative">
                                <CategorySelector categories={categories} value={mCatId} onChange={setMCatId} />
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button type="submit" variant="primary" size="sm">Save</Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-3 h-full group">
                            <ImageLoader src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg shrink-0" containerClassName="shrink-0" loading="lazy" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <h6 className="font-bold text-xs text-slate-800 dark:text-[#f0ede6] truncate">{item.name}</h6>
                                    <span className="font-mono text-[10px] font-bold text-orange-500 shrink-0">₹{item.basePrice.toFixed(2)}</span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge variant="warning" className="flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> {item.defaultPrepTimeMinutes} min
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <Button variant="ghost" size="sm" onClick={() => startEditing(item)} className="p-1 !text-slate-400 hover:!text-orange-500">
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
});

export default BrandMasterMenu;
