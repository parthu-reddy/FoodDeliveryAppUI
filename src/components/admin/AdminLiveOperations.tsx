import React, { useState, useEffect } from 'react';
import { Package, Navigation, Truck } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { getFriendlyStatusMessage } from '../../utils/statusMessaging';
import { usePolling } from '../../hooks/usePolling';
import { Button, Input } from '../ui';

const AdminAssignmentMap = React.lazy(() => import('./AdminAssignmentMap'));

export default function AdminLiveOperations() {
  const { showSuccess, showError } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Polling for active orders every 15 seconds
  const { data: activeOrdersResponse, refetch: fetchActiveOrders } = usePolling({
    fetchFn: async () => {
      const res = await apiGet(`/api/v1/internal/admin/orders/active-all?page=${page}&size=20`);
      return res.data?.data || res.data || res;
    },
    intervalMs: 15000,
    enabled: true
  });
  
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  useEffect(() => {
      if (activeOrdersResponse) {
          const content = activeOrdersResponse.content || activeOrdersResponse.data?.content || (Array.isArray(activeOrdersResponse) ? activeOrdersResponse : []);
          setActiveOrders(Array.isArray(content) ? content : []);
          if (activeOrdersResponse.totalPages !== undefined) {
              setTotalPages(activeOrdersResponse.totalPages);
          }
      }
  }, [activeOrdersResponse]);

  // Polling for available drivers every 15 seconds
  const { data: driversList, refetch: fetchAvailableDrivers } = usePolling({
    fetchFn: async () => {
        let url = `/api/v1/internal/admin/delivery/drivers/available-with-location`;
        if (selectedOrder) {
            try {
                const restRes = await apiGet(`/api/v1/restaurants/${selectedOrder.restaurantId}`);
                const rest = restRes.data || restRes;
                if (rest && rest.lat !== undefined && rest.lng !== undefined) {
                    url += `?lat=${rest.lat}&lng=${rest.lng}&radiusKm=5`;
                }
            } catch (e) {
                console.error("Could not fetch restaurant location", e);
            }
        }
        const res = await apiGet(url);
        const content = res.data?.data || res.data || (Array.isArray(res) ? res : res.data);
        return Array.isArray(content) ? content : [];
    },
    intervalMs: 15000,
    enabled: true
  });

  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  useEffect(() => {
      if (driversList) {
          setAvailableDrivers(driversList);
      }
  }, [driversList]);

  // Optimistic Assign Driver
  const handleAssignDriver = async (orderId: string, driverId: string) => {
    // Optimistic UI Update
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryExecutiveId: driverId, status: 'ACCEPTED' } : o));
    setAvailableDrivers(prev => prev.filter(d => d.id !== driverId));
    
    try {
      await apiPost(`/api/v1/internal/admin/delivery/orders/${orderId}/assign?driverId=${driverId}`);
      showSuccess("Driver assigned successfully!");
      fetchActiveOrders();
      fetchAvailableDrivers();
      setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      showError("Failed to assign driver");
      // Revert optimistic update by refetching
      fetchActiveOrders();
      fetchAvailableDrivers();
    }
  };

  const handlePartialRefund = async (orderId: string, amount: string) => {
    try {
      await apiPost(`/api/v1/internal/admin/orders/${orderId}/refund/partial`, { amount: parseFloat(amount) });
      showSuccess("Partial refund initiated successfully!");
      setRefundAmount('');
      fetchActiveOrders();
    } catch (e: any) {
      console.error(e);
      showError(e.response?.data?.error || e.response?.data?.message || "Failed to initiate partial refund");
    }
  };

  const handlePostDeliveryRefund = async (orderId: string, amount: string) => {
    try {
      await apiPost(`/api/v1/internal/admin/orders/${orderId}/refund/post-delivery`, { amount: parseFloat(amount) });
      showSuccess("Post-delivery refund initiated successfully!");
      setRefundAmount('');
      fetchActiveOrders();
    } catch (e: any) {
      console.error(e);
      showError(e.response?.data?.error || e.response?.data?.message || "Failed to initiate post-delivery refund");
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
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedOrder?.id === order.id ? 'bg-indigo-500/10 border-indigo-500 shadow-md' : 'bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}
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
                        availableDrivers={availableDrivers} 
                        onAssign={handleAssignDriver} 
                    />
                    </React.Suspense>
                </div>
                {/* Assignment Panel */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl z-10 flex gap-6">
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
                                placeholder="Amount ($)" 
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
                                <div key={driver.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-indigo-500" />
                                        <div>
                                            <p className="font-bold text-sm">{driver.fullName || 'Unknown Driver'}</p>
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={() => handleAssignDriver(selectedOrder.id, driver.id)} className="!bg-emerald-500 hover:!bg-emerald-600 shadow-lg shadow-emerald-500/20">
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
