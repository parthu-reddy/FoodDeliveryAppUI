import React from 'react';

type BadgeVariant = 'primary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Shows a pulsing dot indicator to the left */
  dot?: boolean;
  /** Adds animate-pulse to the entire badge */
  pulse?: boolean;
  /** Adds animate-ping to the dot */
  ping?: boolean;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/30',
  danger: 'bg-red-500/10 text-red-500 border-red-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-rose-500',
  danger: 'bg-red-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[9px] px-1.5 py-0.5',
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  ping = false,
  className = '',
  icon,
  children,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-black font-mono uppercase tracking-wider
        rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 mr-1">
          {ping && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`}></span>
        </span>
      )}
      {icon && <span className="mr-0.5">{icon}</span>}
      {children}
    </span>
  );
}
