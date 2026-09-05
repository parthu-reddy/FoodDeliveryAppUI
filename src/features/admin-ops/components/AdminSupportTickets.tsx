import { useToast } from "@/contexts/ToastContext";
import { usePolling } from "@/hooks/usePolling";
import { formatINR } from '@shared/money';
import { parseApiError } from '@/lib/parseApiError';
import { adminApi } from "@/lib/zodiosClients";
import { ChatWidget } from "@features/communication/components/ChatWidget";
import { Button, Textarea } from '@shared/ui';
import { ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { asUntyped, WirePage } from '../../../lib/untypedResponse';

export default function AdminSupportTickets() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'>('OPEN');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [faultType, setFaultType] = useState('UNKNOWN');
  const [overrideAmount, setOverrideAmount] = useState<number | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showChat, setShowChat] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatWidgetRef = useRef<any>(null);

  // Polling for tickets
  const { data: ticketsResponse, refetch: fetchTickets } = usePolling({
    fetchFn: async () => {
      const res = await adminApi.getRefundTickets({ queries: { page, status: activeTab } });
      return res;
    },
    intervalMs: 15000,
    enabled: true
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    if (ticketsResponse) {
      const content = asUntyped<WirePage<unknown>>(ticketsResponse).content ?? (Array.isArray(ticketsResponse) ? ticketsResponse : []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTickets(Array.isArray(content) ? content : []);
      if (ticketsResponse.totalPages !== undefined) {
        setTotalPages(ticketsResponse.totalPages);
      }
    }
  }, [ticketsResponse]);

  const handleResolveTicket = async (ticketId: string, approved: boolean) => {
    try {
      await adminApi.resolveRefundTicket({ 
        approved, 
        notes: resolutionNotes,
        faultType,
        overrideAmount: overrideAmount === '' ? undefined : Math.round(Number(overrideAmount) * 100)
      }, { params: { ticketId } });
      
      showSuccess(`Ticket successfully ${approved ? 'approved' : 'rejected'}`);
      setSelectedTicket(null);
      setResolutionNotes('');
      setFaultType('UNKNOWN');
      setShowChat(false);
      fetchTickets();
    } catch (error) {
      showError(`Failed to resolve ticket: ${parseApiError(error)}`);
    }
  };

  /** Only the fields this handler reads; responses stay untyped at component level here. */
  interface OpenChatTicket { resolutionNotes?: string | null; refundAmount?: number | null }
  const handleOpenChat = (ticket: OpenChatTicket) => {
    setSelectedTicket(ticket);
    setShowChat(true);
    setResolutionNotes(ticket.resolutionNotes || '');
    setOverrideAmount(ticket.refundAmount || '');
  };

  return (
    <div className="flex w-full h-full bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-hidden">
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-[#f0ede6] tracking-tight">Support Tickets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review refund requests and support cases</p>
          </div>
          
          <div className="flex p-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            {(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(0);
                  setSelectedTicket(null);
                  setShowChat(false);
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  activeTab === tab 
                    ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 gap-6 min-h-0">
          
          {/* List View */}
          <div className={`flex flex-col flex-1 bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden ${selectedTicket ? 'max-w-md hidden lg:flex' : ''}`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="font-bold text-slate-800 dark:text-[#f0ede6]">
                {activeTab.replace('_', ' ')} Tickets ({tickets.length})
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <ShieldCheck className="w-12 h-12 mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    onClick={() => handleOpenChat(ticket)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedTicket?.id === ticket.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-bold text-slate-800 dark:text-[#f0ede6]">Order #{ticket.orderId?.substring(0, 8)}</div>
                      <div className="text-xs font-medium px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full">
                        {formatINR(ticket.refundAmount)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                      {ticket.reason || 'No reason provided'}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-6 text-indigo-500">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 0} 
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages - 1} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Detail View */}
          {selectedTicket && (
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden relative">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-[#f0ede6]">Ticket Details</h2>
                  <p className="text-sm text-slate-500 mt-1">Order ID: {selectedTicket.orderId}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedTicket(null); setShowChat(false); }}>
                    <XCircle className="w-5 h-5 text-slate-400" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                
                {/* Chat Widget Wrapper */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative" style={{ minHeight: '400px' }}>
                  {showChat && (
                    <div className="absolute inset-0">
                      <ChatWidget 
                        ref={chatWidgetRef}
                        orderId={selectedTicket.orderId}
                        currentUserType="ADMIN"
                      />
                    </div>
                  )}
                  <OpenChatHelper widgetRef={chatWidgetRef} show={showChat} />
                </div>

                {/* Resolution Controls */}
                {(activeTab === 'OPEN' || activeTab === 'IN_REVIEW') && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-[#f0ede6] mb-3">Resolution Action</h3>
                    <Textarea 
                      placeholder="Add admin notes (required for rejection)"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="mb-4 bg-white dark:bg-slate-800"
                    />
                    <div className="flex flex-col gap-4 mb-4">
                      <div className="flex gap-4">
                        <select 
                          value={faultType}
                          onChange={(e) => setFaultType(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                        >
                          <option value="UNKNOWN">Select Fault Type</option>
                          <option value="RESTAURANT_FAULT">Restaurant Fault</option>
                          <option value="RIDER_FAULT">Rider Fault</option>
                          <option value="PLATFORM_FAULT">Platform Fault</option>
                          <option value="CUSTOMER_FAULT">Customer Fault</option>
                        </select>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                          Required for accurate ledger accounting when approving refunds.
                        </div>
                      </div>
                      
                      <div className="flex gap-4 items-center">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Override Refund Amount:
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            max={selectedTicket.refundAmount ? selectedTicket.refundAmount / 100 : undefined}
                            value={overrideAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setOverrideAmount('');
                              } else {
                                const num = Number(val);
                                if (num <= selectedTicket.refundAmount) {
                                  setOverrideAmount(num);
                                }
                              }
                            }}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-7 pr-3 py-2 text-sm text-slate-700 dark:text-slate-200 w-32"
                          />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Original Quote: {formatINR(selectedTicket.refundAmount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="primary" 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white border-transparent"
                        onClick={() => handleResolveTicket(selectedTicket.id, true)}
                      >
                        Approve Refund
                      </Button>
                      <Button 
                        variant="danger" 
                        className="flex-1"
                        onClick={() => handleResolveTicket(selectedTicket.id, false)}
                        disabled={!resolutionNotes.trim()}
                      >
                        Reject Request
                      </Button>
                    </div>
                  </div>
                )}
                
                {(activeTab === 'RESOLVED' || activeTab === 'REJECTED') && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-[#f0ede6] mb-3">Resolution Notes</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">
                      {selectedTicket.resolutionNotes || 'No notes provided.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Helper to auto-open the chat widget when mounted in the admin view
/** The ref only ever has openChatOnly() called on it. */
function OpenChatHelper({ widgetRef, show }: { widgetRef: React.RefObject<{ openChatOnly?: () => void } | null>, show: boolean }) {
  useEffect(() => {
    if (show && widgetRef.current) {
      setTimeout(() => {
        widgetRef.current?.openChatOnly?.();
      }, 100);
    }
  }, [show, widgetRef]);
  return null;
}
