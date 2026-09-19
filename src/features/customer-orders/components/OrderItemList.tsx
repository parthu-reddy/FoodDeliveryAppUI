import React from 'react';
import type { Order } from '@/types';
import { formatINR } from '@shared/money';

/**
 * What was ordered. One list, for the customer, the restaurant and the admin alike — the
 * quantities and the line totals do not change with who is looking at them.
 */

type OrderLine = Order['items'][number];

interface OrderItemListProps {
  items: OrderLine[];
  /** Hides the per-line money, for surfaces that show only what to cook. */
  showPrices?: boolean;
  className?: string;
}

export function OrderItemList({ items, showPrices = true, className = '' }: OrderItemListProps) {
  if (items.length === 0) {
    return (
      <p className={`text-xs ${className}`} style={{ color: 'var(--color-ink-2)' }}>
        No items on this order.
      </p>
    );
  }

  return (
    <ul className={`space-y-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-3">
          <span className="flex items-baseline gap-2 min-w-0">
            <span
              className="font-mono text-[12px] font-bold shrink-0 tabular-nums"
              style={{ color: 'var(--color-ink-2)' }}
            >
              {item.quantity}&times;
            </span>
            <span className="text-[13px] truncate" style={{ color: 'var(--color-ink)' }}>
              {item.name}
            </span>
          </span>
          {showPrices && (
            <span
              className="font-mono text-[13px] shrink-0 tabular-nums"
              style={{ color: 'var(--color-ink)' }}
            >
              {formatINR(item.price * item.quantity)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
