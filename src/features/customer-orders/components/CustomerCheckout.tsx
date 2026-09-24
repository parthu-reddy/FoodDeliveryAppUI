import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronRight, CreditCard, MapPin, Smartphone, Wallet } from 'lucide-react';
import { Button, ErrorBoundary, Modal, Spinner, Surface, surfaceStyle, useMotionPresets } from '@shared/ui';
import { AmountBreakdown, formatINR, type BreakdownLine } from '@shared/money';
import { VegMarker } from '@features/catalog/components/VegMarker';
import { customerApi } from '@/lib/zodiosClients';
import type { CartItem, PaymentMethodChoice } from '@/types';

/**
 * Checkout — the whole bill, before you pay. Built against `Checkout.dc.html`.
 *
 * What the artboard commits to, and how each is honoured here:
 *  - **The bill is open, not behind a toggle.** Every line the server quoted is on screen, and
 *    the total is the number that will be charged.
 *  - **No number is invented.** Until the quote has returned, taxes are unknown: the bill says
 *    so and Place order stays disabled, rather than showing an estimate as if it were final.
 *  - **The address is words, not an id.** This sheet replaced `CustomerPaymentModal`, which was
 *    handed `deliveryAddressId` as its `address` prop and printed the row's UUID under
 *    "Delivering to".
 *
 * Not built: the artboard's rider tip. The order API has no tip field, so a tip shown here
 * would be a total the server does not charge. Recorded as A3 in Phase 7's backlog.
 */

export interface CheckoutTotals {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  platformFee?: number;
  isEstimated?: boolean;
}

interface CustomerCheckoutProps {
  open: boolean;
  onClose: () => void;
  status: 'idle' | 'processing' | 'success';
  totals: CheckoutTotals;
  items: CartItem[];
  restaurantName: string;
  address: string;
  onChangeAddress: () => void;
  onPlaceOrder: (method: PaymentMethodChoice) => void;
  error?: string | null;
}

type Method = Extract<PaymentMethodChoice, 'WALLET' | 'UPI' | 'CARD'>;

const METHODS: { id: Method; label: string; Icon: typeof Wallet; paying: string }[] = [
  { id: 'WALLET', label: 'La Bouffe Wallet', Icon: Wallet, paying: 'PAYING FROM WALLET' },
  { id: 'UPI', label: 'UPI', Icon: Smartphone, paying: 'PAYING BY UPI' },
  { id: 'CARD', label: 'Credit or debit card', Icon: CreditCard, paying: 'PAYING BY CARD' },
];

export default function CustomerCheckout(props: CustomerCheckoutProps) {
  return (
    <ErrorBoundary>
      <CustomerCheckoutInner {...props} />
    </ErrorBoundary>
  );
}

function useWalletBalance(open: boolean) {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    // The signed-in customer's own wallet: the endpoint derives the id from the principal.
    customerApi.customerMoney
      .get('/api/v1/money/customer/wallet')
      .then((res) => { if (live) setBalance(res.balance ?? 0); })
      .catch((err: unknown) => { console.error('Failed to fetch wallet balance', err); });
    return () => { live = false; };
  }, [open]);
  return balance;
}

