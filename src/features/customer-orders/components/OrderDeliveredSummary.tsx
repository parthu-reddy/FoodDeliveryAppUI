import { ArrowLeft, Check, FileText } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import { motion } from 'motion/react';
import type { Order } from '@/types';
import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';
import { Button, Surface, surfaceStyle, useMotionPresets } from '@shared/ui';
import { formatINR } from '@shared/money';
import type { ChatWidgetHandle } from '@features/communication/components/ChatWidget';
import { OrderMoneyBreakdown } from './OrderMoneyBreakdown';
import { TaxInvoiceSheet } from './TaxInvoiceSheet';

/**
 * The screen after the door: what arrived, what it cost, and a way to say something was wrong.
 *
 * Moved out of `CustomerMainView` (2026-09-24), and three things did not survive the move:
 *  - a "Download PDF Invoice" button that downloaded nothing and announced success through
 *    the ERROR toast. Replaced by "Tax invoice" (TaxInvoiceSheet), a real numbered GST invoice
 *    from CustomerApplication -- Phase 7 A6;
 *  - "Payment Method: Wallet / Card | Credit Card", guessed from whether `paymentIntent` was
 *    set, when the order carries `paymentMethod`;
 *  - a hand-written SGST/CGST list; the bill is `OrderMoneyBreakdown`, as everywhere else.
 */

interface OrderDeliveredSummaryProps {
  order: Order;
  onBack: () => void;
  chatWidgetRef: React.RefObject<ChatWidgetHandle | null>;
}

export function OrderDeliveredSummary({ order, onBack, chatWidgetRef }: OrderDeliveredSummaryProps) {
  const presets = useMotionPresets();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const delivered = order.deliveryStatus === DeliveryStatus.DELIVERED;
  return (
    <motion.div key="summary" {...presets.rise} className="p-4 sm:p-5 space-y-4" data-testid="order-tracker" data-order-id={order.id} data-status={order.status}>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-ink"
          style={surfaceStyle({ radius: 'md', elevation: 1 })}
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <h1 className="flex-1 text-[17px] font-extrabold tracking-tight text-ink">Order delivered</h1>
      </div>

      <div
        className="rounded-2xl p-6 text-center space-y-2"
        style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-line)' }}
      >
        <span className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-solid)' }}>
          <Check className="w-7 h-7 text-white" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-extrabold text-ink">Enjoy your meal</h2>
        <p className="text-sm text-ink-2">Delivered from {order.restaurantName ?? 'the restaurant'}.</p>
      </div>

      <Surface radius="xl" elevation={1} className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-ink">Receipt</span>
          <span className="font-mono text-[11px] text-ink-2">#{order.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <ul className="space-y-2">
          {(order.items ?? []).map((raw, idx) => {
            const i = raw as { item?: { id?: string; name?: string; price?: number }; name?: string; price?: number; quantity?: number };
            const qty = i.quantity || 1;
            return (
              <li key={i.item?.id || idx} className="flex justify-between gap-3 text-[13px]">
                <span className="font-semibold text-ink">{qty}× {i.item?.name || i.name || 'Item'}</span>
                <span className="font-mono text-ink">{formatINR((i.item?.price || i.price || 0) * qty)}</span>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-dashed border-paper-line pt-3">
          <OrderMoneyBreakdown order={order} />
        </div>
        {order.paymentMethod && <p className="text-[11px] font-semibold text-ink-2">Paid via {order.paymentMethod}</p>}

        {delivered && (
          <Button variant="secondary" fullWidth onClick={() => setInvoiceOpen(true)}>
            <FileText className="w-4 h-4" aria-hidden="true" /> Tax invoice
          </Button>
        )}

        {order.status !== OrderStatus.CANCELLED && (
          <Button variant="outline" fullWidth onClick={() => chatWidgetRef.current?.openAndRequestRefundQuote()}>
            Something wrong with this order?
          </Button>
        )}
      </Surface>
      {delivered && <TaxInvoiceSheet orderId={order.id} open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />}
    </motion.div>
  );
}
