import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/apiClient';
import { Clock, Loader, Save, AlertCircle, Edit3, Globe, Store } from 'lucide-react';

interface TimingDTO {
    openingTime: string;
    closingTime: string;
}

interface CategoryDTO {
    id: string;
    name: string;
    description: string;
    timings?: TimingDTO[];
}

interface CategoryTimingsTabProps {
    brandId: string;
    outletId: string;
    level: 'brand' | 'outlet';
}

export default function CategoryTimingsTab({ brandId, outletId, level }: CategoryTimingsTabProps) {
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Editing state
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [openingTime, setOpeningTime] = useState('00:00');
    const [closingTime, setClosingTime] = useState('23:59');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadCategories();
        // Reset editing state when switching config level
        setEditingCategoryId(null);
        setMessage(null);
    }, [level, outletId, brandId]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const res = await apiGet(`/api/v1/categories`);
            if (res.success && res.data) {
                // Fetch overridden timings for this outlet/brand concurrently
                const updatedCategories = await Promise.all(
                    res.data.map(async (cat: CategoryDTO) => {
                        try {
                            const endpoint = level === 'outlet' 
                                ? `/api/v1/outlets/${outletId}/categories/${cat.id}/timings`
                                : `/api/v1/brands/${brandId}/categories/${cat.id}/timings`;
                            
                            const tRes = await apiGet(endpoint);
                            if (tRes.success && tRes.data && tRes.data.length > 0) {
                                return { ...cat, timings: tRes.data };
                            }
                        } catch (e) {
                            console.warn("Failed to fetch timings for category", cat.id, e);
                        }
                        return cat;
                    })
                );
                // Update state asynchronously safely
                setCategories(updatedCategories);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = async (categoryId: string) => {
        setEditingCategoryId(categoryId);
        setMessage(null);
        setOpeningTime('00:00');
        setClosingTime('23:59');
        // Pre-fill existing logic
        try {
            const endpoint = level === 'outlet' 
                ? `/api/v1/outlets/${outletId}/categories/${categoryId}/timings`
                : `/api/v1/brands/${brandId}/categories/${categoryId}/timings`;
                
            const res = await apiGet(endpoint);
            if (res.success && res.data && res.data.length > 0) {
                const t = res.data[0];
                setOpeningTime(t.openingTime ? t.openingTime.substring(0, 5) : '00:00');
                setClosingTime(t.closingTime ? t.closingTime.substring(0, 5) : '23:59');
            }
        } catch (error) {
            console.error('Failed to load timings', error);
        }
    };

    const handleSave = async (categoryId: string) => {
        if (!categoryId) return;
        if (level === 'outlet' && !outletId) return;
        if (level === 'brand' && !brandId) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const opening = openingTime.length === 5 ? `${openingTime}:00` : openingTime;
            const closing = closingTime.length === 5 
                ? (closingTime === '23:59' ? '23:59:59' : `${closingTime}:00`) 
                : closingTime;

            const payload = {
                categoryId: categoryId,
                timings: [
                    { openingTime: opening, closingTime: closing }
                ]
            };

            const endpoint = level === 'outlet' 
                ? `/api/v1/outlets/${outletId}/categories/timings`
                : `/api/v1/brands/${brandId}/categories/timings`;

            const res = await apiPost(endpoint, payload);
            
            if (res.success) {
                setMessage({ text: 'Category timing saved successfully!', type: 'success' });
                // Instantly update the local UI state before the timeout to feel responsive
                setCategories(prev => prev.map(c => 
                    c.id === categoryId 
                        ? { ...c, timings: [{ openingTime: opening, closingTime: closing }] }
                        : c
                ));
                
                setTimeout(() => {
                    setEditingCategoryId(null);
                    setMessage(null);
                    loadCategories();
                }, 1500);
            } else {
                setMessage({ text: res.message || 'Failed to save timing', type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async (categoryId: string) => {
        if (!categoryId) return;
        if (level === 'outlet' && !outletId) return;
        if (level === 'brand' && !brandId) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const payload = {
                categoryId: categoryId,
                timings: [] // Empty array to clear specific timings
            };

            const endpoint = level === 'outlet' 
                ? `/api/v1/outlets/${outletId}/categories/timings`
                : `/api/v1/brands/${brandId}/categories/timings`;

            const res = await apiPost(endpoint, payload);
            
            if (res.success) {
                setMessage({ text: 'Custom timing cleared. Category will fallback to default timings.', type: 'success' });
                setOpeningTime('00:00');
                setClosingTime('23:59');
                
                // Instantly update local UI
                setCategories(prev => prev.map(c => 
                    c.id === categoryId 
                        ? { ...c, timings: [] }
                        : c
                ));
                
                setTimeout(() => {
                    setEditingCategoryId(null);
                    setMessage(null);
                    loadCategories();
                }, 1500);
            } else {
                setMessage({ text: res.message || 'Failed to clear timing', type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className={`bg-gradient-to-r border p-5 rounded-3xl space-y-2 ${
                level === 'outlet' 
                ? 'from-blue-500/10 to-indigo-500/10 border-blue-500/15'
                : 'from-purple-500/10 to-fuchsia-500/10 border-purple-500/15'
            }`}>
                <div className={`flex items-center gap-2 ${level === 'outlet' ? 'text-blue-500' : 'text-purple-500'}`}>
                    <Clock className="w-5 h-5 animate-pulse" />
                    <h4 className="font-extrabold text-sm tracking-tight uppercase font-sans">
                        {level === 'outlet' ? 'Outlet Category Timings' : 'Brand Category Timings'}
                    </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    {level === 'outlet' 
                        ? "Set specific availability hours for different categories in this outlet. Overrides the Brand timings."
                        : "Set global availability hours for categories across all your outlets. Outlets can still override these."}
                </p>
            </div>

            {isLoading && categories.length === 0 ? (
                <div className="flex justify-center items-center h-48">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(cat => (
                        <div key={cat.id} className={`bg-white/20 dark:bg-slate-900/20 border p-4 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${
                            level === 'outlet' ? 'border-blue-500/20 dark:border-blue-500/30' : 'border-purple-500/20 dark:border-purple-500/30'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h6 className="font-bold text-sm text-slate-800 dark:text-[#f0ede6]">{cat.name}</h6>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{cat.description}</p>
                                </div>
                                {editingCategoryId !== cat.id && (
                                    <button
                                        onClick={() => handleEditClick(cat.id)}
                                        className={`p-2 rounded-xl transition-colors ${
                                            level === 'outlet'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                                        }`}
                                        title="Edit Timings"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Display existing timings if any */}
                            {editingCategoryId !== cat.id && (
                                <div>
                                    {cat.timings && cat.timings.length > 0 && !(cat.timings.length === 1 && cat.timings[0].openingTime === '00:00:00' && cat.timings[0].closingTime === '23:59:59') ? (
                                    <div className={`mt-2 p-2 rounded-xl border ${
                                        level === 'outlet'
                                        ? 'bg-slate-50 dark:bg-slate-950 border-blue-500/10 dark:border-blue-500/20'
                                        : 'bg-slate-50 dark:bg-slate-950 border-purple-500/10 dark:border-purple-500/20'
                                    }`}>
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mb-1">
                                            {level === 'outlet' ? 'Outlet Active Windows' : 'Brand Active Windows'}
                                        </p>
                                        <div className="space-y-1">
                                        {cat.timings.map((t: any, i: number) => (
                                            <div key={i} className={`text-[10px] font-mono font-bold rounded px-2 py-0.5 w-fit ${
                                                level === 'outlet'
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                                : 'text-purple-600 dark:text-purple-400 bg-purple-500/10'
                                            }`}>
                                            {t.openingTime.substring(0,5)} - {t.closingTime.substring(0,5)}
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 italic">
                                        {level === 'outlet' ? 'Fallback to Brand timings' : 'Fallback to Default (All Day)'}
                                    </div>
                                    )}
                                </div>
                            )}

                            {editingCategoryId === cat.id && (
                                <div className={`mt-4 pt-4 border-t space-y-4 animate-fade-in ${
                                    level === 'outlet' ? 'border-blue-500/20 dark:border-blue-500/30' : 'border-purple-500/20 dark:border-purple-500/30'
                                }`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                                                Opening Time
                                            </label>
                                            <input
                                                type="time"
                                                value={openingTime}
                                                onChange={(e) => setOpeningTime(e.target.value)}
                                                className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 ${
                                                    level === 'outlet' ? 'focus:ring-blue-500/50' : 'focus:ring-purple-500/50'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                                                Closing Time
                                            </label>
                                            <input
                                                type="time"
                                                value={closingTime}
                                                onChange={(e) => setClosingTime(e.target.value)}
                                                className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 ${
                                                    level === 'outlet' ? 'focus:ring-blue-500/50' : 'focus:ring-purple-500/50'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {message && (
                                        <div className={`flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-bold ${
                                            message.type === 'success' 
                                            ? 'bg-emerald-500/10 text-emerald-600' 
                                            : 'bg-red-500/10 text-red-600'
                                        }`}>
                                            {message.type === 'error' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-2 pt-2">
                                        <button
                                            onClick={() => handleClear(cat.id)}
                                            disabled={isSaving}
                                            className="px-3 py-1.5 text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors"
                                        >
                                            Clear Custom
                                        </button>
                                        
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingCategoryId(null)}
                                                disabled={isSaving}
                                                className="px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave(cat.id)}
                                                disabled={isSaving}
                                                className={`px-4 py-1.5 text-[10px] font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors ${
                                                    level === 'outlet'
                                                    ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50'
                                                    : 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500/50'
                                                } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {isSaving ? (
                                                    <Loader className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Save className="w-3 h-3" />
                                                )}
                                                Save Timing
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
