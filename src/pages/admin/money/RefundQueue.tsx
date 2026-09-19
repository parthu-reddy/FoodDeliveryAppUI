import { customerApi } from "@/lib/zodiosClients";
import { formatINR } from '@shared/money';
import { Button, Column, DataTable, Select, StatusPill, Surface } from '@shared/ui';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { z } from "zod";
import { SupportTicket } from "@/api/generated/schemas/customer/common";
import { usePolling } from "@/hooks/usePolling";
import { refundTicketStatus } from '@features/admin-ops/model/refundStatus';
import { RefundTicketPanel } from './RefundTicketPanel';

type Ticket = z.infer<typeof SupportTicket>;

export default function RefundQueue() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { data: ticketsResponse, refetch, isLoading: loading } = usePolling({
    fetchFn: async () => {
      return await customerApi.adminRefund.getTickets({ 
          queries: { 
              page, 
              size: 20,
              // The generated client types this query as an optional string, so no cast.
              status: statusFilter === "ALL" ? undefined : statusFilter
          } 
      });
    },
    intervalMs: 15000,
    enabled: true
  });

  const tickets = ticketsResponse?.content || [];
  const totalPages = ticketsResponse?.totalPages || 1;

  // Sorting is on the raw value, never the cell: an amount renders as "₹1,250" and a status
  // as a pill, and ordering either by its markup is nonsense.
  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      header: 'Ticket ID',
      cell: (t) => <span className="font-mono">{t.id?.substring(0, 8)}…</span>,
      sortValue: (t) => t.id ?? '',
    },
    {
      key: 'orderId',
      header: 'Order ID',
      cell: (t) => <span className="font-mono">{t.orderId?.substring(0, 8)}…</span>,
      sortValue: (t) => t.orderId ?? '',
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (t) => <span className="block max-w-[200px] truncate" title={t.reason}>{t.reason}</span>,
    },
    {
      key: 'amount',
      header: 'Requested Amt',
      align: 'right',
      cell: (t) => (t.refundAmount ? formatINR(t.refundAmount) : '-'),
      cellClassName: 'font-medium',
      sortValue: (t) => t.refundAmount ?? 0,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => {
        const { label, tone } = refundTicketStatus(t.status);
        return <StatusPill label={label} tone={tone} />;
      },
      sortValue: (t) => t.status ?? '',
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (t) => new Date(t.createdAt || '').toLocaleString(),
      sortValue: (t) => new Date(t.createdAt || 0).getTime(),
    },
  ];

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6]">
      {/* The queue yields the screen to the detail rail below lg:, the way the support
          tickets screen does. Admin is desktop-first and this is the tablet fallback. */}
      <div className={`flex-1 p-6 flex flex-col min-w-0 ${selectedTicket ? 'hidden lg:flex' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-500" /> Refund Exception Queue
            </h2>
          </div>

          <Surface elevation={2} radius="xl" className="p-4 mb-6 flex items-center gap-4">
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status Filter</label>
                  <Select
                      aria-label="Status Filter"
                      className="w-44"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: 'OPEN', label: 'Open' },
                        { value: 'IN_REVIEW', label: 'In Review' },
                        { value: 'RESOLVED', label: 'Resolved' },
                        { value: 'REJECTED', label: 'Rejected' },
                        { value: 'ALL', label: 'All Tickets' },
                      ]}
                  />
              </div>
          </Surface>

          <div className="flex-1 overflow-y-auto">
            {!loading && tickets.length === 0 ? (
              <Surface elevation={2} radius="xl" className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Queue Empty</h3>
                <p className="text-slate-500">There are no refund tickets requiring action right now.</p>
              </Surface>
            ) : (
              <Surface elevation={2} radius="xl" className="overflow-hidden">
                <DataTable
                  caption="Refund tickets awaiting a decision"
                  columns={columns}
                  rows={tickets}
                  rowKey={(t) => t.id ?? ''}
                  loading={loading}
                  stickyHeader
                  activeRowKey={selectedTicket?.id ?? undefined}
                  onRowClick={setSelectedTicket}
                  emptyMessage="No refund tickets requiring action right now."
                  footer={totalPages > 1 ? (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                      <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
                      <Button variant="ghost" disabled={page === totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                  ) : undefined}
                />
              </Surface>
            )}
          </div>
      </div>

      {selectedTicket && (
        // Keyed by ticket: a new panel per ticket is what clears the resolution form, rather
        // than four setState calls at the click site that a fifth field would outgrow.
        <RefundTicketPanel
          key={selectedTicket.id}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onResolved={refetch}
        />
      )}
    </div>
  );
}
