import { PhoneCall, Star, X } from 'lucide-react';
import React from 'react';
import type { Order } from '@/types';
import { DeliveryStatus } from '@/types/backend-enums';
import { formatINR } from '@shared/money';
import { Surface } from '@shared/ui';
import { terminalHeadline } from '@features/customer-orders/model/orderStatus';
import type { useOrderRefunds } from '@features/customer-orders/model/useOrderRefunds';
import { formatDate, formatDateTime } from '@/shared/time';

/**
 * An order that has finished — delivered, cancelled or failed — with its bill and any refund
 * raised against it.
 *
 * Split from `CustomerOrderTracker`. It is the half a customer reaches for when something
 * went wrong, which is why the refund state and the invoice live together here.
 */

interface OrderTrackerSettledProps {
  currentTrackingOrder: Order;
  isFailedOrder: (order: Order) => boolean;
  getFriendlyStatusMessage: (status: string, deliveryStatus?: string) => string;
  refunds: ReturnType<typeof useOrderRefunds>;
  startCall: (userId: string, name: string) => void;
  setOrderIdToRate: (id: string | null) => void;
}

export function OrderTrackerSettled({
  currentTrackingOrder, isFailedOrder, getFriendlyStatusMessage, refunds, setOrderIdToRate, startCall,
}: OrderTrackerSettledProps) {
  return (
  <Surface radius="xl" elevation={2} className="p-6 space-y-6" data-testid="order-tracker" data-order-id={currentTrackingOrder.id} data-status={currentTrackingOrder.status}>
    <div className="text-center pb-4 border-b border-rose-500/10 dark:border-slate-800">
      <div className="inline-flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 items-center justify-center mb-3">
        <X className="w-6 h-6 text-rose-500" />
      </div>
      <h2 className="text-2xl font-black mb-1 capitalize">{getFriendlyStatusMessage(currentTrackingOrder.status, currentTrackingOrder.deliveryStatus)}</h2>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">#{currentTrackingOrder.id.substring(0, 8)}</p>

      {/* Who ended it, and why. Phase 3 made a dispatch failure a different status from a
          restaurant cancellation because they mean different things to the customer; this is
          the only place that difference reaches them. */}
      {terminalHeadline(currentTrackingOrder.status) && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300" data-testid="terminal-headline">
          {terminalHeadline(currentTrackingOrder.status)}
        </p>
      )}
      {currentTrackingOrder.cancellationReason && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic" data-testid="cancellation-reason">
          {currentTrackingOrder.cancellationReason}
        </p>
      )}
      {/* The moment the food has actually arrived is when someone has an opinion worth
          capturing. Offered once, here, and otherwise left to order history -- a prompt that
          follows the customer around is nagging, not a feature. */}
      {currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED && (
        <button
          type="button"
          onClick={() => setOrderIdToRate(currentTrackingOrder.id as string)}
          data-testid="rate-order-prompt"
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
        >
          <Star className="w-4 h-4" />
          How was it? Rate this order
        </button>
      )}

      {refunds.length > 0 && (
        <div className="mt-3 space-y-1 text-left" data-testid="refund-state">
          {refunds.map(refund => (
            <div key={refund.id} className="text-xs bg-slate-500/5 border border-slate-500/20 rounded-xl p-3 space-y-0.5">
              <div className="flex justify-between font-semibold">
                <span>Refund {formatINR(refund.amount ?? 0)}</span>
                <span>{refund.status}</span>
              </div>
              <p className="text-slate-400 dark:text-slate-300">
                {refund.destination === 'STORE_CREDIT'
                  ? 'Returned as store credit in your wallet'
                  : refund.destination === 'NONE'
                  ? 'Nothing was charged, so there is nothing to return'
                  : 'Returned to your original payment method'}
                {refund.expectedBy ? ` — expected by ${formatDate(refund.expectedBy)}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Invoice Details */}
      <div className="mt-4 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        {currentTrackingOrder.restaurantName && (
          <div className="flex justify-between">
            <span>Restaurant</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{currentTrackingOrder.restaurantName}</span>
          </div>
        )}
        {currentTrackingOrder.createdAt && (
          <div className="flex justify-between">
            <span>Date</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">{formatDateTime(currentTrackingOrder.createdAt)}</span>
          </div>
        )}
        {currentTrackingOrder.deliveryAddress && (
          <div className="flex justify-between mt-2 pt-2 border-t border-rose-500/10 dark:border-slate-700/50">
            <span>Delivery To</span>
            <span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px] leading-tight truncate">{currentTrackingOrder.deliveryAddress}</span>
          </div>
        )}
      </div>
    </div>
    
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-[#f0ede6]">{currentTrackingOrder.restaurantName}</h3>
        {currentTrackingOrder.restaurantId && (
          <button 
            onClick={() => startCall(currentTrackingOrder.restaurantId!, currentTrackingOrder.id)}
            className="p-1.5 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 transition-colors"
            title={`Call ${currentTrackingOrder.restaurantName}`}
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {currentTrackingOrder.items && currentTrackingOrder.items.map((item: unknown, idx: number) => {
          const i = item as { item?: { id?: string; name?: string; price?: number }; quantity?: number; name?: string; price?: number };
          return (
          <div key={idx} className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span>{i.quantity || 1}x {i.item?.name || i.name || 'Item'}</span>
            <span>{formatINR((i.item?.price || i.price || 0) * (i.quantity || 1))}</span>
          </div>
        )})}
      </div>
      
      <div className="pt-4 border-t border-dashed border-rose-500/20 dark:border-slate-700 space-y-2">
        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
          <span>Items Total</span>
          <span>{formatINR(currentTrackingOrder.itemTotal ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
          <span>Delivery Fee {(currentTrackingOrder as {otp?: string, distanceKm?: number}).distanceKm ? `(${(currentTrackingOrder as {otp?: string, distanceKm?: number}).distanceKm} km)` : ''}</span>
          <span>{currentTrackingOrder.deliveryFee !== undefined ? formatINR(currentTrackingOrder.deliveryFee) : formatINR(0)}</span>
        </div>
        {currentTrackingOrder.customerPlatformFee !== undefined && (
          <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
            <span>Platform Fee</span>
            <span>{formatINR(currentTrackingOrder.customerPlatformFee)}</span>
          </div>
        )}
        {currentTrackingOrder.sgst !== undefined && (
          <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
            <span>SGST</span>
            <span>{formatINR(currentTrackingOrder.sgst)}</span>
          </div>
        )}
        {currentTrackingOrder.cgst !== undefined && (
          <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
            <span>CGST</span>
            <span>{formatINR(currentTrackingOrder.cgst)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-rose-500/20 dark:border-slate-700">
          <span>{isFailedOrder(currentTrackingOrder) ? 'Total Refunded' : 'Total Paid'}</span>
          <span className={isFailedOrder(currentTrackingOrder) ? 'text-rose-500' : ''}>{formatINR(currentTrackingOrder.totalAmount || 0)}</span>
        </div>
        {currentTrackingOrder.paymentMethod && (
          <div className="flex justify-end pt-1 text-right">
            <div className="flex flex-col items-end">
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded font-medium border border-slate-200 dark:border-slate-700 inline-block mb-1">
                {isFailedOrder(currentTrackingOrder) ? 'Refunded to ' : 'Paid via '}{currentTrackingOrder.paymentMethod}
              </span>
              {isFailedOrder(currentTrackingOrder) && (
                <span className="text-[10px] text-slate-400">Refunds may take 3-5 business days to reflect in your account.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </Surface>
  );
}
