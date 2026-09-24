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
                // 48 px: the rider is outdoors, one-handed, often moving (Phase 4 plan). These
                // were 28 px amber circles.
                <Button
                  variant="secondary"
                  size="touch-icon"
                  aria-label={`Call ${currentJob.restaurantName || 'the restaurant'}`}
                  onClick={() => startCall(currentJob.restaurantId!, currentJob.id)}
                  icon={<PhoneCall className="w-5 h-5" />}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">B</div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block font-mono">DELIVERY ADDRESS</span>
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-slate-800 dark:text-[#f0ede6]">{currentJob.customerName || 'Customer'}</span>
              {currentJob.customerId && (
                <Button
                  variant="primary"
                  size="touch-icon"
                  aria-label={`Call ${currentJob.customerName || 'the customer'}`}
                  onClick={() => startCall(currentJob.customerId!, currentJob.id)}
                  icon={<PhoneCall className="w-5 h-5" />}
                />
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
                {/* Plain text, not password: the rider copies a code the kitchen reads out, and
                    masking it only adds typos (and wakes password managers). */}
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={enteredPickupOtp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnteredPickupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit pickup OTP"
                  className="flex-1 px-4 py-3 outline-none font-mono text-center tracking-[.3em] text-xl"
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
