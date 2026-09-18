import React from 'react';
import { Spinner } from '../feedback/Spinner';

/**
 * The one button. Press depth and motion are built in, not applied at the call site.
 *
 * The prop API matches the component this replaces so existing call sites keep working;
 * what changed is underneath. Previously `success` and `warning` both rendered amber, and
 * `success` carried a hard-coded emerald glow over an amber fill.
 *
 * primary vs danger: both sit in the brand's rose family, because the brand IS red. They are
 * separated by weight rather than hue -- primary carries the gradient and the tinted press
 * glow, danger is a flat darker fill with neither. That also gets the hierarchy right: a
 * destructive action should never be the most eye-catching thing on screen.
 */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

function variantStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background:
          'linear-gradient(180deg, var(--color-action-from), var(--color-action-to))',
        color: '#ffffff',
        border: '1px solid transparent',
        boxShadow: 'var(--elevation-press)',
      };
    case 'danger':
      return {
        background: 'var(--color-danger)',
        color: '#ffffff',
        border: '1px solid transparent',
        boxShadow: 'var(--elevation-1)',
      };
    case 'success':
      return {
        background: 'var(--color-success)',
        color: '#ffffff',
        border: '1px solid transparent',
        boxShadow: 'var(--elevation-1)',
      };
    case 'warning':
      // amber cannot carry white text at 4.5:1, so warning is a tinted surface with dark ink
      return {
        background: 'var(--color-warning-bg)',
        color: 'var(--color-warning)',
        border: '1px solid var(--color-warning-line)',
        boxShadow: 'var(--elevation-1)',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--color-ink-2)',
        border: '1px solid transparent',
        boxShadow: 'none',
      };
    case 'outline':
      return {
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-paper-line)',
        boxShadow: 'var(--elevation-1)',
      };
    case 'secondary':
    default:
      return {
        background: 'var(--color-paper-sunken)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-paper-line)',
        boxShadow: 'var(--elevation-1)',
      };
  }
}

/** md and lg clear the 44px touch-target floor. xs/sm exist for dense admin tables only. */
const SIZE: Record<ButtonSize, React.CSSProperties> = {
  xs: { fontSize: 10, padding: '4px 8px', borderRadius: 'var(--radius-xs)', gap: 4 },
  sm: { fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-sm)', gap: 6 },
  md: { fontSize: 14, minHeight: 44, padding: '0 16px', borderRadius: 'var(--radius-md)', gap: 8 },
  lg: { fontSize: 15, minHeight: 50, padding: '0 20px', borderRadius: 'var(--radius-md)', gap: 8 },
  icon: { minHeight: 44, minWidth: 44, padding: 0, borderRadius: 'var(--radius-full)', gap: 0 },
};

const SPINNER: Record<ButtonSize, 'xs' | 'sm' | 'md'> = {
  xs: 'xs', sm: 'xs', md: 'sm', lg: 'md', icon: 'sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  className = '',
  style,
  children,
  ...rest
}: ButtonProps) {
  const inert = disabled || loading;

  return (
    <button
      type={rest.type ?? 'button'}
      disabled={inert}
      aria-busy={loading || undefined}
      data-variant={variant}
      className={`lb-button inline-flex items-center justify-center font-bold select-none ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      style={{
        ...variantStyle(variant),
        ...SIZE[size],
        width: fullWidth ? '100%' : undefined,
        cursor: inert ? 'not-allowed' : 'pointer',
        opacity: inert ? 0.6 : 1,
        transitionProperty: 'transform, box-shadow, background-color, opacity',
        transitionDuration: 'var(--duration-instant)',
        transitionTimingFunction: 'var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <Spinner size={SPINNER[size]} />
      ) : (
        <>
          {icon}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}
