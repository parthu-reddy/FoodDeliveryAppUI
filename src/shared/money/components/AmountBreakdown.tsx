import React from 'react';
import { Money } from './Money';

export interface BreakdownLine {
  label: string;
  amount: number;
  info?: string;
  isNegative?: boolean;
  highlight?: boolean;
}

interface AmountBreakdownProps {
  lines: BreakdownLine[];
  totalLabel?: string;
  total?: number;
  className?: string;
}

export function AmountBreakdown({ lines, totalLabel = 'Total', total, className = '' }: AmountBreakdownProps) {
  // Compute total if not explicitly provided
  const computedTotal = total ?? lines.reduce((acc, line) => acc + (line.isNegative ? -line.amount : line.amount), 0);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        {lines.map((line, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <span>{line.label}</span>
              {line.info && (
                <span className="text-slate-400 cursor-help" title={line.info}>
                  ⓘ
                </span>
              )}
            </div>
            <div className={`font-medium ${line.highlight ? 'text-slate-900' : ''} ${line.isNegative ? 'text-rose-600' : ''}`}>
              <Money value={line.amount} sign={line.isNegative ? 'always' : 'auto'} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-medium text-slate-900">
        <span>{totalLabel}</span>
        <Money value={computedTotal} />
      </div>
    </div>
  );
}
