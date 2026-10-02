import { Button, Modal, Surface, SwipeAction } from '@shared/ui';
import { DeliveryStatus, Order } from "@/types";
import ActiveDeliveryCard from "@features/delivery-tasks/components/ActiveDeliveryCard";
import OrderTrackingMap from "@features/maps-tracking/components/OrderTrackingMap";
import { KeyRound, MapPin, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React from 'react';
import { formatINR } from '@shared/money';

interface DeliveryActiveJobProps {
  currentJob: Order;
  enteredPickupOtp: string;
  setEnteredPickupOtp: (otp: string) => void;
  pickupOtpError: string;
  isUpdatingPickup: boolean;
  handleArrivedAtRestaurant: () => void;
  handlePickUpFood: (e?: React.FormEvent) => Promise<void>;
  handleAbortJob: () => void;
  handleCompleteDelivery: (e?: React.FormEvent) => Promise<void>;
  enteredOtp: string;
  setEnteredOtp: (otp: string) => void;
  otpError: string;
  isUpdatingDelivery: boolean;
  goOfflineAfter: boolean;
  setGoOfflineAfter: (goOffline: boolean) => void;
  waitTimerSeconds: number;
  handleCustomerUnavailable: () => void;
}

export function DeliveryActiveJob({
  currentJob,
  enteredPickupOtp,
  setEnteredPickupOtp,
  pickupOtpError,
  isUpdatingPickup,
  handleArrivedAtRestaurant,
  handlePickUpFood,
  handleAbortJob,
  handleCompleteDelivery,
  enteredOtp,
  setEnteredOtp,
  otpError,
  isUpdatingDelivery,
  goOfflineAfter,
  setGoOfflineAfter,
  waitTimerSeconds,
  handleCustomerUnavailable
}: DeliveryActiveJobProps) {
  // Bind disclosure to the exact active resource. Selecting another job cannot retain its dialog.
  const [detailsOrderId, setDetailsOrderId] = React.useState<string | null>(null);
  if (detailsOrderId !== null && detailsOrderId !== currentJob.id) setDetailsOrderId(null);
  const canConfirmDelivery = !isUpdatingDelivery;
  const presets = useMotionPresets();
  return (
    <motion.div
      key="active-job" {...presets.rise}
      className="p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-lg flex items-center gap-1.5 text-amber-500">
          <Navigation className="w-5 h-5" /> Active Contract
        </h4>
        {/* The full id stays in the DOM (the E2E suite reads it); the pill truncates it so a
            36-character UUID no longer overflows a 390 px screen. */}
        <span className="text-xs font-mono px-2 py-0.5 rounded truncate max-w-[9rem]" title={currentJob.id} style={{ background: 'var(--color-paper-sunken)', color: 'var(--color-ink-2)' }}>#{currentJob.id}</span>
      </div>

      <Button variant="secondary" size="touch" onClick={() => setDetailsOrderId(currentJob.id)}>
        View order details
      </Button>
      <Modal
        open={detailsOrderId === currentJob.id}
        onClose={() => setDetailsOrderId(null)}
        title={`Order #${currentJob.id.substring(0, 8)}`}
        size="lg"
      >
        <div className="space-y-4 p-4">
          <p className="text-sm font-semibold">{currentJob.restaurantName}</p>
          <p className="text-sm">{currentJob.customerName || 'Customer'}</p>
          <p className="text-sm">{currentJob.deliveryAddress}</p>
          <h5 className="font-bold">Order items</h5>
          {currentJob.items?.length ? (
            <ul aria-label="Order items" className="space-y-2">
              {currentJob.items.map((item, index) => (
                <li key={item.id || index} className="flex justify-between gap-3 text-sm">
                  <span>{item.quantity} × {item.name}</span>
                  <span>{formatINR(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : <p role="status">Order items unavailable</p>}
          <div className="flex justify-between gap-3 font-bold">
            <span>Order total</span><span>{formatINR(currentJob.totalAmount)}</span>
          </div>
          <Button fullWidth size="touch" onClick={() => setDetailsOrderId(null)}>Close</Button>
        </div>
      </Modal>

      {/* Map Integration */}
      <div className="relative w-full h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl mb-6 overflow-hidden border border-slate-200 dark:border-slate-700/50">
        <OrderTrackingMap order={currentJob} viewerIsRider />
        <Surface radius="md" elevation={1} className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3 h-3 text-rose-500" />
          Tap markers for Google Maps
        </Surface>
      </div>

      <ActiveDeliveryCard
        currentJob={currentJob}
        enteredPickupOtp={enteredPickupOtp}
        setEnteredPickupOtp={setEnteredPickupOtp}
        pickupOtpError={pickupOtpError}
        isUpdatingPickup={isUpdatingPickup}
        handleArrivedAtRestaurant={handleArrivedAtRestaurant}
        handlePickUpFood={handlePickUpFood}
      />

      {/* State Transition Actions */}
      {(!currentJob.deliveryStatus || currentJob.deliveryStatus === DeliveryStatus.ASSIGNED || currentJob.deliveryStatus === DeliveryStatus.AT_RESTAURANT) ? (
        <div className="space-y-4 pt-2">
          <div className="pt-2 text-center">
              <button 
                type="button"
                onClick={handleAbortJob}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Abort Delivery (Emergency)
              </button>
            </div>
          </div>
        ) : (
          /* OTP Verification form to complete order */
          <form onSubmit={handleCompleteDelivery} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" /> SECURE CUSTOMER VERIFICATION OTP
              </label>
              <Surface radius="lg" elevation={0} className="flex overflow-hidden focus-within:border-amber-500 transition-colors">
                <input
                  type="text"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ask customer for 6-digit OTP"
                  className="flex-1 px-4 py-3 bg-transparent text-slate-800 dark:text-[#f0ede6] outline-none font-mono text-center tracking-[.3em] text-xl placeholder:text-sm placeholder:tracking-normal placeholder-slate-400"
                  required
                />
              </Surface>
            </div>

            {otpError && (
              <div className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                {otpError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="goOfflineAfter" 
                checked={goOfflineAfter}
                onChange={(e) => setGoOfflineAfter(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="goOfflineAfter" className="text-xs font-medium text-slate-400 dark:text-slate-300 cursor-pointer">
                Go offline after delivery
              </label>
            </div>

            <SwipeAction
              label={`Slide to deliver${currentJob?.deliveryFee ? ` · credit ${formatINR(currentJob.deliveryFee)}` : ''}`}
              confirmingLabel="Confirming…"
              disabled={!canConfirmDelivery}
              onConfirm={() => handleCompleteDelivery()}
            />

            {waitTimerSeconds > 5 && (
              <div className="pt-3 text-center border-t border-slate-200 dark:border-slate-800 mt-4">
                <button 
                  type="button"
                  onClick={handleCustomerUnavailable}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Customer Unavailable (Mark Failed)
                </button>
              </div>
            )}
          </form>
        )}
    </motion.div>
  );
}
