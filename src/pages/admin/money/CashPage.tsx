import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { ledgerApi } from "@/lib/zodiosClients";
import { Button, Spinner, Input } from '@shared/ui';
import { Search, IndianRupee, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { formatINR } from '@shared/money';

import { schemas } from "@/api/generated/schemas/ledger/cash_controller";
import { z } from "zod";

type CashRemittance = z.infer<typeof schemas.CashRemittance>;

export default function CashPage() {
  const [remittances, setRemittances] = useState<CashRemittance[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { showError, showSuccess } = useToast();

  const [driverId, setDriverId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // New Remittance State
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRemittances = async (searchDriverId: string, pageNum: number) => {
    if (!searchDriverId) return;
    setLoading(true);
    setIsSearching(true);
    try {
      const res = // getCashByDriver_2 is the ADMIN listing. Three controllers now expose a method of that
        // name -- payee (own cash), internal (SERVICE) and admin -- so the generator suffixes them.
        await ledgerApi.cash.getCashByDriver_2({
          params: { driverId: searchDriverId },
          queries: { page: pageNum, size: 20 }
      });
      setRemittances(res.content || []);
      setTotalPages(res.totalPages || 1);
      setPage(pageNum);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch remittances').message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
     if (!driverId) {
        showError("Please enter a Driver ID");
        return;
     }
     fetchRemittances(driverId, 0);
  };

  const handleRemit = async () => {
     if (!driverId || !amount || !reference) {
         showError("Please fill all fields to record a remittance");
         return;
     }
     setSubmitting(true);
     try {
         await ledgerApi.cash.remitCash({
             driverId,
             amount: Number(amount),
             reference
         });
         showSuccess("Remittance recorded successfully!");
         setAmount("");
         setReference("");
         // Refresh list
         fetchRemittances(driverId, 0);
     } catch (e: unknown) {
         console.error(e);
         showError(parseApiError(e, 'Failed to record remittance').message);
     } finally {
         setSubmitting(false);
     }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 dark:bg-[#0f111a] text-slate-800 dark:text-[#f0ede6]">
      {/* Left side: History */}
      <div className="flex-1 p-6 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800">
         <h2 className="text-2xl font-black flex items-center gap-2 mb-6">
            <IndianRupee className="w-6 h-6 text-emerald-500" /> Driver Cash Collections
         </h2>
         
         <div className="glass-panel p-4 mb-6 flex items-end gap-4">
             <div className="flex-1 max-w-md">
                 <label className="block text-xs font-bold text-slate-500 mb-1">Driver ID (UUID)</label>
                 <Input 
                    value={driverId} 
                    onChange={e => setDriverId(e.target.value)} 
                    placeholder="Enter Driver UUID..." 
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                 />
             </div>
             <Button variant="primary" onClick={handleSearch} disabled={loading || !driverId}>
                 {loading ? <Spinner size="sm" /> : <Search className="w-4 h-4 mr-2" />}
                 Search Driver
             </Button>
         </div>

         <div className="flex-1 overflow-y-auto">
             {!isSearching ? (
                 <div className="glass-panel p-12 text-center">
                    <Search className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Search Driver</h3>
                    <p className="text-slate-500">Enter a driver ID to view their cash remittance history and record new deposits.</p>
                 </div>
             ) : remittances.length === 0 && !loading ? (
                 <div className="p-12 text-center text-slate-500 font-medium bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    No cash remittance history found for this driver.
                 </div>
             ) : (
                 <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700/50">
                             <th className="p-4 text-sm font-semibold text-slate-500">Remittance ID</th>
                             <th className="p-4 text-sm font-semibold text-slate-500 text-right">Amount</th>
                             <th className="p-4 text-sm font-semibold text-slate-500">Reference</th>
                             <th className="p-4 text-sm font-semibold text-slate-500">Date</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                          {remittances.map((remit) => (
                             <tr key={remit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                                   <div title={remit.id}>{remit.id?.substring(0, 8)}...</div>
                                   <div className="text-[10px] text-slate-400 mt-1" title={`Ledger TX: ${remit.ledgerTransactionId}`}>
                                       TX: {remit.ledgerTransactionId?.substring(0,8)}
                                   </div>
                                </td>
                                <td className="p-4 text-right font-bold text-emerald-600">
                                   {formatINR(remit.amount ?? 0)}
                                </td>
                                <td className="p-4 font-mono text-xs">{remit.reference}</td>
                                <td className="p-4 text-sm text-slate-500">
                                   {new Date(remit.createdAt || '').toLocaleString()}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    
                    {totalPages > 1 && (
                       <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                          <Button variant="ghost" disabled={page === 0} onClick={() => fetchRemittances(driverId, page - 1)}>Previous</Button>
                          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
                          <Button variant="ghost" disabled={page === totalPages - 1} onClick={() => fetchRemittances(driverId, page + 1)}>Next</Button>
                       </div>
                    )}
                 </div>
             )}
         </div>
      </div>

      {/* Right side: New Remittance Form */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0f111a] flex flex-col shadow-xl">
         <div className="p-6 border-b border-slate-200 dark:border-slate-800">
             <h3 className="font-bold text-lg">Record Cash Deposit</h3>
             <p className="text-xs text-slate-500 mt-1">Record COD cash collected by drivers that has been deposited to the company bank account.</p>
         </div>
         
         <div className="p-6 space-y-4">
             {(!isSearching || loading) ? (
                 <div className="text-center p-8 text-slate-500 text-sm">
                     Please search for a driver first.
                 </div>
             ) : (
                 <>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Driver ID</label>
                        <div className="text-sm p-3 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono text-slate-600 dark:text-slate-400">
                            {driverId}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Amount Deposited (INR)</label>
                        <div className="relative">
                            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input 
                                type="number"
                                className="w-full pl-9 pr-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Bank Reference (UTR / Txn ID)</label>
                        <Input 
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="e.g. UTR123456789"
                        />
                    </div>
                    <div className="pt-4">
                        <Button 
                            variant="primary" 
                            className="w-full"
                            onClick={handleRemit}
                            disabled={submitting || !amount || !reference}
                        >
                            {submitting ? <Spinner size="sm" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Record Remittance</>}
                        </Button>
                    </div>
                 </>
             )}
         </div>
      </div>
    </div>
  );
}
