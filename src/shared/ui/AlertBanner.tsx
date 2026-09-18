import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import React from 'react';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface AlertBannerProps {
  variant?: AlertVariant;
  /** Custom icon to override the default */
  icon?: React.ReactNode;
  /** If true, shows a close button */
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  success: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  error: <XCircle className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  success: <CheckCircle className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
};

export function AlertBanner({
  variant = 'info',
  icon,
  dismissible = false,
  onDismiss,
  className = '',
  children,
}: AlertBannerProps) {
  return (
    <div
      className={`
        p-3 rounded-xl border text-xs font-medium
        flex items-center gap-2
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon || defaultIcons[variant]}
      <span className="flex-1">{children}</span>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
