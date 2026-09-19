import { Activity, CheckCircle, Download, FileText } from 'lucide-react';
import React from 'react';
import { formatINR } from '@shared/money';
import { Button, DataTable, StatusPill, Surface, type Column } from '@shared/ui';
import { statementCsv, type LedgerStatementLine } from '../model/statementLine';

/**
 * The account statement, for whoever is owed money.
 *
 * `RiderEarnings` and `RestaurantEarningsTab` had written this panel out twice — the same five
 * columns, the same CSV export, the same pager — and the copies had already drifted: the rider
 * saw a date and a time on each line, the restaurant saw only a date. It is the pair the
 * Phase 3 duplication detector reported.
 */

const DIRECTION_TONE = { CREDIT: 'success', DEBIT: 'danger' } as const;

const columns: Column<LedgerStatementLine>[] = [
  {
    key: 'date',
    header: 'Date',
    cell: (line) => new Date(String(line.createdAt || '')).toLocaleString(),
    cellClassName: 'whitespace-nowrap',
  },
  {
    key: 'description',
    header: 'Description',
    cell: (line) => (
      <span className="flex items-center gap-2">
        {String(line.description || '-')}
        {line.direction && (
          <StatusPill label={line.direction} tone={DIRECTION_TONE[line.direction]} />
        )}
      </span>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    cell: (line) => <StatusPill label={String(line.category || '-')} tone="neutral" />,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (line) => `${line.direction === 'DEBIT' ? '-' : '+'}${formatINR(line.amount || 0)}`,
    cellClassName: 'font-bold font-mono whitespace-nowrap',
  },
  {
    key: 'settled',
    header: 'Settled',
    align: 'center',
    cell: (line) =>
      line.settled ? (
        <CheckCircle className="w-4 h-4 mx-auto" style={{ color: 'var(--color-success)' }} aria-label="Settled" />
      ) : (
        <Activity className="w-4 h-4 mx-auto" style={{ color: 'var(--color-warning)' }} aria-label="Pending" />
      ),
  },
];

interface LedgerStatementPanelProps {
  lines: LedgerStatementLine[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  /** Base name for the exported file; the page number is appended. */
  csvName: string;
}

export function LedgerStatementPanel({
  lines,
  loading = false,
  page,
  totalPages,
  onPage,
  csvName,
}: LedgerStatementPanelProps) {
  const downloadCsv = () => {
    if (lines.length === 0) return;
    const blob = new Blob([statementCsv(lines, formatINR)], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${csvName}_page${page}.csv`;
    anchor.click();
    // The object URL was leaked by both copies of this panel; a session that exported a few
    // pages held every one of them until reload.
    window.URL.revokeObjectURL(url);
  };

  return (
    <Surface radius="lg" elevation={1} className="overflow-hidden p-0">
      <div
        className="p-4 flex justify-between items-center"
        style={{ borderBottom: '1px solid var(--color-paper-line)', background: 'var(--color-paper-sunken)' }}
      >
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <FileText className="w-4 h-4" /> Account Statement
        </h3>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadCsv}>
          Export CSV
        </Button>
      </div>

      <DataTable
        caption="Account statement"
        columns={columns}
        rows={lines}
        rowKey={(line, index) => String(line.transactionId || index)}
        loading={loading}
        emptyMessage="No transactions found."
        footer={totalPages > 1 && (
          <div
            className="p-4 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--color-paper-line)', background: 'var(--color-paper-sunken)' }}
          >
            <Button variant="ghost" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
            <span className="text-sm" style={{ color: 'var(--color-ink-2)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <Button variant="ghost" disabled={page === totalPages - 1} onClick={() => onPage(page + 1)}>Next</Button>
          </div>
        )}
      />
    </Surface>
  );
}
