import React from 'react';
import { Navigation, MapPin, KeyRound, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Order, DeliveryStatus } from '../../types';
import OrderTrackingMap from '../shared/OrderTrackingMap';
import ActiveDeliveryCard from './ActiveDeliveryCard';

interface DeliveryActiveJobProps {
  currentJob: Order;
  enteredPickupOtp: string;
  setEnteredPickupOtp: (otp: string) => void;
  pickupOtpError: string;
  isUpdatingPickup: boolean;
  handleArrivedAtRestaurant: () => void;
  handlePickUpFood: (e: React.FormEvent) => void;
  handleAbortJob: () => void;
  handleCompleteDelivery: (e: React.FormEvent) => void;
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
  return (
    <motion.div
      key="active-job"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-lg flex items-center gap-1.5 text-amber-500">
          <Navigation className="w-5 h-5 animate-spin" /> Active Contract
        </h4>
        <span className="text-xs font-mono bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded">#{currentJob.id}</span>
      </div>

      {/* Map Integration */}
      <div className="relative w-full h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl mb-6 overflow-hidden border border-slate-200 dark:border-slate-700/50">
        <OrderTrackingMap order={currentJob} />
        <div className="absolute top-2 right-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3 h-3 text-indigo-500" />
          Tap markers for Google Maps
        </div>
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
              <div className="flex bg-white/20 dark:bg-slate-950/20 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors">
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ask customer for 6-digit OTP"
                  className="flex-1 px-4 py-3 bg-transparent text-slate-800 dark:text-[#f0ede6] outline-none font-mono text-center tracking-widest text-sm placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {otpError && (
              <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {otpError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="goOfflineAfter" 
                checked={goOfflineAfter}
                onChange={(e) => setGoOfflineAfter(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="goOfflineAfter" className="text-xs font-medium text-slate-400 dark:text-slate-300 cursor-pointer">
                Go offline after delivery
              </label>
            </div>

            <button
              type="submit"
              disabled={isUpdatingDelivery}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15 disabled:opacity-70"
            >
              {isUpdatingDelivery ? "Confirming..." : <><CheckCircle className="w-5 h-5" /> Confirm Delivery {(currentJob as any)?.payout ? `& Credit $${(currentJob as any).payout.toFixed(2)}` : ''}</>}
            </button>

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
