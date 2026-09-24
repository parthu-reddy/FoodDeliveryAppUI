import { Clock } from 'lucide-react';
import React from 'react';
import type { Order } from '@/types';
import { formatINR } from '@shared/money';
import { Button, StatusPill, Surface } from '@shared/ui';
import { orderStatusView } from '../model/orderStatus';
import { OrderItemList } from './OrderItemList';

/**
 * One order, rendered the same way for every role.
 *
 * Roles differ by CAPABILITY, not by a second implementation. The customer sees status and an
 * ETA; the restaurant gets accept and reject; the rider gets pickup and delivery and the
 * payout it is worth; the admin gets the ledger link. The order itself — who it is from, what
 * is on it, what it came to — is identical in all four, which is the point: it was not, and
 * four surfaces had each written their own card.
 *
 * There is deliberately no `role` prop.
 */

export interface OrderCapabilities {
  accept?: boolean;
  reject?: boolean;
  track?: boolean;
  viewLedger?: boolean;
}

interface OrderCardProps {
  order: Order;
  can?: OrderCapabilities;
  /** Who the card names — the restaurant for a customer, the customer for a rider. */
  counterparty?: string;
  /** What this order pays the viewer. Shown before acceptance, never after the fact. */
  payout?: number;
  /** A countdown, a swipe control, a timeline — whatever this surface pins under the card. */
  footer?: React.ReactNode;
  onAccept?: (order: Order) => void;
  onReject?: (order: Order) => void;
  onTrack?: (order: Order) => void;
  onViewLedger?: (order: Order) => void;
  className?: string;
}

export function OrderCard({
  order,
  can = {},
  counterparty,
  payout,
  footer,
  onAccept,
  onReject,
  onTrack,
  onViewLedger,
  className = '',
}: OrderCardProps) {
  const status = orderStatusView(order.status, order.deliveryStatus);

  return (
    <Surface radius="xl" elevation={1} className={`p-4 space-y-3 ${className}`} data-order={order.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[15px] font-bold truncate" style={{ color: 'var(--color-ink)' }}>
            {counterparty ?? order.restaurantName}
          </h4>
          <p className="font-mono text-[11px]" style={{ color: 'var(--color-ink-2)' }}>
            #{String(order.id).slice(0, 8)}
          </p>
        </div>
        <StatusPill label={status.label} tone={status.tone} live={status.live} />
      </div>

      <OrderItemList items={order.items ?? []} />

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
          {formatINR(order.totalAmount ?? 0)}
        </span>
        {payout !== undefined && (
          // Shown before acceptance, which is the only moment it can affect a decision.
          <span className="text-[12px] font-bold" style={{ color: 'var(--color-success)' }}>
            You earn {formatINR(payout)}
          </span>
        )}
        {order.estimatedCompletionTime && (
          <span
            className="flex items-center gap-1 text-[11px] font-medium"
            style={{ color: 'var(--color-ink-2)' }}
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            {/* The kitchen's ready time, not an arrival time -- see OrderTrackerLive. */}
            Ready {new Date(order.estimatedCompletionTime).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {(can.accept || can.reject || can.track || can.viewLedger) && (
        <div className="flex items-center gap-2">
          {can.reject && (
            <Button variant="outline" size="md" className="flex-1" onClick={() => onReject?.(order)}>
              Reject
            </Button>
          )}
          {can.accept && (
            <Button variant="primary" size="md" className="flex-1" onClick={() => onAccept?.(order)}>
              Accept
            </Button>
          )}
          {can.track && (
            <Button variant="outline" size="md" className="flex-1" onClick={() => onTrack?.(order)}>
              Track
            </Button>
          )}
          {can.viewLedger && (
            <Button variant="ghost" size="md" onClick={() => onViewLedger?.(order)}>
              Ledger
            </Button>
          )}
        </div>
      )}

      {footer}
    </Surface>
  );
}
