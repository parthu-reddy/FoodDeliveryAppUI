import { Check } from 'lucide-react';
import React from 'react';
import type { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { ORDER_STAGES, completedStages } from '../model/orderStatus';

/**
 * The stages an order moves through, shown the same way to everyone who watches it.
 * Drawn as `Tracking.dc.html` draws it: done stages are a solid check, the stage in progress
 * carries a ring, stages still ahead are hollow.
 *
 * The stage arithmetic lives in `model/orderStatus`, not here: an order can be `HANDED_OVER`
 * while its delivery is still `ASSIGNED`, and deciding what that means is a domain question,
 * not a rendering one.
 *
 * No times under the stages. The artboard shows them, but the order API carries only
 * `createdAt` and `updatedAt` -- a per-stage clock would be invented.
 */

interface OrderStatusTimelineProps {
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  className?: string;
}

export function OrderStatusTimeline({ status, deliveryStatus, className = '' }: OrderStatusTimelineProps) {
  const done = completedStages(status, deliveryStatus);
  const last = ORDER_STAGES.length - 1;

  return (
    <ol className={`relative flex items-start justify-between ${className}`} aria-label="Order progress">
      <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-[10px] h-[3px] rounded-full" style={{ background: 'var(--color-paper-line)' }} />
      <span
        aria-hidden="true"
        className="absolute left-[10%] right-[10%] top-[10px] h-[3px] rounded-full origin-left"
        style={{
          background: 'var(--color-success-solid)',
          // A full-width bar scaled from the left -- never an animated width.
          transform: `scaleX(${Math.min(Math.max(done - 1, 0), last) / last})`,
          transitionProperty: 'transform',
          transitionDuration: 'var(--duration-slow)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      />
      {ORDER_STAGES.map((stage, index) => {
        const complete = index < done;
        const current = done > 0 && index === done && done < ORDER_STAGES.length;
        return (
          <li key={stage} className="relative flex-1 min-w-0 flex flex-col items-center gap-1.5" aria-current={current ? 'step' : undefined}>
            <span
              className="w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0"
              style={
                complete
                  ? { background: 'var(--color-success-solid)', color: '#ffffff' }
                  : current
                    ? { background: 'var(--color-success-solid)', boxShadow: '0 0 0 3px var(--color-success-line)' }
                    : { background: 'var(--color-paper)', border: '2.5px solid var(--color-paper-line)' }
              }
            >
              {complete && <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />}
              {current && <span className="w-[7px] h-[7px] rounded-full bg-white" aria-hidden="true" />}
            </span>
            <span
              className={`w-full px-0.5 text-[10px] text-center leading-tight break-words ${current ? 'font-extrabold' : complete ? 'font-bold' : 'font-semibold'}`}
              style={{ color: current ? 'var(--color-success)' : complete ? 'var(--color-ink)' : 'var(--color-ink-3)' }}
            >
              {stage}
            </span>
            <span className="sr-only">{complete ? 'complete' : current ? 'in progress' : 'not yet'}</span>
          </li>
        );
      })}
    </ol>
  );
}
