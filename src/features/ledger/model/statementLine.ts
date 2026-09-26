import type { z } from 'zod';
import type { LedgerStatementLineDto } from '@/api/generated/schemas/customer/common';
import { formatDateTime } from '@/shared/time';

/**
 * One line of a ledger statement, as the rider, restaurant and admin money endpoints all
 * return it. Inferred from the generated schema rather than re-spelled, so the UI cannot
 * drift from the contract.
 */
export type LedgerStatementLine = z.infer<typeof LedgerStatementLineDto>;

/** The statement as a CSV, in the column order the screens already exported. */
export function statementCsv(lines: LedgerStatementLine[], formatAmount: (value: number) => string): string {
  const rows = lines.map((line) => {
    const date = formatDateTime(line.createdAt);
    return `"${date}","${line.category}","${line.description}","${line.direction}","${formatAmount(line.amount || 0)}","${line.settled}"`;
  });
  return ['Date,Category,Description,Direction,Amount,Settled', ...rows].join('\n') + '\n';
}
