import { useToast } from "@/contexts/ToastContext";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi } from "@/lib/zodiosClients";
import { Spinner } from '@shared/ui';
import { IndianRupee, Store, Bike, FileText, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatINR } from '@shared/money';

import { schemas } from "@/api/generated/schemas/customer/admin_money_controller";
import { z } from "zod";

type AdminOrderMoney = z.infer<typeof schemas.AdminOrderMoney>;

export default function AdminOrderMoney({ orderId }: { orderId: string }) {
  const [data, setData] = useState<AdminOrderMoney | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchMoneyData();
  }, [orderId]);

  const fetchMoneyData = async () => {
    setLoading(true);
    try {
      const res = await customerApi.adminMoney.getOrderMoney({
          params: { orderId }
      });
      setData(res);
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to fetch order money breakdown').message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return <div className="p-12 text-center text-slate-500 font-medium flex items-center justify-center gap-3">
        <Spinner size="md" /> Loading money breakdown...
     </div>;
  }

  if (!data) {
     return <div className="p-8 text-center text-slate-500">Failed to load breakdown.</div>;
  }

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Customer Summary */}
           <div className="glass-panel p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
               <h3 className="font-bold flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400">
                   <IndianRupee className="w-5 h-5" /> Customer Paid
               </h3>
               <div className="space-y-2 text-sm mb-4 border-b border-indigo-100 dark:border-indigo-900/30 pb-4">
                   <div className="flex justify-between">
                       <span className="text-slate-500">Food Cost</span>
                       <span>{formatINR(data.foodCost ?? 0)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Delivery Fee</span>
                       <span>{formatINR(data.deliveryFee ?? 0)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Platform Fee</span>
                       <span>{formatINR(data.customerPlatformFee ?? 0)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Taxes (SGST/CGST)</span>
                       <span>{formatINR((data.sgst ?? 0) + (data.cgst ?? 0))}</span>
                   </div>
               </div>
               <div className="flex justify-between font-black text-lg">
                   <span>Total</span>
                   <span>{formatINR(data.totalAmount ?? 0)}</span>
               </div>
           </div>

           {/* Restaurant Summary */}
           <div className="glass-panel p-6 bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
               <h3 className="font-bold flex items-center gap-2 mb-4 text-orange-700 dark:text-orange-400">
                   <Store className="w-5 h-5" /> Restaurant Payout
               </h3>
               <div className="space-y-2 text-sm mb-4 border-b border-orange-100 dark:border-orange-900/30 pb-4">
                   <div className="flex justify-between">
                       <span className="text-slate-500">Food Cost</span>
                       <span>{formatINR(data.foodCost ?? 0)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Platform Fee Deduction</span>
                       <span className="text-rose-500">-{formatINR(data.restaurantPlatformFee ?? 0)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">Delivery Contribution</span>
                       <span className="text-rose-500">-{formatINR(data.restaurantDeliveryContribution ?? 0)}</span>
                   </div>
               </div>
               <div className="flex justify-between font-black text-lg">
                   <span>Net Payout</span>
                   <span className="text-emerald-600">{formatINR(data.restaurantPayout ?? 0)}</span>
               </div>
           </div>

           {/* Rider Summary */}
           <div className="glass-panel p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
               <h3 className="font-bold flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
                   <Bike className="w-5 h-5" /> Rider Payout
               </h3>
               <div className="space-y-2 text-sm mb-4 border-b border-emerald-100 dark:border-emerald-900/30 pb-4">
                   <div className="flex justify-between">
                       <span className="text-slate-500">Base Payout (Gross)</span>
                       <span>{formatINR(data.driverGrossPayout ?? 0)}</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-500">TDS Deduction</span>
                       <span className="text-rose-500">-{formatINR(data.driverTaxes ?? 0)}</span>
                   </div>
                   {!!data.platformBonus && (
                       <div className="flex justify-between">
                           <span className="text-slate-500">Platform Bonus</span>
                           <span className="text-emerald-500">+{formatINR(data.platformBonus)}</span>
                       </div>
                   )}
               </div>
               <div className="flex justify-between font-black text-lg">
                   <span>Net Payout</span>
                   <span className="text-emerald-600">{formatINR(data.driverNetPayout ?? 0)}</span>
               </div>
           </div>
       </div>

       {/* Ledger Lines */}
       <div className="glass-panel overflow-hidden mt-8">
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                   <Activity className="w-4 h-4" /> Ledger Trace
               </h3>
               <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono text-slate-600 dark:text-slate-400">
                   {data.ledgerLines?.length || 0} entries
               </span>
           </div>
           {data.ledgerLines && data.ledgerLines.length > 0 ? (
               <table className="w-full text-left text-sm">
                   <thead>
                       <tr className="bg-white dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-800">
                           <th className="p-3 font-semibold text-slate-500">ID</th>
                           <th className="p-3 font-semibold text-slate-500">Account</th>
                           <th className="p-3 font-semibold text-slate-500">Category</th>
                           <th className="p-3 font-semibold text-slate-500 text-right">Amount</th>
                           <th className="p-3 font-semibold text-slate-500">Date</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f111a]">
                       {data.ledgerLines.map((line: any) => (
                           <tr key={String(line.id)}>
                               <td className="p-3 font-mono text-xs text-slate-400" title={String(line.id)}>{String(line.id).substring(0,8)}</td>
                               <td className="p-3">
                                   <div className="font-medium text-slate-700 dark:text-slate-300">{String(line.ownerType)}</div>
                                   <div className="text-xs text-slate-500 font-mono">{String(line.ownerId).substring(0,8)}...</div>
                               </td>
                               <td className="p-3">
                                   <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{line.category}</span>
                               </td>
                               <td className={`p-3 text-right font-medium ${line.direction === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                   {line.direction === 'CREDIT' ? '+' : '-'}{formatINR(line.amount ?? 0)}
                               </td>
                               <td className="p-3 text-xs text-slate-500">
                                   {new Date(line.createdAt || '').toLocaleString()}
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           ) : (
               <div className="p-8 text-center text-slate-500">No ledger entries found for this order.</div>
           )}
       </div>
    </div>
  );
}
