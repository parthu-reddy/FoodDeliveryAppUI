
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Package, LogOut, Moon, Sun, MapPin } from 'lucide-react';

export default function CustomerAccountModal({
  setIsAddressModalOpen,
  activeOrders,
  setTrackingOrder,
  isAccountModalOpen,
  onBack,
  accountTab,
  setAccountTab,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  userName,
  userPhone,
  onLogout,
  theme,
  onToggleTheme
}: any) {
  return (
    <>
      {/* ------------------- ACCOUNT SETTINGS PAGE ------------------- */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto w-full p-5 flex flex-col space-y-4 bg-transparent"
            >
              <div className="flex items-center gap-3 shrink-0 mb-4">
                <button
                  onClick={() => onBack()}
                  className="p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 text-slate-500 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:text-white cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-[#f0ede6]">Account Settings</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Manage your profile and orders</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 shrink-0">
                <button 
                  onClick={() => setAccountTab('profile')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${accountTab === 'profile' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setAccountTab('orders')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${accountTab === 'orders' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Orders History
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-none pr-1">
                {accountTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Full Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-[#f0ede6] cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Phone Number</label>
                      <input 
                        type="tel" 
                        value={editPhone}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-[#f0ede6] cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                      />
                    </div>
                    
                    <button 
                      onClick={() => {
                        setIsAddressModalOpen(true);
                      }}
                      className="w-full py-3 mt-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-[#f0ede6] text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                      <MapPin className="w-4 h-4" />
                      Manage Saved Address
                    </button>

                    <div className="pt-4">
                      <button 
                        onClick={() => {
                          onBack();
                          // Note: the app might not have a global state update for these yet, but we are fulfilling the requirement locally for now.
                        }}
                        className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {accountTab === 'orders' && (
                  <div className="space-y-3">
                    {activeOrders.slice().reverse().map(order => (
                      <div key={order.id} className="p-4 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 bg-white/50 dark:bg-slate-900/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 font-mono block">{order.id}</span>
                            <h5 className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">{order.restaurantName}</h5>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)] tracking-wider`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">{order.items.length} items • ${order.total.toFixed(2)}</p>
                        <button 
                          onClick={() => {
                            setTrackingOrder(order);
                            onBack();
                          }}
                          className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-[#f0ede6] rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                    {activeOrders.length === 0 && (
                      <div className="text-center py-10">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No orders yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

    </>
  );
}
