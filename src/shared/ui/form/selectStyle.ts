import React from 'react';

/**
 * The Select's shape vocabulary, beside the component rather than inside it — the same split
 * `surfaceStyle` uses, and for the same reason: a size ramp is data, and a component file
 * that also exports its data is harder to read and breaks fast refresh.
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

/** Every size clears 36px, and `md` clears the 44px touch floor. */
export const SELECT_SIZE: Record<SelectSize, React.CSSProperties> = {
  sm: { minHeight: 36, fontSize: 12, padding: '0 10px', borderRadius: 'var(--radius-sm)' },
  md: { minHeight: 44, fontSize: 14, padding: '0 12px', borderRadius: 'var(--radius-md)' },
  lg: { minHeight: 50, fontSize: 15, padding: '0 14px', borderRadius: 'var(--radius-md)' },
};
