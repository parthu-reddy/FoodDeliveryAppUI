import React from 'react';
import { formatINR } from '../format';

export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  sign?: 'auto' | 'always' | 'never';
  compact?: boolean;
}

export function Money({ value, sign = 'auto', compact = false, className, ...props }: MoneyProps) {
  const formatted = formatINR(value, { sign, compact });
  
  return (
    <span className={className} aria-label={`Money amount: ${formatted}`} {...props}>
      {formatted}
    </span>
  );
}