function CustomerCheckoutInner({
  open,
  onClose,
  status,
  totals,
  items,
  restaurantName,
  address,
  onChangeAddress,
  onPlaceOrder,
  error,
}: CustomerCheckoutProps) {
  const presets = useMotionPresets();
  const balance = useWalletBalance(open);
  const walletShort = balance !== null && balance < totals.total;
  const [picked, setPicked] = useState<Method | null>(null);
  // Wallet is the default only while it can cover the bill; a later balance that cannot
  // un-selects it rather than leaving a method the server will reject.
  const method: Method | null = picked === 'WALLET' && walletShort ? null : picked ?? (walletShort ? null : 'WALLET');
  const hasAddress = !!address && !address.includes('Please add an address');
  const canPlace = status === 'idle' && !!method && !totals.isEstimated && hasAddress && items.length > 0;

  const lines: BreakdownLine[] = [
    { label: 'Item total', amount: totals.subtotal },
    { label: 'Delivery fee', amount: totals.deliveryFee, freeWhenZero: true },
  ];
  if (totals.platformFee) lines.push({ label: 'Platform fee', amount: totals.platformFee });
  if (!totals.isEstimated) {
    lines.push({ label: 'GST & restaurant charges', amount: totals.tax, info: 'SGST and CGST, charged separately' });
  }

  return (
    <Modal
      open={open}
      onClose={() => status === 'idle' && onClose()}
      title="Checkout"
      size="lg"
      sheet
      dismissOnBackdrop={status === 'idle'}
      footer={status === 'idle' ? (
        <PlaceOrderBar
          method={method}
          total={totals.total}
          estimated={!!totals.isEstimated}
          disabled={!canPlace}
          onPlace={() => method && canPlace && onPlaceOrder(method)}
        />
      ) : undefined}
    >
      {/* No mode="wait": the tab-panel wedge fixed in 3b5de61 was a wait on an exit that never
          reported. Here the next state must appear even if the previous one's exit stalls. */}
      <AnimatePresence initial={false}>
        {status === 'idle' && (
          <motion.div key="bill" {...presets.fade} className="p-4 space-y-3.5">
            <button
              type="button"
              onClick={onChangeAddress}
              className="w-full flex items-center gap-3 p-3.5 text-left"
              style={surfaceStyle({ radius: 'lg', elevation: 1 })}
            >
              <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={surfaceStyle({ variant: 'sunken', radius: 'md', elevation: 0 })}>
                <MapPin className="w-5 h-5 text-action-ink" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-mono text-[10px] font-bold tracking-wider text-ink-2">DELIVER TO</span>
                <span className="block text-[13px] font-bold text-ink line-clamp-2">
                  {hasAddress ? address : 'Choose a delivery address'}
                </span>
              </span>
              <span className="shrink-0 px-3 py-1.5 text-xs font-bold text-ink" style={surfaceStyle({ variant: 'sunken', radius: 'sm', elevation: 0 })}>
                Change
              </span>
            </button>

            <Surface radius="lg" elevation={2} className="overflow-hidden">
              <div className="px-4 pt-4 text-sm font-extrabold tracking-tight text-ink">{restaurantName}</div>
              <ul className="px-4 py-3.5 space-y-2.5">
                {items.map((c) => (
                  <li key={c.item.id} className="flex items-center gap-2.5">
                    <VegMarker item={c.item} />
                    <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-ink">{c.item.name}</span>
                    <span className="font-mono text-[11px] text-ink-2">×{c.quantity}</span>
                    <span className="font-mono text-[13px] font-bold text-ink w-20 text-right">
                      {formatINR((c.item.price || 0) * c.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mx-4 border-t-[1.5px] border-dashed border-paper-line" aria-hidden="true" />
              <div className="p-4">
                <AmountBreakdown
                  lines={lines}
                  total={totals.total}
                  totalLabel={totals.isEstimated ? 'Total before taxes' : 'Total'}
                  footnote={totals.isEstimated ? undefined : 'No surcharge at the door. This is what you pay.'}
                />
                {totals.isEstimated && (
                  <p className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-ink-2">
                    <Spinner size="sm" label="" /> Getting the final bill from the restaurant…
                  </p>
                )}
              </div>
            </Surface>

            <Surface radius="lg" elevation={1} className="p-2" role="radiogroup" aria-label="Payment method">
              {METHODS.map(({ id, label, Icon }) => {
                const disabled = id === 'WALLET' && walletShort;
                const selected = method === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => setPicked(id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={selected ? { background: 'var(--color-danger-bg)' } : undefined}
                  >
                    <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={surfaceStyle({ variant: 'sunken', radius: 'md', elevation: 0 })}>
                      <Icon className="w-[18px] h-[18px] text-ink" aria-hidden="true" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold text-ink">{label}</span>
                      {id === 'WALLET' && balance !== null && (
                        <span className="block text-[11px] font-medium text-ink-2">
                          Balance{' '}
                          <span className={`font-mono font-bold ${walletShort ? 'text-danger' : 'text-success'}`}>{formatINR(balance)}</span>
                          {walletShort && ' · not enough for this order'}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                      style={{ border: `2px solid ${selected ? 'var(--color-action)' : 'var(--color-paper-line)'}` }}
                    >
                      {selected && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-action)' }} />}
                    </span>
                  </button>
                );
              })}
            </Surface>

            {error && (
              <p role="alert" className="p-3 rounded-xl text-sm font-semibold text-danger" style={{ background: 'var(--color-danger-bg)' }}>
                {error}
              </p>
            )}
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div key="processing" {...presets.fade} className="px-6 py-14 flex flex-col items-center text-center gap-4">
            <Spinner size="lg" color="var(--color-action)" label="" />
            <div>
              <h3 className="text-xl font-extrabold text-ink">Sending your order</h3>
              <p className="mt-1 text-sm text-ink-2">Connecting to {restaurantName}…</p>
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success" {...presets.scaleIn} className="px-6 py-14 flex flex-col items-center text-center gap-4">
            <span className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-solid)' }}>
              <Check className="w-8 h-8 text-white" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-2xl font-extrabold text-ink">Order placed</h3>
              <p className="mt-1 text-sm text-ink-2">{restaurantName} has your order. We&rsquo;ll show it live on your home screen.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function PlaceOrderBar({ method, total, estimated, disabled, onPlace }: {
  method: Method | null;
  total: number;
  estimated: boolean;
  disabled: boolean;
  onPlace: () => void;
}) {
  const paying = METHODS.find((m) => m.id === method)?.paying ?? 'CHOOSE HOW TO PAY';
  return (
    <Button onClick={onPlace} disabled={disabled} fullWidth size="lg" className="h-14 !justify-between">
      <span className="flex flex-col items-start leading-tight">
        <span className="font-mono text-[9px] font-medium tracking-wider opacity-80">{estimated ? 'CALCULATING TAXES' : paying}</span>
        <span className="font-mono text-lg font-bold">{formatINR(total)}</span>
      </span>
      <span className="flex items-center gap-1.5 text-[15px] font-extrabold">
        Place order <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </span>
    </Button>
  );
}

export type { CustomerCheckoutProps };
