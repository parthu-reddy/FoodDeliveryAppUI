import { Check, XCircle } from 'lucide-react';
import React from 'react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';

/**
 * The stage list a customer watches while their order is in flight — or the reason it
 * stopped, when it did.
 *
 * Both readings of the same question live together because they are the same question: the
 * cancelled panel is not a separate screen, it is what the checklist becomes when there is
 * nothing left to tick.
 */

interface OrderTrackerStepsProps {
  currentTrackingOrder: Order;
  isFailedOrder: (order: Order) => boolean;
}

export function OrderTrackerSteps({ currentTrackingOrder, isFailedOrder }: OrderTrackerStepsProps) {
  return (
    <>
    {isFailedOrder(currentTrackingOrder) ? (
      <div
        className="p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 mt-4 mx-2"
        style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-line)',
        }}
      >
<XCircle className="w-10 h-10 mb-1" style={{ color: 'var(--color-danger)' }} />
<h3 className="font-black" style={{ color: 'var(--color-danger)' }}>Order Cancelled</h3>

      </div>
    ) : (
      <div className="space-y-0 pt-4 px-2">
{(() => {
  const UI_STEPS = [
    { status: OrderStatus.PENDING_ACCEPTANCE, label: 'Order Received' },
    { status: OrderStatus.ACCEPTED, label: 'Accepted by Kitchen' },
    { status: OrderStatus.PREPARING, label: 'Cooking & Packaging' },
    { status: OrderStatus.HANDED_OVER, label: 'Picked up by Delivery Executive' },
    { status: DeliveryStatus.DELIVERED, label: 'Handed Over & Verified' }
  ];

  return UI_STEPS.map((step, idx, arr) => {
    const stepStatusIndex = UI_STEPS.findIndex(s => s.status === step.status);
    const currentStatusIndex = UI_STEPS.findIndex(s => s.status === (currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED ? DeliveryStatus.DELIVERED : currentTrackingOrder.status));
    const isDone = currentStatusIndex > stepStatusIndex || (currentStatusIndex === stepStatusIndex && step.status !== DeliveryStatus.DELIVERED);
    const isCurrent = currentStatusIndex === stepStatusIndex || (step.status === OrderStatus.PREPARING && [OrderStatus.READY_FOR_PICKUP, OrderStatus.HANDED_OVER].includes(currentTrackingOrder.status as OrderStatus));
    const isLast = idx === arr.length - 1;

    return (
      <div key={idx} className="flex items-start gap-4 relative">
        {/* Vertical line connector */}
        {!isLast && (
          <div
            className="absolute left-3 top-6 bottom-[-6px] w-[2px] -ml-[1px]"
            style={{ background: isDone ? 'var(--color-success)' : 'var(--color-paper-line)' }}
          />
        )}
        
        <div
          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold z-10"
          style={{
            // Done is green, in progress is amber, not-yet is the sunken paper. Before this
            // both done and current were amber, so a customer could not tell the stage they
            // were at from the ones already behind them.
            background: isDone ? 'var(--color-success)'
              : isCurrent ? 'var(--color-warning)' : 'var(--color-paper-sunken)',
            border: `1px solid ${isDone ? 'var(--color-success)'
              : isCurrent ? 'var(--color-warning)' : 'var(--color-paper-line)'}`,
            color: isDone || isCurrent ? '#ffffff' : 'var(--color-ink-3)',
            transitionProperty: 'background-color, border-color, color',
            transitionDuration: 'var(--duration-base)',
          }}
        >
          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
        </div>
        
        <div className={`pb-6 ${isLast ? 'pb-2' : ''}`}>
          <span
            className={`text-sm tracking-wide ${isDone ? 'font-extrabold' : isCurrent ? 'font-black' : 'font-semibold'}`}
            style={{
              color: isDone ? 'var(--color-ink)'
                : isCurrent ? 'var(--color-warning)' : 'var(--color-ink-3)',
            }}
          >
            {step.label}
          </span>
          {isCurrent && currentTrackingOrder.deliveryStatus !== DeliveryStatus.DELIVERED && (
            <p className="text-[11px] mt-0.5 font-bold uppercase tracking-wider" style={{ color: 'var(--color-warning)' }}>
              {currentTrackingOrder.status === OrderStatus.READY_FOR_PICKUP 
                ? 'Waiting for Driver...' 
                : 'Currently in progress...'}
            </p>
          )}
        </div>
      </div>
    );
  });
})()}
      </div>
    )}
    </>
  );
}
