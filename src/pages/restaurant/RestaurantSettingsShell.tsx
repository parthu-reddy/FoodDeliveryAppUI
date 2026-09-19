import { Surface, Tabs } from '@shared/ui';
import { Order, VerificationStatus, Brand, Outlet } from "@/types";
import {
 CheckCircle,
 ChevronLeft,
 Edit3,
 History,
 Settings,
 Sparkles,
 Store, Utensils
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React, { useState } from 'react';

import BrandMasterMenu from '@features/catalog/components/restaurant/BrandMasterMenu';
import BrandRegistration from '@features/catalog/components/restaurant/BrandRegistration';
import OutletMenuEditor from '@features/catalog/components/restaurant/OutletMenuEditor';
import OutletRegistration from '@features/catalog/components/restaurant/OutletRegistration';
import OutletSettingsEditor from '@features/catalog/components/restaurant/OutletSettingsEditor';
import OutletShiftEditor from '@features/catalog/components/restaurant/OutletShiftEditor';
import { OrderHistory } from '@features/restaurant-orders/components/OrderHistory';

interface RestaurantSettingsShellProps {
 brands: Brand[];
 outlets: Outlet[];
 selectedOutletId: string;
 restaurantId: string;
 loadData: () => void;
 activeOrders: Order[];
 setSelectedChatOrder: (order: Order) => void;
 setShowSettings: (show: boolean) => void;
}

export const RestaurantSettingsShell: React.FC<RestaurantSettingsShellProps> = ({
 brands,
 outlets,
 selectedOutletId,
 restaurantId,
 loadData,
 activeOrders,
 setSelectedChatOrder,
 setShowSettings
}) => {
 const [settingsTab, setSettingsTab] = useState<"menu-editor" | "outlets" | "history">("menu-editor");
 const [editingOutletShifts, setEditingOutletShifts] = useState<Outlet | null>(null);
 const [editingOutletSettings, setEditingOutletSettings] = useState<Outlet | null>(null);

 // Default to outlets if no outlets exist
 React.useEffect(() => {
 if (outlets.length === 0) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setSettingsTab("outlets");
 }
 }, [outlets.length]);

 const presets = useMotionPresets();
 return (
 <>
 <motion.div
 key="settings-panel" {...presets.rise}
 className="p-5 space-y-6"
 >
 {/* Settings Header Block */}
 <Surface radius="xl" elevation={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0">
 <Settings className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
 </div>
 <div>
 <h4 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-[#f0ede6] uppercase font-sans">Restaurant Console Settings</h4>
 <p className="text-[10px] text-slate-400 dark:text-slate-300">Configure brand-outlet hierarchy, provision new branches, and manage your full catalog.</p>
 </div>
 </div>
 
 <button
 onClick={() => setShowSettings(false)}
 className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-[#f0ede6] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20 dark:border-rose-500/30"
 >
 <ChevronLeft className="w-4 h-4" />
 <span>Back to Kitchen Feed</span>
 </button>
 </Surface>
 <Tabs
 label="Restaurant settings sections"
 value={settingsTab}
 onChange={setSettingsTab}
 className="max-w-md mb-6"
 items={[
 {
 key: "outlets" as const,
 label: <span className="flex items-center justify-center gap-1.5"><Store className="w-4 h-4 text-rose-500" /><span>Outlet Management</span></span>,
 },
 {
 key: "menu-editor" as const,
 label: <span className="flex items-center justify-center gap-1.5"><Utensils className="w-4 h-4 text-amber-500" /><span>Menu Catalog Editor</span></span>,
 disabled: outlets.length === 0,
 },
 {
 key: "history" as const,
 label: <span className="flex items-center justify-center gap-1.5"><History className="w-4 h-4 text-amber-500" /><span>Order History</span></span>,
 disabled: outlets.length === 0,
 },
 ]}
 />

 {settingsTab === "outlets" && (
 <div className="space-y-6 ">
 <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 dark:from-rose-500/5 dark:to-amber-500/5 border border-rose-500/15 p-5 rounded-2xl space-y-2">
 <div className="flex items-center gap-2 text-rose-500">
 <Sparkles className="w-5 h-5 animate-pulse" />
 <h4 className="font-extrabold text-sm tracking-tight uppercase font-sans">Hierarchy Onboarding</h4>
 </div>
 <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
 Register your Brand and physical Outlets on the ecosystem.
 </p>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-6">
 {brands.length === 0 ? (
 <BrandRegistration onRefresh={loadData} />
 ) : (
 <div className="p-4 border border-amber-500/20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex flex-col gap-1">
 <p className="font-bold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Brand Registered Successfully</p>
 <p className="text-xs">You have completed brand registration. You can now add an outlet.</p>
 </div>
 )}
 {brands.length > 0 && (
 <OutletRegistration onRefresh={loadData} brandId={brands[0].id} />
 )}
 </div>
 <div className="space-y-6">
 <Surface radius="xl" elevation={1} className="p-5">
 <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-rose-500/20 dark:border-rose-500/30 pb-3">Your Brands</h5>
 <div className="space-y-3">
 {brands.map(b => (
 <Surface radius="lg" elevation={1} className="p-3 flex flex-col gap-2" key={b.id}>
 <div className="flex justify-between items-center">
 <span className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6]">{b.name}</span>
 <span className="text-[10px] font-mono text-slate-400 dark:text-slate-300">ID: {b.id}</span>
 </div>
 <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-300">
 <span>GSTIN: {b.gstin}</span>
 <div className="flex gap-2">
 <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
 b.kycStatus === 'VERIFIED' ? 'bg-amber-500/10 text-amber-500' :
 b.kycStatus === VerificationStatus.PENDING ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
 'bg-rose-500/10 text-rose-500'
 }`}>
 GSTIN: {b.kycStatus || VerificationStatus.PENDING}
 </span>
 <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
 b.pennyDropStatus === 'VERIFIED' ? 'bg-amber-500/10 text-amber-500' :
 b.pennyDropStatus === VerificationStatus.PENDING ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
 'bg-rose-500/10 text-rose-500'
 }`}>
 BANK: {b.pennyDropStatus || VerificationStatus.PENDING}
 </span>
 </div>
 </div>
 </Surface>
 ))}
 </div>
 </Surface>
 <Surface radius="xl" elevation={1} className="p-5">
 <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-rose-500/20 dark:border-rose-500/30 pb-3">Your Outlets</h5>
 <div className="space-y-3">
 {outlets.map(o => (
 <Surface radius="lg" elevation={1} className="p-3 flex flex-col gap-2" key={o.id}>
 <div className="flex justify-between items-start">
 <div>
 <span className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6]">{o.name}</span>
 <span className="text-[10px] font-mono text-slate-400 dark:text-slate-300 block">ID: {o.id}</span>
 </div>
 <div className="flex gap-1.5">
 <button
 onClick={() => setEditingOutletSettings(o)}
 className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
 title="Edit Settings"
 >
 <Settings className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => setEditingOutletShifts(o)}
 className="p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
 title="Edit Shifts"
 >
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="text-xs text-slate-500 dark:text-slate-300">FSSAI: {o.fssaiLicenseNumber}</div>
 {o.timings && o.timings.length > 0 && (
 <div className="mt-1 flex flex-wrap gap-1.5">
 {o.timings.map((t: Record<string, unknown>, i: number) => (
 <span key={i} className="text-[9px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
 {typeof t.openingTime === 'string' ? (t.openingTime as string).substring(0,5) : `${String((t.openingTime as { hour?: number })?.hour || 0).padStart(2, '0')}:${String((t.openingTime as { minute?: number })?.minute || 0).padStart(2, '0')}`} - {typeof t.closingTime === 'string' ? (t.closingTime as string).substring(0,5) : `${String((t.closingTime as { hour?: number })?.hour || 0).padStart(2, '0')}:${String((t.closingTime as { minute?: number })?.minute || 0).padStart(2, '0')}`}
 </span>
 ))}
 </div>
 )}
 </Surface>
 ))}
 </div>
 </Surface>
 {brands.length > 0 && (
 <Surface radius="xl" elevation={1} className="p-5 mt-6">
 <BrandMasterMenu brandId={brands[0].id} onRefresh={loadData} />
 </Surface>
 )}
 </div>
 </div>
 </div>
 )}
 {settingsTab === "menu-editor" && (
 <div className="space-y-6">
 <OutletMenuEditor
 restaurantId={selectedOutletId || restaurantId}
 brandId={brands.length > 0 ? brands[0].id : ''}
 onRefresh={loadData}
 />
 </div>
 )}
 {settingsTab === "history" && selectedOutletId && (
 <Surface radius="xl" elevation={1} className="p-6">
 <OrderHistory 
 restaurantId={selectedOutletId} 
 onOpenChat={(id) => {
 const o = activeOrders.find(o => o.id === id);
 if (o) setSelectedChatOrder(o);
 }}
 />
 </Surface>
 )}
 </motion.div>

 {editingOutletShifts && (
 <OutletShiftEditor
 outlet={editingOutletShifts as never}
 onRefresh={loadData}
 onClose={() => setEditingOutletShifts(null)}
 />
 )}
 
 {editingOutletSettings && (
 <OutletSettingsEditor
 outlet={editingOutletSettings as never}
 onRefresh={loadData}
 onClose={() => setEditingOutletSettings(null)}
 />
 )}
 </>
 );
};
