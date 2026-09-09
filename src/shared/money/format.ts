/**
 * Money formatting for the UI.
 *
 * <p><b>Unit: rupees.</b> Every money field the API returns is a JSON number in rupees with two
 * decimal places, because the backing columns are {@code DECIMAL(10,2)} / {@code NUMERIC(14,2)} and
 * the services compute in {@code BigDecimal} rupees. Pass those values straight in.
 *
 * <p>This module used to take integer paise and divide by 100 on the way out, while nothing ever
 * converted an API response into paise -- so a 450.00 order total rendered as ₹4.50 and every money
 * figure in the app was shown at a hundredth of its value.
 */

/**
 * Rounds a rupee amount to whole paise, killing float artefacts like 0.30000000000000004.
 *
 * <p>Half rounds away from zero, matching {@code RoundingMode.HALF_UP} on the backend.
 * {@code Math.round} rounds half towards +Infinity, so it would turn -0.005 into -0.00 while the
 * services turn it into -0.01 -- a paise of disagreement on every negative amount.
 */
export function roundRupees(n: number | string | null | undefined): number {
  if (n == null) return 0;
  if (typeof n === 'string') {
    n = parseFloat(n);
  }
  if (isNaN(n)) return 0;
  const paise = n * 100;
  return (paise < 0 ? -Math.round(-paise) : Math.round(paise)) / 100;
}

export function formatINR(rupees: number | null | undefined, opts?: { sign?: 'auto' | 'always' | 'never', compact?: boolean }): string {
  const safeRupees = roundRupees(rupees);
  const isNegative = safeRupees < 0;

  const intlOpts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'symbol',
  };

  if (opts?.compact) {
    intlOpts.notation = 'compact';
    intlOpts.compactDisplay = 'short';
  }

  let formatted = new Intl.NumberFormat('en-IN', intlOpts).format(safeRupees);

  if (opts?.sign === 'never' && isNegative) {
    formatted = formatted.replace('-', '');
  } else if (opts?.sign === 'always' && !isNegative && safeRupees !== 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
}

/** Sums rupee amounts, rounding to whole paise so repeated addition cannot drift. */
export function sumRupees(...values: (number | undefined | null)[]): number {
  return roundRupees(values.reduce((sum: number, val) => sum + (val || 0), 0));
}

/** A share of an amount, rounded to whole paise. */
export function pctOf(rupees: number, ratio: number): number {
  return roundRupees(rupees * ratio);
}
