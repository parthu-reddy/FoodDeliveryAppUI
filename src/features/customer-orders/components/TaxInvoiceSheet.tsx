import { useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { customerApi } from '@/lib/zodiosClients';
import { Button, Overlay, Surface } from '@shared/ui';
import { formatINR } from '@shared/money';

/**
 * The GST tax invoice for a delivered order (Phase 7 A6), replacing the "Download PDF Invoice"
 * button that downloaded nothing. CustomerApplication issues it on first request -- number,
 * date, supplier snapshot -- and returns the same one after.
 *
 * "Print or save as PDF" is the browser's print dialog; `data-print-root` plus the print rules
 * in index.css make the invoice the only thing on the page, in black on white.
 */

interface Party { legalName?: string; tradeName?: string; gstin?: string; fssaiLicenseNumber?: string; address?: string }
interface Line { description?: string; sac?: string; quantity?: number; unitPrice?: number; amount?: number }
export interface TaxInvoice {
  invoiceNumber?: string;
  issuedAt?: string;
  orderId?: string;
  supplier?: Party | null;
  operator?: Party | null;
  customerName?: string;
  deliveryAddress?: string;
  lines?: Line[];
  taxableValue?: number;
  cgstRatePercent?: number;
  cgstAmount?: number;
  sgstRatePercent?: number;
  sgstAmount?: number;
  deliveryFee?: number;
  platformFee?: number;
  total?: number;
  paymentMethod?: string;
}

type LoadState = { kind: 'loading' } | { kind: 'failed'; message: string } | { kind: 'ready'; invoice: TaxInvoice };

function failureMessage(e: unknown) {
  const status = (e as { response?: { status?: number } }).response?.status;
  if (status === 409) return 'The invoice is issued once the order is delivered.';
  if (status === 503) return 'The invoice could not be prepared right now. Try again in a moment.';
  return 'Could not load the invoice. Try again.';
}

export function TaxInvoiceSheet({ orderId, open, onClose }: { orderId: string; open: boolean; onClose: () => void }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let live = true;
    customerApi.customerMoney.get('/api/v1/money/customer/orders/:orderId/invoice', { params: { orderId } })
      .then((invoice) => { if (live) setState({ kind: 'ready', invoice: invoice as TaxInvoice }); })
      .catch((e: unknown) => { if (live) setState({ kind: 'failed', message: failureMessage(e) }); });
    return () => { live = false; };
  }, [open, orderId, attempt]);

  return (
    <Overlay open={open} onClose={onClose} label="Tax invoice" className="w-full max-w-lg">
      <Surface variant="glass-overlay" elevation={4} radius="xl" className="w-full max-h-[85vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-2 print:hidden">
          <h2 className="flex-1 text-[17px] font-extrabold tracking-tight text-ink">Tax invoice</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-2">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {state.kind === 'loading' && <p className="text-sm text-ink-2">Preparing your invoice&hellip;</p>}
        {state.kind === 'failed' && (
          <div className="space-y-3">
            <p role="alert" className="text-sm font-semibold text-danger">{state.message}</p>
            <Button variant="secondary" onClick={() => { setState({ kind: 'loading' }); setAttempt((n) => n + 1); }}>Try again</Button>
          </div>
        )}
        {state.kind === 'ready' && (
          <>
            <InvoiceDocument invoice={state.invoice} />
            <Button fullWidth className="print:hidden" onClick={() => window.print()}>
              <Printer className="w-4 h-4" aria-hidden="true" /> Print or save as PDF
            </Button>
          </>
        )}
      </Surface>
    </Overlay>
  );
}

function PartyBlock({ title, party }: { title: string; party: Party }) {
  return (
    <div className="space-y-0.5">
      <p className="font-mono text-[10px] font-bold tracking-wider text-ink-2">{title}</p>
      {party.legalName && <p className="text-[13px] font-bold text-ink">{party.legalName}</p>}
      {party.tradeName && party.tradeName !== party.legalName && <p className="text-xs text-ink-2">{party.tradeName}</p>}
      {party.address && <p className="text-xs text-ink-2">{party.address}</p>}
      {party.gstin && <p className="text-xs text-ink">GSTIN <span className="font-mono">{party.gstin}</span></p>}
      {party.fssaiLicenseNumber && <p className="text-xs text-ink">FSSAI <span className="font-mono">{party.fssaiLicenseNumber}</span></p>}
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value?: number; strong?: boolean }) {
  if (value == null) return null;
  return (
    <div className={`flex justify-between gap-3 text-[13px] ${strong ? 'font-extrabold text-ink' : 'text-ink'}`}>
      <span>{label}</span>
      <span className="font-mono">{formatINR(value)}</span>
    </div>
  );
}

export function InvoiceDocument({ invoice }: { invoice: TaxInvoice }) {
  const issued = invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  return (
    <article data-print-root data-testid="tax-invoice" className="space-y-4">
      <header className="flex justify-between gap-3">
        <div>
          <p className="text-base font-extrabold text-ink">Tax invoice</p>
          {invoice.orderId && <p className="font-mono text-[11px] text-ink-2">Order #{invoice.orderId.substring(0, 8).toUpperCase()}</p>}
        </div>
        <div className="text-right">
          <p className="font-mono text-[13px] font-bold text-ink">{invoice.invoiceNumber}</p>
          {issued && <p className="text-xs text-ink-2">{issued}</p>}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {invoice.supplier && <PartyBlock title="SUPPLIER" party={invoice.supplier} />}
        {invoice.operator && <PartyBlock title="E-COMMERCE OPERATOR" party={invoice.operator} />}
        <div className="space-y-0.5">
          <p className="font-mono text-[10px] font-bold tracking-wider text-ink-2">BILLED TO</p>
          {invoice.customerName && <p className="text-[13px] font-bold text-ink">{invoice.customerName}</p>}
          {invoice.deliveryAddress && <p className="text-xs text-ink-2">{invoice.deliveryAddress}</p>}
        </div>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left font-mono text-[10px] tracking-wider text-ink-2">
            <th className="py-1 font-bold">ITEM</th>
            <th className="py-1 font-bold">SAC</th>
            <th className="py-1 font-bold text-right">QTY</th>
            <th className="py-1 font-bold text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.lines ?? []).map((line, idx) => (
            <tr key={idx} className="border-t border-paper-line text-ink">
              <td className="py-1.5">{line.description}</td>
              <td className="py-1.5 font-mono text-xs">{line.sac}</td>
              <td className="py-1.5 font-mono text-right">{line.quantity}</td>
              <td className="py-1.5 font-mono text-right">{line.amount != null ? formatINR(line.amount) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1.5 border-t border-dashed border-paper-line pt-3">
        <Row label="Taxable value" value={invoice.taxableValue} />
        <Row label={`CGST${invoice.cgstRatePercent != null ? ` @ ${invoice.cgstRatePercent}%` : ''}`} value={invoice.cgstAmount} />
        <Row label={`SGST${invoice.sgstRatePercent != null ? ` @ ${invoice.sgstRatePercent}%` : ''}`} value={invoice.sgstAmount} />
        {!!invoice.deliveryFee && <Row label="Delivery fee" value={invoice.deliveryFee} />}
        {!!invoice.platformFee && <Row label="Platform fee" value={invoice.platformFee} />}
        <Row label="Total" value={invoice.total} strong />
        {invoice.paymentMethod && <p className="text-[11px] font-semibold text-ink-2">Paid via {invoice.paymentMethod}</p>}
      </div>
    </article>
  );
}
