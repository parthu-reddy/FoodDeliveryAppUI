import { X } from 'lucide-react';
import React from 'react';
import type { Order } from '@/types';
import { MessageSquare } from 'lucide-react';
import { Badge, Button, EmptyState, Surface } from '@shared/ui';

/**
 * Every order the restaurant currently has an open conversation about.
 *
 * A floating panel over the dashboard — genuinely chrome, which is why it keeps its glass and
 * its own positioning. It was inline in the dashboard, below the modals and above the call
 * overlay, where nothing suggested it was a separate surface at all.
 */

interface RestaurantChatListProps {
  orders: Order[];
  onSelect: (order: Order) => void;
  onClose: () => void;
}

export function RestaurantChatList({ orders, onSelect, onClose }: RestaurantChatListProps) {
  return (
  <Surface elevation={2} className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[100dvh] sm:h-[500px] max-h-[100dvh] sm:max-h-[calc(100vh-6rem)] sm:rounded-2xl flex flex-col overflow-hidden z-[50] sm:border sm:border-slate-200">
    <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
      <h3 className="font-semibold text-lg">Active Chats</h3>
      <Button variant="ghost" onClick={() => onClose()} size="icon" className="!text-white hover:!bg-slate-700">
        <X className="w-5 h-5" />
      </Button>
    </div>
    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2">
      {orders.length === 0 ? (
        <div className="h-full pt-10">
          <EmptyState 
            title="No active orders"
            description="Chats will appear here when you have active orders."
            icon={<MessageSquare className="w-12 h-12" />}
          />
        </div>
      ) : (
        orders.map(order => (
          <button
            key={order.id}
            onClick={() => {
              onSelect(order);
              onClose();
            }}
            className="w-full text-left bg-white p-4 rounded-xl border border-slate-100 transition-shadow flex justify-between items-center group"
          >
            <div className="flex flex-col overflow-hidden pr-2">
              <span className="font-bold text-slate-800">Order #{order.id.substring(0,8)}</span>
              <span className="text-sm text-slate-500 truncate">Customer</span>
            </div>
            <Badge variant="warning" className="group-hover:!bg-amber-600 group-hover:!text-white transition-colors">
              Chat
            </Badge>
          </button>
        ))
      )}
    </div>
  </Surface>
  );
}
