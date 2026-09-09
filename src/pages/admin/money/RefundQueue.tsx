import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { getUserProfile } from '@/lib/tokenStore';
import { roundRupees } from '@shared/money';
import { customerApi } from "@/lib/zodiosClients";
import { Button, Spinner } from '@shared/ui';
import { CheckCircle, AlertTriangle, MessageSquare, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import { formatINR } from '@shared/money';

import { z } from "zod";
import { SupportTicket } from "@/api/generated/schemas/customer/common";
import { usePolling } from "@/hooks/usePolling";

type Ticket = z.infer<typeof SupportTicket>;

export default function RefundQueue() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const { showError, showSuccess } = useToast();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Resolve Form State
  const [resolving, setResolving] = useState(false);
  const [approved, setApproved] = useState(true);
  const [notes, setNotes] = useState("");
  const [faultType, setFaultType] = useState("UNKNOWN");
  const [overrideAmount, setOverrideAmount] = useState<string>("");

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

  const handleResolve = async () => {
    if (!selectedTicket) return;
    const adminId = getUserProfile()?.id;
    if (!adminId) {
      showError('Your session does not identify you; sign in again before resolving a refund.');
      return;
    }
    setResolving(true);
    try {
       await customerApi.adminRefund.resolveTicket({
          approved,
          notes,
          faultType,
          // Rupees, matching ResolveRequest.overrideAmount (a BigDecimal compared against the
          // rupee-denominated quote). Multiplying by 100 here sent ₹1.50 as 150 -- a hundredfold
          // over-refund whenever the inflated figure still fell under the quote.
          overrideAmount: overrideAmount ? roundRupees(Number(overrideAmount)) : undefined
       }, {
          params: { ticketId: selectedTicket.id! },
          // The real administrator, not a placeholder: this id is stamped into the ticket's
          // resolvedBy and into the refund's initiatedById -- it is the audit record of who
          // authorised the money movement.
          headers: { 'X-User-Id': adminId }
       });
       showSuccess(`Ticket ${selectedTicket.id?.substring(0,8)} resolved successfully`);
       setSelectedTicket(null);
       refetch();
    } catch (e: unknown) {
       console.error(e);
       showError(parseApiError(e, 'Failed to resolve ticket').message);
    } finally {
       setResolving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPEN': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded font-medium">OPEN</span>;
      case 'IN_REVIEW': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">IN REVIEW</span>;
      case 'RESOLVED': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">RESOLVED</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded font-medium">REJECTED</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-medium">{status}</span>;
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6]">
      <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-500" /> Refund Exception Queue
            </h2>
          </div>

          <div className="glass-panel p-4 mb-6 flex items-center gap-4">
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status Filter</label>
                  <select 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                  >
                      <option value="OPEN">Open</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="ALL">All Tickets</option>
                  </select>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                <Spinner size="md" /> Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="glass-panel p-12 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Queue Empty</h3>
                <p className="text-slate-500">There are no refund tickets requiring action right now.</p>
              </div>
            ) : (
              <div className="glass-panel overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-slate-200 dark:border-slate-700/50">
                          <th className="p-4 text-sm font-semibold text-slate-500">Ticket ID</th>
                          <th className="p-4 text-sm font-semibold text-slate-500">Order ID</th>
                          <th className="p-4 text-sm font-semibold text-slate-500">Reason</th>
                          <th className="p-4 text-sm font-semibold text-slate-500 text-right">Requested Amt</th>
                          <th className="p-4 text-sm font-semibold text-slate-500">Status</th>
                          <th className="p-4 text-sm font-semibold text-slate-500">Created</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                       {tickets.map((t) => (
                          <tr 
                             key={t.id} 
                             className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors ${selectedTicket?.id === t.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                             onClick={() => {
                                 setSelectedTicket(t);
                                 setApproved(true);
                                 setNotes("");
                                 setFaultType("UNKNOWN");
                                 setOverrideAmount("");
                             }}
                          >
                             <td className="p-4 font-mono text-sm">{t.id?.substring(0, 8)}...</td>
                             <td className="p-4 font-mono text-sm">{t.orderId?.substring(0, 8)}...</td>
                             <td className="p-4 max-w-[200px] truncate" title={t.reason}>{t.reason}</td>
                             <td className="p-4 text-right font-medium">{t.refundAmount ? formatINR(t.refundAmount) : '-'}</td>
                             <td className="p-4">{getStatusBadge(t.status)}</td>
                             <td className="p-4 text-sm text-slate-500">{new Date(t.createdAt || '').toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 
                 {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                       <Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                       <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
                       <Button variant="ghost" disabled={page === totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                 )}
              </div>
            )}
          </div>
      </div>

      {/* Ticket Details & Resolution Panel */}
      {selectedTicket && (
          <div className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f111a] flex flex-col h-full shadow-xl">
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-bold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" /> Ticket Details
                </h3>
                <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">×</button>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
                 <div className="mb-6 space-y-4">
                     <div>
                         <label className="text-xs text-slate-500 font-bold block mb-1">Customer Reason</label>
                         <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 leading-relaxed">
                             {selectedTicket.reason}
                         </p>
                     </div>
                     {selectedTicket.restaurantComments && (
                         <div>
                             <label className="text-xs text-slate-500 font-bold block mb-1">Restaurant Comments</label>
                             <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50">
                                 {selectedTicket.restaurantComments}
                             </p>
                         </div>
                     )}
                     <div>
                         <label className="text-xs text-slate-500 font-bold block mb-1">Requested Amount</label>
                         <p className="text-lg font-black text-slate-900 dark:text-white">
                             {selectedTicket.refundAmount ? formatINR(selectedTicket.refundAmount) : 'Full Refund Requested'}
                         </p>
                     </div>
                 </div>

                 {['OPEN', 'IN_REVIEW'].includes(selectedTicket.status || '') ? (
                     <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                         <h4 className="font-bold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                             Resolution Action
                         </h4>
                         
                         <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-2">
                                 <button 
                                     onClick={() => setApproved(true)}
                                     className={`p-2 rounded-lg border-2 text-sm font-bold transition-all ${approved ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                                 >
                                     Approve
                                 </button>
                                 <button 
                                     onClick={() => setApproved(false)}
                                     className={`p-2 rounded-lg border-2 text-sm font-bold transition-all ${!approved ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500'}`}
                                 >
                                     Reject
                                 </button>
                             </div>

                             {approved && (
                                 <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Fault Attribution</label>
                                        <select 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={faultType}
                                            onChange={e => setFaultType(e.target.value)}
                                        >
                                            <option value="UNKNOWN">Unknown / Not Investigated</option>
                                            <option value="PLATFORM_FAULT">Platform Fault (We pay)</option>
                                            <option value="RESTAURANT_FAULT">Restaurant Fault (Chargeback)</option>
                                            <option value="RIDER_FAULT">Rider Fault (Deduct)</option>
                                            <option value="CUSTOMER_FAULT">Customer Fault (Goodwill)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Override Amount (Quote Cap)</label>
                                        <div className="relative">
                                            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                            <input 
                                                type="number"
                                                className="w-full pl-9 pr-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                placeholder="Leave blank for requested amount"
                                                value={overrideAmount}
                                                onChange={e => setOverrideAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                 </>
                             )}

                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Resolution Notes</label>
                                 <textarea 
                                     className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                     rows={3}
                                     placeholder="Internal notes for audit trail..."
                                     value={notes}
                                     onChange={e => setNotes(e.target.value)}
                                 />
                             </div>

                             <Button 
                                 variant={approved ? "primary" : "danger"} 
                                 className="w-full"
                                 onClick={handleResolve}
                                 disabled={resolving}
                             >
                                 {resolving ? <Spinner size="sm" /> : (approved ? 'Approve Refund' : 'Reject Refund')}
                             </Button>
                         </div>
                     </div>
                 ) : (
                     <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
                         <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                             <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Resolution Audit</div>
                             <div className="space-y-2 text-sm">
                                 <div className="flex justify-between">
                                     <span className="text-slate-500">Action:</span>
                                     <span className="font-medium">{selectedTicket.status}</span>
                                 </div>
                                 {selectedTicket.resolvedAt && (
                                     <div className="flex justify-between">
                                         <span className="text-slate-500">Date:</span>
                                         <span>{new Date(selectedTicket.resolvedAt).toLocaleString()}</span>
                                     </div>
                                 )}
                                 {selectedTicket.resolutionNotes && (
                                     <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                         <span className="text-slate-500 block mb-1">Notes:</span>
                                         <p className="italic text-slate-700 dark:text-slate-300">"{selectedTicket.resolutionNotes}"</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 )}
             </div>
          </div>
      )}
    </div>
  );
}
