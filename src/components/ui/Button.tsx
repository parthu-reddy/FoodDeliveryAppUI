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
  primary: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20 border-transparent',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700',
  danger: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-200/60 dark:border-red-500/30',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 border-transparent',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20 border-transparent',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent',
  outline: 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700',
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
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
