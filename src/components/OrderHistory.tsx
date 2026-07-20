import React, { useState, useMemo } from 'react';
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, Package, DollarSign, Clock } from 'lucide-react';
import { OrderStatus, Order } from '../types';
import { apiPost } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';

export function OrderHistory({ orders }: { orders: Order[] }) {
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const { showSuccess, showError } = useToast();

  const filteredOrders = useMemo(() => {
    let filtered = orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
        return orderDate === dateFilter;
      });
    }
    
    return filtered;
  }, [orders, dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PAID: return 'bg-amber-100 text-amber-600 border-amber-200';
      case OrderStatus.ACCEPTED: return 'bg-blue-100 text-blue-600 border-blue-200';
      case OrderStatus.ACCEPTED: return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case OrderStatus.READY_FOR_PICKUP: return 'bg-purple-100 text-purple-600 border-purple-200';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-orange-100 text-orange-600 border-orange-200';
      case OrderStatus.DELIVERED: return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 dark:text-slate-300 border-rose-500/20';
    }
  };

  return (
    <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 sm:p-8 rounded-[2rem] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="font-extrabold text-lg tracking-tight uppercase font-sans text-slate-800 dark:text-[#f0ede6] flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            Order History
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">View and filter past orders. Limited to 100 per page.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 outline-none w-full sm:w-auto"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => {
                setDateFilter('');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/20 dark:bg-slate-950/20 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rose-500/20 dark:border-rose-500/30 bg-slate-50/50 dark:bg-slate-900/20 text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-300 tracking-wider">
                <th className="p-4 pl-6 whitespace-nowrap">Order ID</th>
                <th className="p-4 whitespace-nowrap">Date & Time</th>
                <th className="p-4 whitespace-nowrap">ETA</th>
                <th className="p-4 whitespace-nowrap">Customer</th>
                <th className="p-4 whitespace-nowrap">Items</th>
                <th className="p-4 whitespace-nowrap">Total</th>
                <th className="p-4 pr-6 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-600 dark:text-[#f0ede6]">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-[#f0ede6]">
                          {new Date(order.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300 font-mono">
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {order.estimatedCompletionTime ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-[#f0ede6]">{order.customerName}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs flex items-center gap-1.5 text-slate-600 dark:text-[#f0ede6]">
                            <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{item.quantity || 1}x</span>
                            <span className="truncate max-w-[120px] sm:max-w-[180px]">{item.item?.name || item.name || 'Item'}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-black text-slate-800 dark:text-[#f0ede6]">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        {order.total?.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 pr-6 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] uppercase`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <button
                        onClick={async () => {
                           try {
                             // Assuming paymentId is same as order.id or we pass order.id as a fallback
                             await apiPost(`/api/v1/payments/${order.id}/refund`, { amount: order.total });
                             showSuccess('Refund requested successfully.');
                           } catch (e) {
                             console.error(e);
                             showError('Refund request failed.');
                           }
                        }}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                      >
                        Refund
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-300">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p>No orders found for this date.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-300 font-medium">
            Showing <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{filteredOrders.length}</span> orders
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 text-slate-600 dark:text-[#f0ede6] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      currentPage === pageNum
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 text-slate-600 dark:text-[#f0ede6] hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/20 dark:bg-slate-950/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 text-slate-600 dark:text-[#f0ede6] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
