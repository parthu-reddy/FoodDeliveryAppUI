import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row { id: string; name: string; amount: number }

const rows: Row[] = [
  { id: 'a', name: 'Biryani', amount: 420 },
  { id: 'b', name: 'Falooda', amount: 180 },
];

const columns: Column<Row>[] = [
  { key: 'name', header: 'Item', cell: (r) => r.name },
  { key: 'amount', header: 'Amount', align: 'right', cell: (r) => r.amount },
];

const table = (over: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) => (
  <DataTable caption="Order lines" columns={columns} rows={rows} rowKey={(r) => r.id} {...over} />
);

describe('DataTable', () => {
  it('gives the table an accessible name', () => {
    // Not one of the nine hand-rolled tables this replaces had one: a screen reader
    // announced "table" and left the user to guess what it held.
    render(table());
    expect(screen.getByRole('table', { name: 'Order lines' })).toBeInTheDocument();
  });

  it('renders a header cell per column and a row per record', () => {
    render(table());
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Item', 'Amount']);
    // header row + 2 body rows
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(within(screen.getAllByRole('row')[1]).getByText('Biryani')).toBeInTheDocument();
  });

  it('applies a column alignment to the head and the body together', () => {
    // The point of columns-as-data: the two could drift when they were written separately.
    render(table());
    expect(screen.getAllByRole('columnheader')[1].className).toContain('text-right');
    expect(within(screen.getAllByRole('row')[1]).getAllByRole('cell')[1].className).toContain('text-right');
  });

  it('shows the empty message instead of an empty table', () => {
    render(table({ rows: [], emptyMessage: 'No transactions found.' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('No transactions found.')).toBeInTheDocument();
  });

  it('shows a spinner while loading with nothing yet, and the rows once there are some', () => {
    const { rerender } = render(table({ rows: [], loading: true }));
    expect(screen.getByRole('status', { name: 'Loading Order lines' })).toBeInTheDocument();
    // A background refresh must not blank a table that already has rows.
    rerender(table({ loading: true }));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders the footer inside the frame', () => {
    render(table({ footer: <span>Page 1 of 3</span> }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('sorts on the column value, not on the rendered cell', () => {
    // The cell for an amount is a formatted string and for a status a pill. Ordering by
    // markup is how a table ends up sorted by "₹" .
    const sortable: Column<Row>[] = [
      { key: 'name', header: 'Item', cell: (r) => r.name, sortValue: (r) => r.name },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        cell: (r) => `₹${r.amount}`,
        sortValue: (r) => r.amount,
      },
    ];
    render(table({ columns: sortable }));

    const amount = screen.getByRole('button', { name: /amount/i });
    fireEvent.click(amount);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Falooda');
    expect(screen.getByRole('columnheader', { name: /amount/i })).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(amount);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Biryani');
    expect(screen.getByRole('columnheader', { name: /amount/i })).toHaveAttribute('aria-sort', 'descending');
  });

  it('leaves a column without a sortValue unsortable', () => {
    render(table());
    expect(screen.queryByRole('button', { name: /amount/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /amount/i })).not.toHaveAttribute('aria-sort');
  });

  it('does not reorder the caller\'s array when it sorts', () => {
    const own: Row[] = [...rows];
    const sortable: Column<Row>[] = [
      { key: 'name', header: 'Item', cell: (r) => r.name, sortValue: (r) => r.name },
    ];
    render(table({ rows: own, columns: sortable }));
    // Twice: ascending happens to match the input order here, so a mutating sort would
    // leave the array looking untouched and this test would pass for the wrong reason.
    // It did, until the in-place version was reintroduced to check.
    const header = screen.getByRole('button', { name: /item/i });
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Falooda');
    expect(own.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('selects rows and reports the keys to the caller', () => {
    const seen: string[][] = [];
    render(table({
      selection: {
        selected: new Set<string>(),
        onChange: (next) => seen.push([...next]),
        rowLabel: (r) => `Select ${r.name}`,
      },
    }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Biryani' }));
    expect(seen).toEqual([['a']]);
  });

  it('select-all covers every row, and shows bulk actions only while something is selected', () => {
    const seen: string[][] = [];
    const selection = {
      selected: new Set<string>(),
      onChange: (next: Set<string>) => seen.push([...next]),
      rowLabel: (r: Row) => `Select ${r.name}`,
    };
    const { rerender } = render(table({
      selection,
      bulkActions: () => <button type="button">Refund selected</button>,
    }));
    expect(screen.queryByRole('button', { name: 'Refund selected' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /select all order lines/i }));
    expect(seen[0].sort()).toEqual(['a', 'b']);

    rerender(table({
      selection: { ...selection, selected: new Set(['a']) },
      bulkActions: () => <button type="button">Refund selected</button>,
    }));
    expect(screen.getByRole('button', { name: 'Refund selected' })).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('keeps the header in view when asked to', () => {
    // An admin queue is hundreds of rows; a header that scrolls away turns every column
    // into a guess.
    render(table({ stickyHeader: true }));
    expect(screen.getByRole('columnheader', { name: 'Item' })).toHaveStyle({ position: 'sticky' });
  });
});
