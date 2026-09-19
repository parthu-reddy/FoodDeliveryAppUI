import React, { useState } from 'react';
import { restaurantApi } from '@/lib/zodiosClients';
import { OrderStatus, type Order } from '@/types';

/**
 * A page of this outlet's completed orders, filtered by date.
 *
 * The mapping from the fulfillment API's loosely-typed rows into `Order` is the substance
 * here: items arrive as a JSON string on some rows and an array on others, and the total has
 * to be recomputed when the row omits it. That was 50 lines inside a render function.
 */

const ITEMS_PER_PAGE = 10;

export function useOrderHistory(restaurantId: string) {
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = ITEMS_PER_PAGE;

React.useEffect(() => {
if (!restaurantId) return;
const fetchHistory = async () => {
try {
const queries: Record<string, string | number> = {
page: currentPage - 1,
size: ITEMS_PER_PAGE
};
if (dateFilter) queries.date = dateFilter;

const res = await restaurantApi.fulfillment.get('/api/v1/restaurants/:restaurantId/fulfillment/orders/history', { params: { restaurantId }, queries });
if (res.data) {


const mapped = (res.data.content || []).map((o) => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = o as Record<string, any>;
let s = (raw.status || '').toUpperCase();
if (s === OrderStatus.READY_FOR_PICKUP || s === 'READY') s = OrderStatus.READY_FOR_PICKUP; 
if (s === OrderStatus.CANCELLED_BY_RESTAURANT) s = OrderStatus.CANCELLED;

let parsedItems = raw.items || [];
if (raw.itemsJson && typeof raw.itemsJson === 'string') {
try { parsedItems = JSON.parse(raw.itemsJson); } catch { /* keep fallback */ }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculatedTotal = Array.isArray(parsedItems) ? parsedItems.reduce((acc: number, item: any) => {
return acc + (item.item?.price || item.price || 0) * (item.quantity || 1);
}, 0) : 0;

return {
...o, 
id: raw.orderId || raw.id, 
status: s as OrderStatus, 
items: parsedItems,
totalAmount: raw.totalAmount || raw.total || calculatedTotal,
itemTotal: raw.itemTotal || raw.subtotal || calculatedTotal,
createdAt: raw.createdAt || new Date().toISOString(),
sgst: raw.sgst || 0,
cgst: raw.cgst || 0,
deliveryFee: raw.deliveryFee || 0,
restaurantName: raw.restaurantName || '',
customerPlatformFee: raw.customerPlatformFee || 0,
} as Order;
});
setOrders(mapped);
setTotalPages(res.data.totalPages || 1);
setTotalElements(res.data.totalElements || mapped.length);
}
} catch (err: unknown) {
console.error('Failed to fetch history orders', err);
}
};
fetchHistory();
}, [restaurantId, dateFilter, currentPage]);

  return {
    dateFilter, setDateFilter,
    currentPage, setCurrentPage,
    orders, totalPages, totalElements, itemsPerPage,
  };
}
