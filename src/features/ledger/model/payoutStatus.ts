import type { StatusTone } from '@shared/ui';

/**
 * Payout status -> how it is presented. The only such map for this domain.
 *
 * It replaces a `getStatusBadge` switch inside PayoutHistory that rendered **PAID and
 * CANCELLED identically** (`bg-amber-100 text-amber-700` both), so an admin could not tell a
 * completed payout from a cancelled one by colour. That was not a typo: before the Phase 1
 * codemod they were `green-100` and `amber-100`, and the alias block resolved green onto
 * amber, so the two had always looked the same on screen.
 *
 * The Phase 3 gate asserts PAID and CANCELLED do not share a tone.
 */

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

export const PAYOUT_STATUS: Record<string, StatusPresentation> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  APPROVED: { label: 'Approved', tone: 'info' },
  PAID: { label: 'Paid', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'warning' },
};

export function payoutStatus(status?: string): StatusPresentation {
  if (!status) return { label: 'Unknown', tone: 'neutral' };
  return PAYOUT_STATUS[status] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' };
}
