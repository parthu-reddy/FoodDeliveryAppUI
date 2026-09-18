import type { StatusTone } from '@shared/ui';
import type { StatusPresentation } from '@features/ledger/model/payoutStatus';

/**
 * Refund-ticket status -> how it is presented. The only such map for this domain.
 *
 * It replaces a `getStatusBadge` switch inside RefundQueue that rendered **OPEN and RESOLVED
 * identically** (`bg-amber-100 text-amber-700` both), so the refund queue gave an admin no
 * colour signal for the one distinction that matters most: what still needs work.
 *
 * The Phase 3 gate asserts OPEN and RESOLVED do not share a tone.
 */

export const REFUND_TICKET_STATUS: Record<string, StatusPresentation> = {
  OPEN: { label: 'Open', tone: 'warning' },
  IN_REVIEW: { label: 'In review', tone: 'info' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

export function refundTicketStatus(status?: string): StatusPresentation {
  if (!status) return { label: 'Unknown', tone: 'neutral' as StatusTone };
  return (
    REFUND_TICKET_STATUS[status] ?? {
      label: status.replace(/_/g, ' '),
      tone: 'neutral' as StatusTone,
    }
  );
}
