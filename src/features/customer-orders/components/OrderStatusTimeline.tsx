import { Check } from 'lucide-react';
import React from 'react';
import type { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { ORDER_STAGES, completedStages } from '../model/orderStatus';

/**
 * The four stages an order moves through, shown the same way to everyone who watches it.
 *
 * The stage arithmetic lives in `model/orderStatus`, not here: an order can be `HANDED_OVER`
 * while its delivery is still `ASSIGNED`, and deciding what that means is a domain question,
 * not a rendering one.
 */

interface OrderStatusTimelineProps {
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  className?: string;
}

export function OrderStatusTimeline({ status, deliveryStatus, className = '' }: OrderStatusTimelineProps) {
  const done = completedStages(status, deliveryStatus);

  return (
    <ol className={`flex items-start ${className}`} aria-label="Order progress">
      {ORDER_STAGES.map((stage, index) => {
        const complete = index < done;
        const current = index === done - 1;
        return (
          <li key={stage} className="flex-1 flex flex-col items-center gap-1.5 relative">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-3 right-1/2 left-[-50%] h-0.5"
                style={{
                  background: complete ? 'var(--color-success)' : 'var(--color-paper-line)',
                }}
              />
            )}
            <span
              className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: complete ? 'var(--color-success)' : 'var(--color-paper-sunken)',
                border: `2px solid ${complete ? 'var(--color-success)' : 'var(--color-paper-line)'}`,
                color: complete ? '#ffffff' : 'var(--color-ink-3)',
              }}
            >
              {complete && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            </span>
            <span
              className={`text-[11px] text-center ${current ? 'font-bold' : 'font-medium'}`}
              style={{ color: complete ? 'var(--color-ink)' : 'var(--color-ink-2)' }}
            >
              {stage}
            </span>
            <span className="sr-only">{complete ? 'complete' : 'not yet'}</span>
          </li>
        );
      })}
    </ol>
  );
}
