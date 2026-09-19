import React from 'react';
import { format } from 'date-fns';
import { DataTable, type Column } from '@shared/ui';
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

const COLUMNS: Column<StatementRow>[] = [
  {
    key: 'date',
    header: 'Date',
    cell: (row) => format(new Date(row.date), 'MMM d, yyyy h:mm a'),
    cellClassName: 'whitespace-nowrap',
  },
  {
    key: 'description',
    header: 'Description',
    cell: (row) => (
      <>
        <p className="font-medium" style={{ color: 'var(--color-ink)' }}>{row.description}</p>
        {row.referenceId && (
          row.referenceLink ? (
            <a href={row.referenceLink} className="text-xs mt-0.5 block hover:underline"
               style={{ color: 'var(--color-info)' }}>
              Ref: {row.referenceId}
            </a>
          ) : (
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-ink-3)' }}>
              Ref: {row.referenceId}
            </p>
          )
        )}
      </>
    ),
  },
  {
    key: 'debit',
    header: 'Debit',
    align: 'right',
    cell: (row) => (row.debit > 0 ? <Money value={row.debit} sign="never" /> : '-'),
    cellClassName: 'font-medium',
  },
  {
    key: 'credit',
    header: 'Credit',
    align: 'right',
    cell: (row) => (row.credit > 0 ? <Money value={row.credit} sign="never" /> : '-'),
    cellClassName: 'font-medium',
  },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (row) => (row.runningBalance !== undefined ? <Money value={row.runningBalance} sign="auto" /> : '-'),
    cellClassName: 'font-medium whitespace-nowrap',
  },
];

interface StatementTableProps {
  rows: StatementRow[];
  isLoading?: boolean;
}

export function StatementTable({ rows, isLoading }: StatementTableProps) {
  return (
    <DataTable
      caption="Statement"
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => row.id}
      loading={isLoading}
      emptyMessage="No transactions found for this period."
    />
  );
}
