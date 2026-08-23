import { Order } from "@/types";
import { EmptyState } from "@shared/ui";
import { Map as MapIcon, Play } from 'lucide-react';
import { motion } from 'motion/react';

interface DeliveryAvailableJobsProps {
  availableJobs: Order[];
  handleAcceptJob: (job: Order) => void;
}

export function DeliveryAvailableJobs({
  availableJobs,
  handleAcceptJob
}: DeliveryAvailableJobsProps) {
  return (
    <motion.div
      key="jobs-board"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm tracking-wide text-slate-400 dark:text-slate-300 uppercase font-mono">Trips available</h4>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold font-mono">AUTO SCANNING</span>
      </div>

      {availableJobs.length === 0 ? (
        <EmptyState 
          title="Scanning for dispatched contracts..."
          description="Waiting for new delivery requests in your area. Keep your status Online to receive dispatch pings."
          icon={<MapIcon className="w-12 h-12 text-slate-500 dark:text-slate-300 animate-pulse" />}
        />
      ) : (
        <div className="space-y-4">
          {availableJobs.map(job => (
            <div 
              key={job.id} 
              className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-300">ORDER CONTRACT #{job.id.substring(0, 8)}</span>
                  <h5 className="font-black text-slate-900 dark:text-[#f0ede6]">{job.restaurantName}</h5>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 dark:text-slate-300 block font-mono">PAYOUT</span>
                  <span className="text-lg font-black text-emerald-500">₹{job.payout ? job.payout.toFixed(2) : '—'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-500 dark:text-slate-300">
                <p>📍 Pickup: Sector 62 Food Lane</p>
                <p>🏠 Dropoff: {job.deliveryAddress}</p>
                <p>📦 Package: {(job.items || []).length} items • Cash on Delivery</p>
              </div>

              <button
                onClick={() => handleAcceptJob(job)}
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 border border-rose-500/30"
              >
                <Play className="w-4 h-4 fill-current" /> Accept & Open Map
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
