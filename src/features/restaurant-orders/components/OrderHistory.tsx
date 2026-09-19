import { Button, Input, StatusPill, Surface } from '@shared/ui';
import { useOrderHistory } from '@features/restaurant-orders/model/useOrderHistory';
import { Order } from '@/types';
import { formatINR } from '@shared/money';
import { orderStatusView } from '@features/customer-orders/model/orderStatus';
import { RestaurantOrderDetailsModal } from '@features/restaurant-orders/components/RestaurantOrderDetailsModal';
import { Calendar, ChevronLeft, ChevronRight, Package, Receipt } from 'lucide-react';
import React, { useState } from 'react';

export function OrderHistory({ restaurantId, onOpenChat }: { restaurantId: string, onOpenChat?: (orderId: string) => void }) {
  const {
    dateFilter, setDateFilter, currentPage, setCurrentPage,
    orders, totalPages, totalElements, itemsPerPage,
  } = useOrderHistory(restaurantId);
 const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);



 const paginatedOrders = orders;



 return (
 <Surface radius="xl" elevation={1} className="p-5 sm:p-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h4 className="font-extrabold text-lg tracking-tight uppercase font-sans text-slate-800 dark:text-[#f0ede6] flex items-center gap-2">
 <Package className="w-5 h-5 text-amber-500" />
 Order History
 </h4>
 <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">View and filter past orders. Limited to 100 per page.</p>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="relative">
 <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
 <Input
 type="date"
 aria-label="Filter orders by date"
 value={dateFilter}
 onChange={(e) => {
 setDateFilter(e.target.value);
 setCurrentPage(1);
 }}
 className="pl-9 pr-4 w-full sm:w-auto focus:ring-2 focus:ring-rose-500/50"
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

 <Surface radius="lg" elevation={0} className="overflow-hidden">
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
 {new Date((order as {timestamp?: string}).timestamp || order.createdAt).toLocaleDateString()}
 </span>
 <span className="text-xs text-slate-500 dark:text-slate-300 font-mono">
 {new Date((order as {timestamp?: string}).timestamp || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 </td>
 <td className="p-4 whitespace-nowrap">
 {order.estimatedCompletionTime ? (
 <div className="flex flex-col">
 <span className="font-bold text-rose-600 dark:text-rose-400">
 {new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 ) : (
 <span className="text-slate-400 text-xs">-</span>
 )}
 </td>
 <td className="p-4 whitespace-nowrap">
 <span className="font-medium text-slate-800 dark:text-[#f0ede6]">Customer</span>
 </td>
 <td className="p-4">
 <div className="flex flex-col gap-1">
 // @ts-expect-error auto-migration type suppression
 {order.items?.map((it: unknown, idx: number) => {
 const item = it as { quantity?: number, item?: { name?: string }, name?: string };
 return (
 <div key={idx} className="text-xs flex items-center gap-1.5 text-slate-600 dark:text-[#f0ede6]">
 <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{item.quantity || 1}x</span>
 <span className="truncate max-w-[120px] sm:max-w-[180px]">{item.item?.name || (item).name || 'Item'}</span>
 </div>
 )
 })}
 </div>
 </td>
 <td className="p-4 whitespace-nowrap">
 <div className="flex flex-col">
 <div className="flex items-center gap-1 font-black text-slate-800 dark:text-[#f0ede6]">
 {formatINR(order.totalAmount || 0)}
 </div>
 {(order.sgst !== undefined || order.cgst !== undefined) && (
 <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
 Incl. Tax: {formatINR((order.sgst || 0) + (order.cgst || 0))}
 </div>
 )}
 </div>
 </td>
 <td className="p-4 pr-6 whitespace-nowrap">
 {(() => {
 const view = orderStatusView(order.status, order.deliveryStatus);
 return <StatusPill label={view.label} tone={view.tone} live={view.live} />;
 })()}
 </td>
 <td className="p-4 whitespace-nowrap">
 <div className="flex flex-col gap-2">
 {/* Refund button removed as Restaurants do not have API permissions to issue refunds directly */}
 
 {/* Restaurant's OrderHistory gives a 4 hour window from HANDED_OVER to account for delivery time */}
 { }
 {/* eslint-disable-next-line react-hooks/purity */}
 {onOpenChat && order.updatedAt && (Date.now() - new Date(order.updatedAt).getTime() < 4 * 60 * 60 * 1000) && (
 <button
 onClick={() => onOpenChat(order.id)}
 className="text-xs font-bold text-blue-500 hover:text-blue-600 underline text-left"
 >
 Chat
 </button>
 )}
 <button
 onClick={() => setSelectedOrderForDetails(order)}
 className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 text-left"
 >
 <Receipt className="w-3 h-3" />
 Details
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={8} className="p-16 text-center">
 <div className="flex flex-col items-center justify-center gap-4 duration-500">
 <div className="relative">
 <div className="absolute inset-0 bg-rose-500/20 dark:bg-rose-500/10 rounded-full blur-xl animate-pulse"></div>
 <Surface radius="full" elevation={2} className="w-20 h-20 flex items-center justify-center relative z-10">
 <Package className="w-10 h-10 text-rose-400 dark:text-rose-500" strokeWidth={1.5} />
 </Surface>
 </div>
 <h3 className="text-lg font-bold text-slate-800 dark:text-[#f0ede6]">No Orders Found</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
 {dateFilter 
 ? "We couldn't find any orders for the selected date. Try choosing a different date or clear the filter." 
 : "You don't have any past orders yet. Once you start receiving orders, they will appear here."}
 </p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </Surface>

 {totalPages > 1 && (
 <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
 <div className="text-xs text-slate-500 dark:text-slate-300 font-medium">
 Showing <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{Math.min(currentPage * itemsPerPage, totalElements)}</span> of <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{totalElements}</span> orders
 </div>
 
 <div className="flex items-center gap-2">
 <Button
 variant="secondary"
 size="icon"
 aria-label="Previous page"
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 >
 <ChevronLeft className="w-4 h-4" />
 </Button>
 
 <div className="flex items-center gap-1">
 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
 let pageNum = currentPage;
 if (totalPages <= 5) pageNum = i + 1;
 else if (currentPage <= 3) pageNum = i + 1;
 else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
 else pageNum = currentPage - 2 + i;
 
 return (
 <Button
 key={pageNum}
 size="sm"
 variant={currentPage === pageNum ? 'primary' : 'secondary'}
 aria-current={currentPage === pageNum ? 'page' : undefined}
 onClick={() => setCurrentPage(pageNum)}
 className="w-8 justify-center"
 >
 {pageNum}
 </Button>
 );
 })}
 </div>
 
 <Button
 variant="secondary"
 size="icon"
 aria-label="Next page"
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 >
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 </div>
 )}
 
 <RestaurantOrderDetailsModal
 order={selectedOrderForDetails}
 isOpen={!!selectedOrderForDetails}
 onClose={() => setSelectedOrderForDetails(null)}
 />
 </Surface>
 );
}
