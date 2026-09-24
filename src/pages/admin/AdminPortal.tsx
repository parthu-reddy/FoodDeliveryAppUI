import { Surface } from '@shared/ui';
import { useTheme } from "@/contexts/ThemeContext";
import { customerApi } from "@/lib/zodiosClients";
import AdminLiveOperations from "@features/admin-ops/components/AdminLiveOperations";
import AdminManualInterventions from "@features/admin-ops/components/AdminManualInterventions";
import AdminSupportTickets from "@features/admin-ops/components/AdminSupportTickets";
import AdminUserManagement from "@features/admin-ops/components/AdminUserManagement";
import AdminCategories from '@features/catalog/components/admin/AdminCategories';
import AdminLedgerView from "@features/ledger/components/AdminLedgerView";
import AdminPayoutsPage from "./money/AdminPayoutsPage";
import MoneyOperationsPage from "./money/OperationsPage";
import RefundQueue from "./money/RefundQueue";
import { Button, SidebarNav } from '@shared/ui';
import { AdminReviewsView } from '@features/reviews';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { Activity, AlertTriangle, Database, LogOut, MapPin, MessageSquare, Moon, RotateCcw, Shield, Star, Sun, Tags, Users } from 'lucide-react';
import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';

const AdminFleetMap = React.lazy(() => import("@features/maps-tracking/components/AdminFleetMap"));

interface AdminPortalProps {
  onLogout: () => void;
}

export default function AdminPortal({
  onLogout,
}: AdminPortalProps) {
  const { theme, toggleTheme } = useTheme();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract activeTab from URL, default to 'map'
  const pathParts = location.pathname.split('/');
  const currentPath = pathParts[pathParts.length - 1];
  const validTabs = ['deliveries', 'users', 'categories', 'map', 'ledger', 'payouts', 'money_ops', 'interventions', 'support_tickets', 'refunds', 'reviews'];
  const activeTab = validTabs.includes(currentPath) ? currentPath : 'map';

  // Poll for intervention count to show badge on sidebar
    const { data: interventionsCount = 0 } = usePolling({
    fetchFn: async () => {
      const res = await customerApi.adminOrderManual.get('/api/v1/internal/admin/orders/intervention', {});
      const content = res.content ?? [];
      return content.length;
    },
    intervalMs: 15000,
    enabled: activeTab !== 'interventions' // AdminManualInterventions handles polling when active
  });

  return (
    <div className="flex w-full h-full bg-transparent overflow-hidden">
      {/* Sidebar Navigation */}
      <Surface elevation={2} className="w-64 border-r flex flex-col shrink-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-rose-500/20">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6]" subColorClass="text-rose-500" />
          <h1 className="font-black text-xl tracking-tight text-slate-800 dark:text-[#f0ede6]">Admin</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <SidebarNav
            activeKey={activeTab}
            onSelect={(key) => navigate(`/admin/${key}`)}
            items={[
              { key: 'deliveries', label: 'Live Operations', icon: <Activity className="w-5 h-5" /> },
              { key: 'support_tickets', label: 'Support Tickets', icon: <MessageSquare className="w-5 h-5" /> },
              { key: 'refunds', label: 'Refund Queue', icon: <RotateCcw className="w-5 h-5" /> },
              { key: 'interventions', label: 'Manual Interventions', icon: <Shield className="w-5 h-5" />, badge: interventionsCount || undefined },
              { key: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
              { key: 'categories', label: 'Categories', icon: <Tags className="w-5 h-5" /> },
              { key: 'map', label: 'Fleet Map', icon: <MapPin className="w-5 h-5" /> },
              { key: 'ledger', label: 'Ledger Entries', icon: <Database className="w-5 h-5" /> },
              { key: 'payouts', label: 'Pending Payouts', icon: <Database className="w-5 h-5" /> },
              { key: 'money_ops', label: 'Money Operations', icon: <AlertTriangle className="w-5 h-5" /> },
              { key: 'reviews', label: 'Review Moderation', icon: <Star className="w-5 h-5" /> },
            ]}
          />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-rose-500" />}
          </Button>
          {onLogout && (
            <Button variant="danger" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Surface>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent text-slate-800 dark:text-[#f0ede6]">
        <Routes>
          <Route path="map" element={
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
              <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">Loading map...</div>}>
                <AdminFleetMap />
              </React.Suspense>
            </div>
          } />
          
          <Route path="reviews" element={
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
              <AdminReviewsView />
            </div>
          } />
          
          <Route path="ledger" element={
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
              <AdminLedgerView />
            </div>
          } />
          
          <Route path="payouts" element={
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
              <AdminPayoutsPage />
            </div>
          } />
          
          <Route path="money_ops" element={
            <div className="flex-1 w-full h-full overflow-y-auto">
              <MoneyOperationsPage />
            </div>
          } />
          
          <Route path="interventions" element={<AdminManualInterventions />} />
          <Route path="refunds" element={<RefundQueue />} />
          <Route path="support_tickets" element={<AdminSupportTickets />} />
          <Route path="deliveries" element={<AdminLiveOperations />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="categories" element={<AdminCategories />} />
          
          <Route path="*" element={<Navigate to="map" replace />} />
        </Routes>
      </div>
    </div>
  );
}
