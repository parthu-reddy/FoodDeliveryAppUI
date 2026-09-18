import type React from 'react';

/**
 * The surface token mapping, shared by the <Surface> component and by elements that must
 * stay what they are.
 *
 * An interactive card is a `<button>`: making it a Surface would either lose the button
 * semantics or require `as="button"`, and a Surface is deliberately not interactive. This
 * lets such an element take the surface without any feature code touching a design token.
 *
 * It lives in its own module because a file that exports both a component and a helper
 * breaks React Fast Refresh.
 */

export type SurfaceElevation = 0 | 1 | 2 | 3 | 4;
export type SurfaceVariant = 'solid' | 'sunken' | 'glass-chrome' | 'glass-overlay';
export type SurfaceRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export const RADIUS: Record<SurfaceRadius, string> = {
  none: '0',
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
};

export function variantStyle(variant: SurfaceVariant): React.CSSProperties {
  switch (variant) {
    case 'sunken':
      return {
        background: 'var(--color-paper-sunken)',
        border: '1px solid var(--color-paper-line)',
      };
    case 'glass-chrome':
      return {
        background: 'var(--glass-chrome-bg)',
        border: '1px solid var(--glass-chrome-line)',
        backdropFilter: 'var(--blur-chrome)',
        WebkitBackdropFilter: 'var(--blur-chrome)',
      };
    case 'glass-overlay':
      return {
        background: 'var(--glass-overlay-bg)',
        border: '1px solid var(--glass-overlay-line)',
        backdropFilter: 'var(--blur-overlay)',
        WebkitBackdropFilter: 'var(--blur-overlay)',
      };
    case 'solid':
    default:
      return {
        background: 'var(--color-paper)',
        border: '1px solid var(--color-paper-line)',
      };
  }
}

export function surfaceStyle({
  elevation = 1,
  variant = 'solid',
  radius = 'lg',
}: {
  elevation?: SurfaceElevation;
  variant?: SurfaceVariant;
  radius?: SurfaceRadius;
} = {}): React.CSSProperties {
  return {
    ...variantStyle(variant),
    borderRadius: RADIUS[radius],
    boxShadow: `var(--elevation-${elevation})`,
  };
}
