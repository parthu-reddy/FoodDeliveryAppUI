import { Surface } from '@shared/ui';
import { formatINR } from '@shared/money';
import { StatementTable, type StatementRow } from '@shared/money/components/StatementTable';
import { schemas } from "@/api/generated/schemas/ledger/payout_controller";
import { z } from 'zod';

type PayoutDetailResponse = z.infer<typeof schemas.PayoutDetailResponse>;
type PayoutLine = NonNullable<PayoutDetailResponse['lines']>[number];

/**
 * The ledger entries one payout settles, with the total and the mismatch warning.
 *
 * Split out of PayoutDetail. The "does not match the payout amount" line is the point of the
 * whole block, and it was buried at the bottom of a 334-line file.
 */
export function PayoutLinesPanel({ lines, amount }: { lines: PayoutLine[]; amount?: number }) {
  const linesTotal = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);

  return (
     <Surface elevation={2} radius="xl" className="p-6">
         <div className="flex items-baseline justify-between mb-4">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                 Settled Lines ({lines.length})
             </h3>
             <span className="text-sm text-slate-500">
                 Lines total <span className="font-bold text-slate-800 dark:text-white">{formatINR(linesTotal)}</span>
                 {amount !== undefined && Math.abs(linesTotal - amount) > 0.005 && (
                    <span className="ml-2 text-rose-600 font-bold">does not match the payout amount</span>
                 )}
             </span>
         </div>
         <StatementTable 
             rows={lines.map((line, index) => ({
               // Stable across renders; see the note in PayoutDrawer. Math.random() here also
               // meant two renders of the same payout never reused a row.
               id: line.id || line.ledgerEntryId || `payout-line-${index}`,
               date: line.entryCreatedAt || '',
               description: line.category || '',
               category: line.category,
               referenceId: line.referenceId,
               // Every payout line references the order it came from.
               referenceLink: line.referenceId ? `/admin/orders/${line.referenceId}/money` : undefined,
               debit: line.direction === 'DEBIT' ? (line.amount || 0) : 0,
               credit: line.direction === 'CREDIT' ? (line.amount || 0) : 0,
             } as StatementRow))}
         />
     </Surface>
  );
}
