import React from 'react';
import type { Order } from '@/types';
import { AmountBreakdown, type BreakdownLine } from '@shared/money';

/**
 * The bill for one order.
 *
 * It **composes** `shared/money` rather than formatting anything itself. Money is the
 * healthiest part of this codebase — 38 files import it and `toFixed(2)` on a money value
 * appears zero times — and the Phase 3 gate exists partly to stop this phase "improving" it
 * into a second abstraction.
 *
 * The two GST components are shown as one line. They are charged separately and the customer
 * is owed the total, not a lesson in tax structure; the split stays available in the ledger.
 */

interface OrderMoneyBreakdownProps {
  order: Pick<Order, 'itemTotal' | 'customerPlatformFee' | 'sgst' | 'cgst' | 'deliveryFee' | 'totalAmount'>;
  className?: string;
}

export function OrderMoneyBreakdown({ order, className = '' }: OrderMoneyBreakdownProps) {
  const tax = (order.sgst ?? 0) + (order.cgst ?? 0);

  const lines: BreakdownLine[] = [
    { label: 'Items', amount: order.itemTotal ?? 0 },
    { label: 'Delivery', amount: order.deliveryFee ?? 0 },
    { label: 'Platform fee', amount: order.customerPlatformFee ?? 0 },
  ];
  if (tax > 0) {
    lines.push({ label: 'GST', amount: tax, info: 'SGST and CGST, charged separately' });
  }

  return (
    <AmountBreakdown
      lines={lines}
      total={order.totalAmount}
      totalLabel="Total paid"
      className={className}
    />
  );
}
