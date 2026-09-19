import { DeliveryStatus, Order } from "@/types";
import { KeyRound, PhoneCall } from 'lucide-react';
import { useCallContext } from '@/contexts/CallContext';
import React, { useRef } from 'react';
import { Button, Input, Surface, SwipeAction } from '@shared/ui';

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
  const pickupFormRef = useRef<HTMLFormElement>(null);
  const { startCall } = useCallContext();

  return (
    <Surface elevation={2} radius="lg" className="rounded-2xl p-5 space-y-4">
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
                  className="p-1.5 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 transition-colors"
                  title={`Call ${currentJob.restaurantName}`}
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">B</div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block font-mono">DELIVERY ADDRESS</span>
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-slate-800 dark:text-[#f0ede6]">Customer</span>
              {currentJob.customerId && (
                <button
                  type="button"
                  onClick={() => startCall(currentJob.customerId!, currentJob.id)}
                  className="p-1.5 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 transition-colors"
                  title={`Call Customer`}
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
            <Button variant="secondary" size="touch" fullWidth onClick={handleArrivedAtRestaurant}>
              Mark Arrived at Restaurant
            </Button>
          )}
          <form ref={pickupFormRef} onSubmit={handlePickUpFood} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" /> RESTAURANT HANDOVER OTP
              </label>
              <div className="flex rounded-2xl overflow-hidden">
                <Input
                  type="password"
                  value={enteredPickupOtp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnteredPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit pickup OTP"
                  className="flex-1 px-4 py-3 outline-none font-mono text-center tracking-widest text-sm"
                  required
                />
              </div>
              {pickupOtpError && <p className="text-xs text-rose-500 font-bold mt-1 text-center">{pickupOtpError}</p>}
            </div>
            <SwipeAction
              label="Slide to confirm pickup"
              confirmingLabel="Confirming pickup…"
              disabled={isUpdatingPickup}
              onConfirm={() => pickupFormRef.current?.requestSubmit()}
            />
          </form>
        </div>
      ) : (
        <div className="pt-2 text-amber-500 font-bold text-center">Package Picked Up</div>
      )}
    </Surface>
  );
}
