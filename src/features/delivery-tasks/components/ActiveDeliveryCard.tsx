import { DeliveryStatus, Order } from "@/types";
import { KeyRound, PhoneCall } from 'lucide-react';
import { useCallContext } from '@/contexts/CallContext';
import React from 'react';

interface ActiveDeliveryCardProps {
  currentJob: Order;
  enteredPickupOtp: string;
  setEnteredPickupOtp: (val: string) => void;
  pickupOtpError: string;
  isUpdatingPickup: boolean;
  handleArrivedAtRestaurant: () => void;
  handlePickUpFood: (e: React.FormEvent) => void;
}

export default function ActiveDeliveryCard({
  currentJob,
  enteredPickupOtp,
  setEnteredPickupOtp,
  pickupOtpError,
  isUpdatingPickup,
  handleArrivedAtRestaurant,
  handlePickUpFood
}: ActiveDeliveryCardProps) {
  const { startCall } = useCallContext();

  return (
    <div className="glass-card rounded-3xl p-5 space-y-4">
      <div className="space-y-1">
        <h5 className="font-bold text-sm text-slate-400 font-mono tracking-wider">NAVIGATIONAL STEPS</h5>
        <p className="text-base font-bold text-slate-900 dark:text-[#f0ede6]">
          {(!currentJob.deliveryStatus || currentJob.deliveryStatus === DeliveryStatus.ASSIGNED || currentJob.deliveryStatus === DeliveryStatus.AT_RESTAURANT) ? 'Step 1: Collect food packages' : 'Step 2: Deliver to door'}
        </p>
      </div>

      <div className="space-y-3.5 text-sm">
        <div className="flex gap-3">
          <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">A</div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block font-mono">RESTAURANT ADDRESS</span>
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{currentJob.restaurantName}</span>
              {currentJob.restaurantId && (
                <button
                  type="button"
                  onClick={() => startCall(currentJob.restaurantId!, currentJob.id)}
                  className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-400 transition-colors"
                  title={`Call ${currentJob.restaurantName}`}
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">B</div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block font-mono">DELIVERY ADDRESS</span>
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{currentJob.customerName}</span>
              {currentJob.customerId && (
                <button
                  type="button"
                  onClick={() => startCall(currentJob.customerId!, currentJob.id)}
                  className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-400 transition-colors"
                  title={`Call ${currentJob.customerName}`}
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">{currentJob.deliveryAddress}</p>
          </div>
        </div>
      </div>

      {(!currentJob.deliveryStatus || currentJob.deliveryStatus === DeliveryStatus.ASSIGNED || currentJob.deliveryStatus === DeliveryStatus.AT_RESTAURANT) ? (
        <div className="space-y-4 pt-2">
          {currentJob.deliveryStatus !== DeliveryStatus.AT_RESTAURANT && (
            <button
              type="button"
              onClick={handleArrivedAtRestaurant}
              className="w-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-3 rounded-2xl"
            >
              Mark Arrived at Restaurant
            </button>
          )}
          <form onSubmit={handlePickUpFood} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" /> RESTAURANT HANDOVER OTP
              </label>
              <div className="flex rounded-2xl overflow-hidden">
                <input
                  type="password"
                  value={enteredPickupOtp}
                  onChange={(e) => setEnteredPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit pickup OTP"
                  className="glass-input flex-1 px-4 py-3 outline-none font-mono text-center tracking-widest text-sm"
                  required
                />
              </div>
              {pickupOtpError && <p className="text-xs text-rose-500 font-bold mt-1 text-center">{pickupOtpError}</p>}
            </div>
            <button
              type="submit"
              disabled={isUpdatingPickup}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl shadow-[0_4px_16px_rgba(245,158,11,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPickup ? 'Confirming...' : 'Confirm Pickup'}
            </button>
          </form>
        </div>
      ) : (
        <div className="pt-2 text-emerald-500 font-bold text-center">Package Picked Up</div>
      )}
    </div>
  );
}
