import React from 'react';
import { RADIUS, variantStyle } from './surfaceStyle';
import type { SurfaceElevation, SurfaceRadius, SurfaceVariant } from './surfaceStyle';

/**
 * The only component permitted to render a design surface.
 *
 * Everything that needs depth composes a Surface, or takes `surfaceStyle()` when it must
 * remain another element (an interactive card is a <button>). This is what makes "no
 * duplication" a property the Phase 2 gate can check rather than a convention people
 * remember: a design token referenced anywhere in features/ or pages/ fails the gate.
 *
 * Glass is a LAYER ROLE, not a texture. `glass-chrome` and `glass-overlay` belong only on
 * surfaces that float over scrolling content -- headers, tab bars, action bars, dialogs.
 * Content surfaces are `solid`. Phase 4 enforces that distinction.
 */

type SurfaceTag =
  | 'div' | 'section' | 'article' | 'aside'
  | 'header' | 'footer' | 'nav' | 'li' | 'form';

interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: SurfaceTag;
  elevation?: SurfaceElevation;
  variant?: SurfaceVariant;
  radius?: SurfaceRadius;
  /** Adds press/hover motion. Use on a Surface that wraps an interactive child, never
   *  to make the Surface itself clickable -- that is what Button and <a> are for. */
  interactive?: boolean;
  children?: React.ReactNode;
}

export function Surface({
  as = 'div',
  elevation = 1,
  variant = 'solid',
  radius = 'lg',
  interactive = false,
  style,
  className = '',
  children,
  ...rest
}: SurfaceProps) {
  const Tag = as as React.ElementType;

  const composed: React.CSSProperties = {
    ...variantStyle(variant),
    borderRadius: RADIUS[radius],
    boxShadow: `var(--elevation-${elevation})`,
    ...(interactive
      ? {
          transitionProperty: 'transform, box-shadow',
          transitionDuration: 'var(--duration-instant)',
          transitionTimingFunction: 'var(--ease-out)',
        }
      : null),
    ...style,
  };

  return (
    <Tag
      data-surface={variant}
      data-elevation={elevation}
      className={className}
      style={composed}
      {...rest}
    >
      {children}
    </Tag>
  );
}
