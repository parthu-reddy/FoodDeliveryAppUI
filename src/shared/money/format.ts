export function toPaise(n: number | string | null | undefined): number {
  if (n == null) return 0;
  if (typeof n === 'string') {
    n = parseFloat(n);
  }
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function formatINR(paise: number | null | undefined, opts?: { sign?: 'auto' | 'always' | 'never', compact?: boolean }): string {
  const safePaise = paise || 0;
  const isNegative = safePaise < 0;
  const rupees = safePaise / 100;

  const intlOpts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'symbol',
  };

  if (opts?.compact) {
    intlOpts.notation = 'compact';
    intlOpts.compactDisplay = 'short';
  }

  let formatted = new Intl.NumberFormat('en-IN', intlOpts).format(rupees);
  
  if (opts?.sign === 'never' && isNegative) {
    formatted = formatted.replace('-', '');
  } else if (opts?.sign === 'always' && !isNegative && paise !== 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
}

export function sumPaise(...values: (number | undefined | null)[]): number {
  return values.reduce((sum: number, val) => sum + (val || 0), 0);
}

export function pctOf(paise: number, ratio: number): number {
  return Math.round(paise * ratio);
}
