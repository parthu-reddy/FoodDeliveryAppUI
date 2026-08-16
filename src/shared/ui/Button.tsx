import React from 'react';
import { Spinner } from './Spinner';

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

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-rose-500/90 dark:bg-rose-500/30 backdrop-blur-md text-white hover:bg-rose-600/90 dark:hover:bg-rose-500/50 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  secondary: 'bg-white/60 dark:bg-white/10 backdrop-blur-md text-slate-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/20 border border-white/60 dark:border-white/20 shadow-lg',
  danger: 'bg-red-500/90 dark:bg-red-500/30 backdrop-blur-md text-white hover:bg-red-600/90 dark:hover:bg-red-500/50 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  success: 'bg-emerald-500/90 dark:bg-emerald-500/30 backdrop-blur-md text-white hover:bg-emerald-600/90 dark:hover:bg-emerald-500/50 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  warning: 'bg-amber-500/90 dark:bg-amber-500/30 backdrop-blur-md text-white hover:bg-amber-600/90 dark:hover:bg-amber-500/50 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  ghost: 'bg-transparent text-slate-600 dark:text-white/80 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border-transparent',
  outline: 'bg-white/40 dark:bg-transparent backdrop-blur-sm text-slate-700 dark:text-white hover:bg-white/60 dark:hover:bg-white/10 border border-slate-300 dark:border-white/30 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'text-[10px] px-2 py-1 rounded-lg gap-1',
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-xl gap-2',
  lg: 'text-base px-5 py-2.5 rounded-xl gap-2',
  icon: 'p-2 rounded-full',
};

const spinnerSizes: Record<ButtonSize, 'xs' | 'sm' | 'md'> = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  icon: 'sm',
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
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-bold transition-all border cursor-pointer
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <Spinner size={spinnerSizes[size]} />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span className="flex items-center gap-2">{children}</span>}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
