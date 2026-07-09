
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MapPin } from 'lucide-react';

export default function CustomerAddressModal({
  isAddressModalOpen,
  setIsAddressModalOpen,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  onAddApiLog
}: any) {
  return (
    <>
      {/* ------------------- ADDRESS MODAL ------------------- */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddressModalOpen(false)}
              className="fixed inset-0 bg-black z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:-translate-y-1/2 max-w-[412px] mx-auto bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 z-[60] shadow-2xl flex flex-col h-auto max-h-auto max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center shrink-0 mb-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-[#f0ede6]">Delivery Location</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Set your precise location for faster delivery</p>
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-y-auto overscroll-none overflow-x-hidden min-h-0 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search for area, street name..."
                    value={addressSearchQuery}
                    onChange={e => {
                      setAddressSearchQuery(e.target.value);
                      if (e.target.value.length > 2 && onAddApiLog) {
                        onAddApiLog({ id: 'autocomplete', label: `GET /api/v1/places/autocomplete?q=${e.target.value}`, method: 'GET' });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-medium cursor-not-allowed bg-slate-100 dark:bg-slate-800/50"
                  />
                </div>

                {/* Simulated Map / Pin Drop */}
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-rose-500/20 dark:border-rose-500/30 shrink-0">
                  <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl mb-4">
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 inset-x-0 mx-auto w-fit bg-white/90 dark:bg-slate-900/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full shadow-sm text-slate-700 dark:text-[#f0ede6]">
                    Drag map to move pin
                  </div>
                </div>

                {/* Current Address Details */}
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Selected Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-rose-500/20 dark:border-rose-500/30 rounded-xl p-3 text-sm font-medium cursor-not-allowed bg-slate-100 dark:bg-slate-800 resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    if (onAddApiLog) {
                      onAddApiLog({ id: 'reverse_geocode', label: 'GET /api/v1/places/reverse-geocode?lat=...&lng=...', method: 'GET' });
                      onAddApiLog({ id: 'save_address', label: 'POST /api/v1/customers/addresses', method: 'POST' });
                    }
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-opacity mt-auto"
                >
                  Confirm Location
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
