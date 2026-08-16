import { RoleName } from "@/types";
import React, { useState, useEffect } from 'react';
import { getBrands, getOutletsByBrand, Brand, Outlet } from '@features/catalog/model/menuStore';
import BrandRegistration from '@features/catalog/components/restaurant/BrandRegistration';
import OutletRegistration from '@features/catalog/components/restaurant/OutletRegistration';
import RestaurantDashboard from './RestaurantDashboard';
import { Order, OrderStatus } from "@/types";

import { Store, Moon, Sun, User } from 'lucide-react';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import PartnerAccountModal from "@features/catalog/components/PartnerAccountModal";

interface Props {
  userName: string;
  userPhone: string;
  onNameUpdate: (name: string) => void;
  activeOrders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, riderInfo?: any) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function RestaurantPortal(props: Props) {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const fetchState = async () => {
    setLoading(true);
    const b = await getBrands();
    setBrands(b);
    if (b.length > 0) {
      setSelectedBrand(b[0]);
      const o = await getOutletsByBrand(b[0].id);
      setOutlets(o);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchState();
  }, []);

  const renderRegistrationHeader = () => (
    <header className="sticky top-0 bg-white/20 dark:bg-slate-950/20 backdrop-blur-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
      <div className="flex items-center gap-3.5 flex-wrap">
        <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
        <div className="hidden sm:flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs tracking-tight leading-none text-slate-900 dark:text-[#f0ede6]">Partner Portal</h3>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`text-[9px] font-bold font-mono text-amber-500`}>
                SETUP REQUIRED
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={props.onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
          title="Toggle Light/Dark Mode"
        >
          {props.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        <button 
          onClick={() => setShowProfile(true)}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
          title="Profile & Settings"
        >
          <User className="w-4 h-4 text-indigo-500" />
        </button>
      </div>
    </header>
  );

  const renderRegistrationLayout = (children: React.ReactNode) => (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white/30 dark:bg-black/30 backdrop-blur-md">
      {renderRegistrationHeader()}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
      
      <PartnerAccountModal 
        isOpen={showProfile}
        portalRole={RoleName.RESTAURANT}
        onClose={() => setShowProfile(false)}
        userName={props.userName}
        userPhone={props.userPhone}
        onNameUpdate={props.onNameUpdate}
        onLogout={props.onLogout}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center backdrop-blur-md bg-white/30 dark:bg-black/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (brands.length === 0) {
    return renderRegistrationLayout(
      <BrandRegistration onRefresh={fetchState} />
    );
  }

  if (outlets.length === 0 && selectedBrand) {
    return renderRegistrationLayout(
      <OutletRegistration onRefresh={fetchState} brandId={selectedBrand.id} />
    );
  }

  return (
    <RestaurantDashboard 
      {...props} 
      restaurantId={outlets[0]?.id || ''} 
    />
  );
}
