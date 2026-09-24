import React from 'react';
import { Money } from './Money';

export interface BreakdownLine {
  label: string;
  amount: number;
  info?: string;
  isNegative?: boolean;
  highlight?: boolean;
  /**
   * Renders a zero amount as FREE in the success colour instead of ₹0.00. For a delivery fee
   * the waiver is news; a bare zero reads like a missing value.
   */
  freeWhenZero?: boolean;
}

interface AmountBreakdownProps {
  lines: BreakdownLine[];
  totalLabel?: string;
  total?: number;
  /** Shown under the total, e.g. "No surcharge at the door. This is what you pay." */
  footnote?: React.ReactNode;
  className?: string;
}

/**
 * Colours come from the ink tokens, never from a slate step: `.dark` redefines `--color-ink`,
 * so the same bill reads on the paper ground in both schemes. The previous slate-600/900 pair
 * had no dark variant and rendered every bill near-black on `#12161c`.
 */
export function AmountBreakdown({ lines, totalLabel = 'Total', total, footnote, className = '' }: AmountBreakdownProps) {
  // Compute total if not explicitly provided
  const computedTotal = total ?? lines.reduce((acc, line) => acc + (line.isNegative ? -line.amount : line.amount), 0);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2.5">
        {lines.map((line, idx) => (
          <div key={idx} className="flex justify-between items-center text-[13px] font-medium text-ink-2">
            <div className="flex items-center gap-1.5">
              <span>{line.label}</span>
              {line.info && (
                <span className="text-ink-3 cursor-help" title={line.info}>
                  ⓘ
                </span>
              )}
            </div>
            {line.freeWhenZero && line.amount === 0 ? (
              <span className="font-mono font-bold text-success">FREE</span>
            ) : (
              <Money
                value={line.amount}
                sign={line.isNegative ? 'always' : 'auto'}
                className={`font-mono ${line.isNegative ? 'text-success' : 'text-ink'} ${line.highlight ? 'font-bold' : ''}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-paper-line flex justify-between items-baseline text-ink">
        <span className="text-sm font-extrabold">{totalLabel}</span>
        <Money value={computedTotal} className="font-mono text-xl font-bold" />
      </div>
      {footnote && <p className="text-[11px] font-semibold text-success">{footnote}</p>}
    </div>
  );
}
