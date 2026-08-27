import { useToast } from "@/contexts/ToastContext";
import { usePolling } from "@/hooks/usePolling";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi, deliveryApi, restaurantApi } from "@/lib/zodiosClients";
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { Button, Input } from '@shared/ui';
import { Navigation, Package, Truck } from 'lucide-react';
import React, { useState } from 'react';
import { asUntyped, WirePage } from '../../../lib/untypedResponse';

const AdminAssignmentMap = React.lazy(() => import("@features/maps-tracking/components/AdminAssignmentMap"));

interface AdminDriver {
  id: string;
  fullName?: string;
  lat?: number;
  lng?: number;
}

interface AdminOrder {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  status: string;
  deliveryStatus?: string;
  deliveryExecutiveId?: string;
}

export default function AdminLiveOperations() {
  const { showSuccess, showError } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [activeOrders, setActiveOrders] = useState<AdminOrder[]>([]);
  // Polling for active orders every 15 seconds
  const { refetch: fetchActiveOrders } = usePolling({
    fetchFn: async () => {
      const res = await customerApi.adminOrder.get('/api/v1/internal/admin/orders/active-all', { queries: { page } });
      return res;
    },
    intervalMs: 15000,
    enabled: true,
    onData: (response) => {
        const page = asUntyped<WirePage<unknown>>(response);
        const content = page.content ?? (Array.isArray(response) ? response : []);
        // @ts-expect-error auto-migration type suppression
        setActiveOrders(Array.isArray(content) ? content : []);
        if (page.totalPages !== undefined) {
            setTotalPages(page.totalPages);
        }
    }
  });
  


  const [availableDrivers, setAvailableDrivers] = useState<AdminDriver[]>([]);
  // Polling for available drivers every 15 seconds
  const { refetch: fetchAvailableDrivers } = usePolling({
    fetchFn: async () => {
        let queries: Record<string, string | number> = {};
        if (selectedOrder) {
            try {
                const restRes = await restaurantApi.restaurantOutlet.get('/api/v1/restaurants/:id', { params: { id: selectedOrder.restaurantId } });
                const rest = restRes.data || restRes;
                if (rest && rest.lat !== undefined && rest.lng !== undefined) {
                    // @ts-expect-error auto-migration type suppression
                    queries = { lat: rest.lat, lng: rest.lng, radiusKm: 5 };
                }
            } catch (e: unknown) {
                console.error("Could not fetch restaurant location", e);
            }
        }
        // @ts-expect-error auto-migration type suppression
        const res = await deliveryApi.adminDelivery.get('/api/v1/internal/admin/delivery/drivers/available-with-location', { queries });
        const content = res;
        return Array.isArray(content) ? content : [];
    },
    intervalMs: 15000,
    enabled: true,
    onData: (response) => {
        setAvailableDrivers(response);
    }
  });



  // Optimistic Assign Driver
  const handleAssignDriver = async (orderId: string, driverId: string) => {
    // Optimistic UI Update
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryExecutiveId: driverId, status: 'ACCEPTED' } : o));
    setAvailableDrivers(prev => prev.filter(d => d.id !== driverId));
    
    try {
      await deliveryApi.adminDelivery.post('/api/v1/internal/admin/delivery/orders/:orderId/assign', undefined, { params: { orderId }, queries: { driverId } });
      showSuccess("Driver assigned successfully!");
      fetchActiveOrders();
      fetchAvailableDrivers();
      setSelectedOrder(null);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to assign driver").message);
      // Revert optimistic update by refetching
      fetchActiveOrders();
      fetchAvailableDrivers();
    }
  };

  const handlePartialRefund = async (orderId: string, amount: string) => {
    try {
      await customerApi.adminOrder.post('/api/v1/internal/admin/orders/:orderId/refund/partial', { amount: parseFloat(amount) }, { params: { orderId } });
      showSuccess("Partial refund initiated successfully!");
      setRefundAmount('');
      fetchActiveOrders();
    } catch (e: unknown) {
      console.error(e);
      const typedErr = e as { response?: { data?: { error?: string, message?: string } } };
      showError(typedErr.response?.data?.error || typedErr.response?.data?.message || "Failed to initiate partial refund");
    }
  };

  const handlePostDeliveryRefund = async (orderId: string, amount: string) => {
    try {
      await customerApi.adminOrder.post('/api/v1/internal/admin/orders/:orderId/refund/post-delivery', { amount: parseFloat(amount) }, { params: { orderId } });
      showSuccess("Post-delivery refund initiated successfully!");
      setRefundAmount('');
      fetchActiveOrders();
    } catch (e: unknown) {
      console.error(e);
      const typedErr = e as { response?: { data?: { error?: string, message?: string } } };
      showError(typedErr.response?.data?.error || typedErr.response?.data?.message || "Failed to initiate post-delivery refund");
    }
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden">
      {/* Live Orders List */}
      <div className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 backdrop-blur-xl shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/20 dark:bg-slate-900/30">
            <h3 className="font-black text-lg">Active Orders</h3>
            <Button variant="ghost" onClick={() => { fetchActiveOrders(); fetchAvailableDrivers(); }}>Refresh</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeOrders.map(order => {
                const isUnassigned = !order.deliveryExecutiveId;
                const statusColor = isUnassigned ? 'text-amber-500' : 'text-emerald-500';
                return (
                    <button 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)} 
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedOrder?.id === order.id ? 'glass-card !border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'glass-card hover:border-indigo-300'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnassigned ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                            <Package className={`w-5 h-5 ${statusColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">#{order.id.substring(0, 8)}</p>
                            <p className="text-xs text-slate-500 truncate">{order.restaurantName}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md bg-slate-200/50 dark:bg-slate-800/50 ${statusColor}`}>
                                {isUnassigned ? 'NEEDS DRIVER' : 'ASSIGNED'}
                            </span>
                        </div>
                    </button>
                );
            })}
            {activeOrders.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No active orders right now.</p>}
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/20 dark:bg-slate-900/30">
            <Button 
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
            >
                Prev
            </Button>
            <span className="text-xs font-bold text-slate-500">Page {page + 1} of {totalPages === 0 ? 1 : totalPages}</span>
            <Button 
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
            >
                Next
            </Button>
        </div>
      </div>

      {/* Main Map View */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0f111a] relative">
        {selectedOrder ? (
            <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 relative z-0">
                    <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">Loading map...</div>}>
                      <AdminAssignmentMap 
                        order={selectedOrder} 
                        // @ts-expect-error auto-migration type suppression
                        availableDrivers={availableDrivers} 
                        onAssign={handleAssignDriver} 
                    />
                    </React.Suspense>
                </div>
                {/* Assignment Panel */}
                <div className="absolute bottom-6 left-6 right-6 glass-panel p-6 z-10 flex gap-6">
                    <div className="flex-1 border-r border-slate-200 dark:border-slate-700 pr-6">
                        <h2 className="text-2xl font-black mb-1">Order #{selectedOrder.id.substring(0, 8)}</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Restaurant: {selectedOrder.restaurantName}</p>
                        <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Status: <span className="text-indigo-500 font-bold">{getFriendlyStatusMessage(selectedOrder.status, selectedOrder.deliveryStatus)}</span></p>
                    </div>
                    
                    <div className="flex-1 border-r border-slate-200 dark:border-slate-700 px-6">
                        <h3 className="font-bold text-lg mb-3">Refund Actions</h3>
                        <div className="space-y-3">
                            <Input 
                                type="number" 
                                placeholder="Amount (₹)" 
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button 
                                    variant="primary"
                                    onClick={() => handlePartialRefund(selectedOrder.id, refundAmount)}
                                    disabled={!refundAmount || parseFloat(refundAmount) <= 0}
                                    className="flex-1 !bg-amber-500 hover:!bg-amber-600"
                                >
                                    Partial Refund
                                </Button>
                                <Button 
                                    variant="primary"
                                    onClick={() => handlePostDeliveryRefund(selectedOrder.id, refundAmount)}
                                    disabled={!refundAmount || parseFloat(refundAmount) <= 0 || selectedOrder.deliveryStatus !== 'DELIVERED'}
                                    className="flex-1"
                                >
                                    Post-Delivery
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="w-1/3 pl-6">
                        <h3 className="font-bold text-lg mb-3">Available Drivers ({availableDrivers.length})</h3>
                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                            {availableDrivers.map(driver => (
                                <div key={driver.id} className="flex items-center justify-between p-3 glass-card">
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-indigo-500" />
                                        <div>
                                            <p className="font-bold text-sm">{driver.fullName || 'Unknown Driver'}</p>
                                        </div>
                                    </div>
                                    <Button variant="success" onClick={() => handleAssignDriver(selectedOrder.id, driver.id)} className="shadow-lg shadow-emerald-500/20">
                                        Assign
                                    </Button>
                                </div>
                            ))}
                            {availableDrivers.length === 0 && <p className="text-sm text-slate-500">No available drivers nearby.</p>}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Navigation className="w-16 h-16 mb-4 opacity-30 text-indigo-500" />
                <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-[#f0ede6]">Live Operations</h2>
                <p>Select an active order from the left pane to monitor it or assign a driver.</p>
            </div>
        )}
      </div>
    </div>
  );
}
