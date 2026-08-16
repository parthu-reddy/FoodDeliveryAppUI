import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Utensils, History, ChevronLeft, Sparkles, 
  CheckCircle, Settings, Edit3
} from 'lucide-react';
import { MenuItem, Order, VerificationStatus } from "@/types";

import OutletRegistration from '@features/catalog/components/restaurant/OutletRegistration';
import BrandRegistration from '@features/catalog/components/restaurant/BrandRegistration';
import OutletShiftEditor from '@features/catalog/components/restaurant/OutletShiftEditor';
import OutletSettingsEditor from '@features/catalog/components/restaurant/OutletSettingsEditor';
import BrandMasterMenu from '@features/catalog/components/restaurant/BrandMasterMenu';
import OutletMenuEditor from '@features/catalog/components/restaurant/OutletMenuEditor';
import { OrderHistory } from '@features/restaurant-orders/components/OrderHistory';

interface RestaurantSettingsShellProps {
  brands: any[];
  outlets: any[];
  menuList: MenuItem[];
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
  menuList,
  selectedOutletId,
  restaurantId,
  loadData,
  activeOrders,
  setSelectedChatOrder,
  setShowSettings
}) => {
  const [settingsTab, setSettingsTab] = useState<"menu-editor" | "outlets" | "history">("menu-editor");
  const [editingOutletShifts, setEditingOutletShifts] = useState<any | null>(null);
  const [editingOutletSettings, setEditingOutletSettings] = useState<any | null>(null);

  // Default to outlets if no outlets exist
  React.useEffect(() => {
    if (outlets.length === 0) {
      setSettingsTab("outlets");
    }
  }, [outlets.length]);

  return (
    <>
      <motion.div
        key="settings-panel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="p-5 space-y-6"
      >
        {/* Settings Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/10 shrink-0">
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
        </div>
        <div className="flex bg-slate-100/80 dark:bg-slate-950/45 p-1 rounded-2xl border border-rose-500/20 dark:border-rose-500/30/30 gap-1.5 max-w-md mb-6">
          <button
            onClick={() => setSettingsTab("outlets")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              settingsTab === "outlets"
                ? "bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-[#f0ede6] shadow-sm border border-rose-500/20 dark:border-rose-500/30 backdrop-blur-md" 
                : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Store className="w-4 h-4 text-rose-500" />
            <span>Outlet Management</span>
          </button>
          <button
            disabled={outlets.length === 0}
            onClick={() => setSettingsTab("menu-editor")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              outlets.length === 0 ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
            } ${
              settingsTab === "menu-editor"
                ? "bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-[#f0ede6] shadow-sm border border-rose-500/20 dark:border-rose-500/30 backdrop-blur-md" 
                : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Utensils className="w-4 h-4 text-orange-500" />
            <span>Menu Catalog Editor</span>
          </button>

          <button
            disabled={outlets.length === 0}
            onClick={() => setSettingsTab("history")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              outlets.length === 0 ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
            } ${
              settingsTab === "history"
                ? "bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-[#f0ede6] shadow-sm border border-rose-500/20 dark:border-rose-500/30 backdrop-blur-md" 
                : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4 text-emerald-500" />
            <span>Order History</span>
          </button>
        </div>

        {settingsTab === "outlets" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 dark:from-rose-500/5 dark:to-orange-500/5 border border-rose-500/15 p-5 rounded-3xl space-y-2">
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
                  <div className="p-4 border border-emerald-500/20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex flex-col gap-1 shadow-sm">
                    <p className="font-bold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Brand Registered Successfully</p>
                    <p className="text-xs">You have completed brand registration. You can now add an outlet.</p>
                  </div>
                )}
                {brands.length > 0 && (
                  <OutletRegistration onRefresh={loadData} brandId={brands[0].id} />
                )}
              </div>
              <div className="space-y-6">
                <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-[2rem] shadow-sm">
                  <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-rose-500/20 dark:border-rose-500/30 pb-3">Your Brands</h5>
                  <div className="space-y-3">
                    {brands.map(b => (
                      <div key={b.id} className="p-3 bg-white/70 dark:bg-slate-950/45 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6]">{b.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-300">ID: {b.id}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-300">
                          <span>GSTIN: {b.gstin}</span>
                          <div className="flex gap-2">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              b.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' :
                              b.kycStatus === VerificationStatus.PENDING ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                              'bg-rose-500/10 text-rose-500'
                            }`}>
                              GSTIN: {b.kycStatus || VerificationStatus.PENDING}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              b.pennyDropStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' :
                              b.pennyDropStatus === VerificationStatus.PENDING ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                              'bg-rose-500/10 text-rose-500'
                            }`}>
                              BANK: {b.pennyDropStatus || VerificationStatus.PENDING}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-[2rem] shadow-sm">
                  <h5 className="font-extrabold text-xs text-slate-800 dark:text-[#f0ede6] uppercase tracking-wider mb-4 border-b border-rose-500/20 dark:border-rose-500/30 pb-3">Your Outlets</h5>
                  <div className="space-y-3">
                    {outlets.map(o => (
                      <div key={o.id} className="p-3 bg-white/70 dark:bg-slate-950/45 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl flex flex-col gap-2 shadow-sm">
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
                              className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                              title="Edit Shifts"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">FSSAI: {o.fssaiLicenseNumber}</div>
                        {o.timings && o.timings.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {o.timings.map((t: any, i: number) => (
                              <span key={i} className="text-[9px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {t.openingTime.substring(0,5)} - {t.closingTime.substring(0,5)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {brands.length > 0 && (
                  <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-[2rem] shadow-sm mt-6">
                    <BrandMasterMenu brandId={brands[0].id} onRefresh={loadData} />
                  </div>
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
              menuList={menuList}
              onRefresh={loadData}
            />
          </div>
        )}
        {settingsTab === "history" && selectedOutletId && (
          <div className="animate-fade-in bg-white/40 dark:bg-slate-900/40 p-6 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md shadow-sm">
            <OrderHistory 
              restaurantId={selectedOutletId} 
              onOpenChat={(id) => {
                const o = activeOrders.find(o => o.id === id);
                if (o) setSelectedChatOrder(o);
              }}
            />
          </div>
        )}
      </motion.div>

      {editingOutletShifts && (
        <OutletShiftEditor
          outlet={editingOutletShifts}
          onRefresh={loadData}
          onClose={() => setEditingOutletShifts(null)}
        />
      )}
      
      {editingOutletSettings && (
        <OutletSettingsEditor
          outlet={editingOutletSettings}
          onRefresh={loadData}
          onClose={() => setEditingOutletSettings(null)}
        />
      )}
    </>
  );
};
