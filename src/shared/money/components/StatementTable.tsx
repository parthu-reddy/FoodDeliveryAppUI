import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Money } from './Money';

export interface StatementRow {
  id: string;
  date: string;
  description: string;
  referenceId?: string;
  referenceLink?: string;
  debit: number;
  credit: number;
  runningBalance?: number;
}

interface StatementTableProps {
  rows: StatementRow[];
  isLoading?: boolean;
}

export function StatementTable({ rows, isLoading }: StatementTableProps) {
  // Simple virtualization: just rendering for now, could be enhanced for > 200 rows
  const displayRows = useMemo(() => rows, [rows]);

  if (isLoading && displayRows.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading statement...</div>;
  }

  if (displayRows.length === 0) {
    return <div className="p-8 text-center text-slate-500">No transactions found for this period.</div>;
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3 text-right">Debit</th>
            <th className="px-4 py-3 text-right">Credit</th>
            <th className="px-4 py-3 text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayRows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap">
                {format(new Date(row.date), 'MMM d, yyyy h:mm a')}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{row.description}</p>
                {row.referenceId && (
                  row.referenceLink ? (
                    <a href={row.referenceLink} className="text-xs text-blue-600 hover:underline mt-0.5 block">
                      Ref: {row.referenceId}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {row.referenceId}</p>
                  )
                )}
              </td>
              <td className="px-4 py-3 text-right text-rose-600 font-medium">
                {row.debit > 0 ? <Money value={row.debit} sign="never" /> : '-'}
              </td>
              <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                {row.credit > 0 ? <Money value={row.credit} sign="never" /> : '-'}
              </td>
              <td className="px-4 py-3 text-right text-slate-900 font-medium whitespace-nowrap">
                {row.runningBalance !== undefined ? (
                  <Money value={row.runningBalance} sign="auto" />
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
