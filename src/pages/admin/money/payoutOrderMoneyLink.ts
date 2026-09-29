/**
 * Build an admin order-money route only for an order-backed payable statement line.
 *
 * `PayoutDrawer` receives a statement for a RESTAURANT_PAYABLE or DRIVER_PAYABLE account.
 * Order bookkeeping records those lines with the order UUID as `referenceId`; payout state
 * transitions instead use the payout UUID with the `PAYOUT_TRANSFER` category.  The statement
 * DTO has no reference-type field, so this explicit category contract keeps transfer and future
 * unknown references from being presented as order links.
 */
const ORDER_PAYABLE_CATEGORIES = new Set([
  'FOOD_COST',
  'PLATFORM_FIXED_FEE',
  'DELIVERY_FEE',
  'PLATFORM_BONUS',
  'SGST',
  'CGST',
  'CLAWBACK',
]);

export function payoutStatementOrderMoneyLink(line: {
  referenceId?: string | null;
  category?: string | null;
}): string | undefined {
  if (!line.referenceId || !line.category || !ORDER_PAYABLE_CATEGORIES.has(line.category)) {
    return undefined;
  }

  return `/admin/orders/${line.referenceId}/money`;
}
