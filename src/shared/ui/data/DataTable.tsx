import React, { useMemo, useState } from 'react';
import { Spinner } from '../feedback/Spinner';

/**
 * The one table.
 *
 * Nine screens had each written `<div class="overflow-x-auto"><table><thead><tr><th…` by hand,
 * with nine sets of slate utilities that had already drifted apart — and not one of them gave
 * the table an accessible name, so a screen reader announced "table" and nothing else.
 *
 * Columns are data, not markup, which is what lets a row renderer be shared: the header, the
 * alignment and the cell travel together, so a column can no longer be right-aligned in the
 * head and left-aligned in the body.
 *
 * Sorting, a sticky header and bulk selection live here because the admin role is defined by
 * them (Phase4_RoleSurfaces/plan.md, "Admin — dense, keyboard-first"). A queue screen that
 * writes its own sort is how the nine tables happened the first time.
 */

export interface Column<T> {
  /** Stable identity for the column. Not rendered. */
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  cell: (row: T, index: number) => React.ReactNode;
  /** Extra classes for this column's body cells. */
  cellClassName?: string | ((row: T) => string);
  /**
   * Makes the column sortable, by returning the value to order on. Sorting is on this value,
   * never on the rendered cell: a cell can be a `<StatusPill>` or a formatted amount, and
   * ordering by its markup would be nonsense.
   */
  sortValue?: (row: T) => string | number;
}

export interface DataTableSelection<T> {
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /** Names each row's checkbox for assistive technology. */
  rowLabel: (row: T) => string;
}

interface DataTableProps<T> {
  /** Names the table for assistive technology. Required — every table is about something. */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  /** Pagination or totals, below the table and inside its frame. */
  footer?: React.ReactNode;
  /** Keeps the header in view while the body scrolls. Needs a bounded height on the wrapper. */
  stickyHeader?: boolean;
  /** Row selection for bulk actions. */
  selection?: DataTableSelection<T>;
  /** Rendered above the table while at least one row is selected. */
  bulkActions?: (selectedKeys: string[]) => React.ReactNode;
  /** Highlights the row a detail pane is showing. */
  activeRowKey?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'Nothing to show yet.',
  footer,
  stickyHeader = false,
  selection,
  bulkActions,
  activeRowKey,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  const ordered = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const read = column.sortValue;
    const sign = sort.direction === 'asc' ? 1 : -1;
    // A copy: sorting the caller's array in place would reorder their state.
    return [...rows].sort((a, b) => sign * compare(read(a), read(b)));
  }, [rows, columns, sort]);

  const keys = ordered.map((row, index) => rowKey(row, index));
  const selectedHere = keys.filter((k) => selection?.selected.has(k));
  const allSelected = keys.length > 0 && selectedHere.length === keys.length;

  const toggleAll = () => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (allSelected) keys.forEach((k) => next.delete(k));
    else keys.forEach((k) => next.add(k));
    selection.onChange(next);
  };

  const toggleRow = (key: string) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selection.onChange(next);
  };

  const onHeaderClick = (column: Column<T>) => {
    if (!column.sortValue) return;
    setSort((current) =>
      current?.key === column.key
        ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key: column.key, direction: 'asc' },
    );
  };

  if (loading && rows.length === 0) {
    return (
      <div className="p-10 flex justify-center">
        <Spinner label={`Loading ${caption}`} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-2)' }}>
        {emptyMessage}
      </p>
    );
  }

  const headCellStyle: React.CSSProperties = stickyHeader
    ? { position: 'sticky', top: 0, zIndex: 1, background: 'var(--color-paper-sunken)' }
    : {};

  return (
    <div className={className}>
      {bulkActions && selectedHere.length > 0 && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2 text-xs font-bold"
          style={{
            background: 'var(--color-paper-sunken)',
            borderBottom: '1px solid var(--color-paper-line)',
            color: 'var(--color-ink)',
          }}
        >
          <span aria-live="polite">{selectedHere.length} selected</span>
          <div className="flex items-center gap-2">{bulkActions(selectedHere)}</div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ color: 'var(--color-ink-2)' }}>
          <caption className="sr-only">{caption}</caption>
          <thead
            className="text-xs uppercase font-semibold"
            style={{
              color: 'var(--color-ink-2)',
              background: 'var(--color-paper-sunken)',
              borderBottom: '1px solid var(--color-paper-line)',
            }}
          >
            <tr>
              {selection && (
                <th scope="col" className="px-4 py-3 w-10" style={headCellStyle}>
                  <input
                    // `indeterminate` is a DOM property with no attribute, so it is set on
                    // the node. Through the ref callback, not during render: React reruns
                    // render freely and a write there is not guaranteed to survive.
                    ref={(node) => {
                      if (node) node.indeterminate = selectedHere.length > 0 && !allSelected;
                    }}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={`Select all ${caption}`}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => {
                const sorted = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      column.sortValue
                        ? sorted
                          ? sort.direction === 'asc' ? 'ascending' : 'descending'
                          : 'none'
                        : undefined
                    }
                    className={`px-4 py-3 ${ALIGN[column.align ?? 'left']}`}
                    style={headCellStyle}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => onHeaderClick(column)}
                        className="inline-flex items-center gap-1 font-semibold uppercase cursor-pointer"
                        style={{ color: sorted ? 'var(--color-ink)' : 'inherit' }}
                      >
                        {column.header}
                        <span aria-hidden="true">{sorted ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordered.map((row, index) => {
              const key = keys[index];
              const isActive = activeRowKey !== undefined && activeRowKey === key;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  style={{
                    borderTop: index === 0 ? undefined : '1px solid var(--color-paper-line)',
                    background: isActive ? 'var(--color-paper-sunken)' : undefined,
                  }}
                >
                  {selection && (
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selection.selected.has(key)}
                        onChange={() => toggleRow(key)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={selection.rowLabel(row)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const extra = typeof column.cellClassName === 'function'
                      ? column.cellClassName(row)
                      : column.cellClassName ?? '';
                    return (
                      <td key={column.key} className={`px-4 py-3 ${ALIGN[column.align ?? 'left']} ${extra}`}>
                        {column.cell(row, index)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
