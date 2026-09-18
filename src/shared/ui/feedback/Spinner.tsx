import React from 'react';

/**
 * The one spinner. Seventeen files hand-rolled their own `animate-spin` ring.
 *
 * Prefer Skeleton wherever the layout is known in advance -- a spinner tells the user only
 * that something is happening, a skeleton tells them what is coming.
 */

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const PX: Record<SpinnerSize, number> = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 };
const BORDER: Record<SpinnerSize, number> = { xs: 2, sm: 2, md: 3, lg: 3, xl: 4 };

interface SpinnerProps {
  size?: SpinnerSize;
  /** Defaults to the surrounding text colour, so it works on any surface. */
  color?: string;
  className?: string;
  /** Announced to screen readers. Set to '' on a spinner inside an already-labelled control. */
  label?: string;
}

export function Spinner({
  size = 'md',
  color = 'currentColor',
  className = '',
  label = 'Loading',
}: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={`inline-block animate-spin rounded-full align-[-0.125em] ${className}`}
      style={{
        width: PX[size],
        height: PX[size],
        borderWidth: BORDER[size],
        borderStyle: 'solid',
        borderColor: color,
        borderTopColor: 'transparent',
      }}
    />
  );
}
