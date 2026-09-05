import { Order } from "@/types";
import { DeliveryOrderDetailsModal } from "@features/delivery-tasks/components/DeliveryOrderDetailsModal";
import { ArrowLeft, Check, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { formatINR } from '@shared/money';

interface DeliveryHistoryPanelProps {
  setShowHistory: (show: boolean) => void;
  historyDateFilter: string;
  setHistoryDateFilter: (date: string) => void;
  setHistoryPage: React.Dispatch<React.SetStateAction<number>>;
  historyPage: number;
  totalHistoryPages: number;
  paginatedHistoryJobs: Order[];
}

export function DeliveryHistoryPanel({
  setShowHistory,
  historyDateFilter,
  setHistoryDateFilter,
  setHistoryPage,
  historyPage,
  totalHistoryPages,
  paginatedHistoryJobs
}: DeliveryHistoryPanelProps) {
  const [selectedJob, setSelectedJob] = useState<Order | null>(null);

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 flex-1 flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h4 className="font-bold text-lg text-slate-800 dark:text-[#f0ede6] flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Completed Deliveries</h4>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={historyDateFilter}
            onChange={(e) => { setHistoryDateFilter(e.target.value); setHistoryPage(1); }}
            className="px-3 py-1.5 text-xs rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-white/20 dark:bg-slate-950/45 text-slate-800 dark:text-[#f0ede6] font-mono outline-none"
          />
          {historyDateFilter && (
            <button onClick={() => { setHistoryDateFilter(""); setHistoryPage(1); }} className="text-[10px] text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:text-slate-300 underline">Clear</button>
          )}
        </div>
      </div>
      <div className="space-y-4 overflow-y-auto">
        {paginatedHistoryJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-300 border border-dashed border-rose-500/30 dark:border-rose-500/30 rounded-3xl space-y-2.5 bg-white/20 dark:bg-slate-900/45">
            <Clock className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-300 opacity-50" />
            <p className="text-sm font-semibold">No completed deliveries found.</p>
            <p className="text-xs text-slate-500 dark:text-slate-300">Try selecting a different date.</p>
          </div>
        ) : (
          paginatedHistoryJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => setSelectedJob(job)}
              className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm flex flex-col gap-3 transition-all hover:border-indigo-500/30 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs text-slate-400 dark:text-slate-300 font-bold">ORDER #{job.id.substring(0, 8)}</p>
                  <p className="font-black text-slate-900 dark:text-[#f0ede6] mt-1">{job.restaurantName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{job.createdAt ? new Date(job.createdAt).toLocaleString() : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-500 text-lg">+{formatINR(job.payout)}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-300 font-mono uppercase">Payout</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-rose-500/20 dark:border-rose-500/30 text-xs text-slate-500 dark:text-slate-300">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.deliveryAddress}</div>
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold"><Check className="w-3.5 h-3.5" /> Delivered</div>
              </div>
            </div>
          ))
        )}
        {totalHistoryPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4 pb-2">
            <button 
              disabled={historyPage === 1}
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-300">Page {historyPage} of {totalHistoryPages}</span>
            <button 
              disabled={historyPage === totalHistoryPages}
              onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <DeliveryOrderDetailsModal 
        order={selectedJob} 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </motion.div>
  );
}
