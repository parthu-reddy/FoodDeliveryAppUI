import { Surface } from '@shared/ui';
import { Order } from "@/types";
import { EmptyState } from "@shared/ui";
import { Map as MapIcon, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import { formatINR } from '@shared/money';

interface DeliveryAvailableJobsProps {
  availableJobs: Order[];
  handleAcceptJob: (job: Order) => void;
}

export function DeliveryAvailableJobs({
  availableJobs,
  handleAcceptJob
}: DeliveryAvailableJobsProps) {
  const presets = useMotionPresets();
  return (
    <motion.div
      key="jobs-board" {...presets.fade}
      className="p-5 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm tracking-wide text-slate-400 dark:text-slate-300 uppercase font-mono">Trips available</h4>
        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold font-mono">AUTO SCANNING</span>
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
            <Surface radius="xl" elevation={1} className="p-5 space-y-4" key={job.id}>
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-300">ORDER CONTRACT #{job.id.substring(0, 8)}</span>
                  <h5 className="font-black text-slate-900 dark:text-[#f0ede6]">{job.restaurantName}</h5>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 dark:text-slate-300 block font-mono">PAYOUT</span>
                  <span className="text-lg font-black text-amber-500">{job.deliveryFee ? formatINR(job.deliveryFee) : '—'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-500 dark:text-slate-300">
                <p>📍 Pickup: Sector 62 Food Lane</p>
                <p>🏠 Dropoff: {job.deliveryAddress}</p>
                <p>📦 Package: {(job.items || []).length} items • Prepaid</p>
              </div>

              <button
                onClick={() => handleAcceptJob(job)}
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-rose-500/30"
              >
                <Play className="w-4 h-4 fill-current" /> Accept & Open Map
              </button>
            </Surface>
          ))}
        </div>
      )}
    </motion.div>
  );
}
