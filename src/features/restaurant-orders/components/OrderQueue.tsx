import React from 'react';
import { Order, OrderStatus } from '@/types';
import { Clock, Check } from 'lucide-react';

interface OrderQueueProps {
  orders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
}

export default function OrderQueue({ orders, onAcceptOrder, onRejectOrder }: OrderQueueProps) {
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING_ACCEPTANCE);
  
  if (pendingOrders.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 rounded-3xl space-y-2.5">
        <Clock className="w-8 h-8 mx-auto opacity-50" />
        <p className="text-sm font-semibold">No pending orders in the queue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Incoming Orders ({pendingOrders.length})</h3>
      {pendingOrders.map(order => (
        <div key={order.id} className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-mono text-xs font-bold text-slate-500">ORDER #{order.id.substring(0, 8)}</p>
              <p className="font-black mt-1 text-slate-900 dark:text-white">{order.customerName}</p>
            </div>
            <p className="font-black text-rose-500">₹{order.totalAmount?.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onAcceptOrder(order.id)} className="flex-1 py-2 bg-indigo-500 text-white rounded-xl font-bold flex justify-center items-center gap-2">
              <Check className="w-4 h-4" /> Accept
            </button>
            <button onClick={() => onRejectOrder(order.id)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
