import React, { useState } from 'react';
import { Shield, LogOut, Sun, Moon, MapPin, Users, Activity, Tags, Database } from 'lucide-react';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { usePolling } from '../../hooks/usePolling';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from "@/lib/zodiosClients";
import { SidebarNav, Button } from '@shared/ui';
import { useTheme } from "@/context/ThemeContext";

const AdminFleetMap = React.lazy(() => import("@features/maps-tracking/components/AdminFleetMap"));
import AdminLedgerView from "@features/ledger/components/AdminLedgerView";
import AdminPayoutsView from "@features/ledger/components/AdminPayoutsView";
import AdminLiveOperations from "@features/admin-ops/components/AdminLiveOperations";
import AdminManualInterventions from "@features/admin-ops/components/AdminManualInterventions";
import AdminUserManagement from "@features/admin-ops/components/AdminUserManagement";
import AdminCategories from '@features/catalog/components/admin/AdminCategories';

export default function AdminPortal({
  onLogout,
}: any) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'users' | 'categories' | 'map' | 'ledger' | 'payouts' | 'interventions'>('map');

  // Poll for intervention count to show badge on sidebar
  const { data: interventionsCount = 0 } = usePolling({
    fetchFn: async () => {
      const res = await customerApi.adminOrderManual.get('/api/v1/internal/admin/orders/intervention', {});
      const content = res.content || res.data?.content || res.data?.data?.content || (Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
      return Array.isArray(content) ? content.length : 0;
    },
    intervalMs: 15000,
    enabled: activeTab !== 'interventions' // AdminManualInterventions handles polling when active
  });

  return (
    <div className="flex w-full h-full bg-transparent overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-rose-500/20">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6]" subColorClass="text-rose-500" />
          <h1 className="font-black text-xl tracking-tight text-slate-800 dark:text-[#f0ede6]">Admin</h1>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <SidebarNav
            activeColor="indigo"
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key as 'deliveries'|'interventions'|'users'|'categories'|'map'|'ledger'|'payouts')}
            items={[
              { key: 'deliveries', label: 'Live Operations', icon: <Activity className="w-5 h-5" /> },
              { key: 'interventions', label: 'Manual Interventions', icon: <Shield className="w-5 h-5" />, badge: interventionsCount },
              { key: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
              { key: 'categories', label: 'Categories', icon: <Tags className="w-5 h-5" /> },
              { key: 'map', label: 'Fleet Map', icon: <MapPin className="w-5 h-5" /> },
              { key: 'ledger', label: 'Ledger Entries', icon: <Database className="w-5 h-5" /> },
              { key: 'payouts', label: 'Pending Payouts', icon: <Database className="w-5 h-5" /> },
            ]}
          />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </Button>
            {onLogout && (
                <Button variant="danger" size="icon" onClick={onLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent text-slate-800 dark:text-[#f0ede6]">
        {activeTab === 'map' && (
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
                <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">Loading map...</div>}>
                  <AdminFleetMap />
                </React.Suspense>
            </div>
        )}

        {activeTab === 'ledger' && (
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
                <AdminLedgerView />
            </div>
        )}
        
        {activeTab === 'payouts' && (
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
                <AdminPayoutsView />
            </div>
        )}

        {activeTab === 'interventions' && <AdminManualInterventions />}
        {activeTab === 'deliveries' && <AdminLiveOperations />}
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'categories' && <AdminCategories />}
      </div>
    </div>
  );
}
