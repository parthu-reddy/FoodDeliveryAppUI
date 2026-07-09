import re

with open('src/components/CustomerDashboard.tsx', 'r') as f:
    content = f.read()

# We need to replace everything from 
# {currentTrackingOrder && activeOrders.some(o => o.id === currentTrackingOrder.id) ? (
# to 
#           </motion.div>
#         ) : selectedRestaurant ? (

start_marker = "{currentTrackingOrder && activeOrders.some(o => o.id === currentTrackingOrder.id) ? ("
end_marker = "        ) : selectedRestaurant ? ("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_block = """{currentTrackingOrder && activeOrders.some(o => o.id === currentTrackingOrder.id) ? (
          currentTrackingOrder.status === 'delivered' ? (
            /* ------------------- DELIVERED SUMMARY SCREEN ------------------- */
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-5 space-y-5"
            >
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:text-[#f0ede6] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Order Summary
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">#{currentTrackingOrder.id}</span>
                </h3>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">Order Delivered! 🎉</h4>
                <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">
                  Enjoy your food from {currentTrackingOrder.restaurantName}.
                </p>
              </div>

              <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-rose-500/10">
                  <span className="font-bold text-slate-800 dark:text-[#f0ede6]">Digital Invoice</span>
                  <span className="text-xs font-mono text-slate-500">#{currentTrackingOrder.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="space-y-3 mb-6">
                  {currentTrackingOrder.items.map(item => (
                    <div key={item.item.id} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>{item.quantity}x {item.item.name}</span>
                      <span>${(item.item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>Delivery Fee</span>
                    <span>${currentTrackingOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2">
                    <span>Total Paid</span>
                    <span>${currentTrackingOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => alert('Invoice downloaded successfully!')}
                  className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-700 dark:hover:bg-slate-100 shadow-md active:scale-[0.98] cursor-pointer text-sm"
                >
                  <Package className="w-5 h-5" /> Download PDF Invoice
                </button>
              </div>
            </motion.div>
          ) : (
            /* ------------------- TRACKING SCREEN ------------------- */
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-5 space-y-5"
            >
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:text-[#f0ede6] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Order Tracking
                  {activeOrders.filter(o => o.status !== 'delivered').length > 1 ? (
                    <select
                      className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-semibold hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] dark:hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:border-rose-500/50 transition-all"
                      value={currentTrackingOrder.id}
                      onChange={(e) => {
                        const order = activeOrders.find((o) => o.id === e.target.value);
                        if (order) setTrackingOrder(order);
                      }}
                    >
                      {activeOrders.filter(o => o.status !== 'delivered').map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.id} - {o.status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">#{currentTrackingOrder.id}</span>
                  )}
                </h3>
              </div>

              {/* Immersive Delivery map (Vector path simulation) */}
              <div className="relative w-full h-44 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-3xl overflow-hidden shadow-inner">
                {/* Grids and elements resembling maps */}
                <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                
                {/* SSE Live Tracking Indicator */}
                {(currentTrackingOrder.status === 'dispatched' || currentTrackingOrder.status === 'picked_up') && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full backdrop-blur-md z-10 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold font-mono tracking-wider">LIVE GPS (SSE)</span>
                  </div>
                )}

                {/* Animated Map Line/Road */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path 
                    d="M 15 50 Q 50 20 85 50" 
                    fill="none" 
                    stroke="#334155" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                  />
                  <path 
                    d="M 15 50 Q 50 20 85 50" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    strokeDasharray="100"
                    strokeDashoffset={100 - getDeliveryProgress(currentTrackingOrder.status)}
                    className="transition-all duration-1000 ease-in-out"
                  />
                </svg>

                {/* Restaurant Node */}
                <div className="absolute left-[15%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-amber-500 flex items-center justify-center shadow-lg">
                    <Store className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-[9px] font-bold mt-1 max-w-[80px] text-center truncate">{currentTrackingOrder.restaurantName}</span>
                </div>

                {/* Customer Node */}
                <div className="absolute right-[15%] top-[50%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shadow-lg">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-[9px] font-bold mt-1">Your Home</span>
                </div>

                {/* Moving Rider on Path */}
                <div 
                  className="absolute transition-all duration-1000 ease-in-out flex flex-col items-center"
                  style={{
                    left: `${15 + (70 * getDeliveryProgress(currentTrackingOrder.status)) / 100}%`,
                    top: `${50 - Math.sin((getDeliveryProgress(currentTrackingOrder.status) / 100) * Math.PI) * 20}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="bg-amber-500 text-slate-950 p-2 rounded-full shadow-lg ring-4 ring-amber-500/20 animate-bounce">
                    <Bike className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] bg-slate-950 text-amber-400 font-mono px-1 rounded border border-rose-500/30 mt-1">Rider</span>
                </div>
              </div>

              {/* Active Status Display Card */}
              <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-rose-500/20 dark:border-rose-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(251,146,60,0.05)] space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">
                      {currentTrackingOrder.status === 'placed' && 'Waiting for Restaurant...'}
                      {currentTrackingOrder.status === 'on_hold' && 'Restaurant Requested Delay'}
                      {currentTrackingOrder.status === 'accepted' && 'Order Confirmed!'}
                      {currentTrackingOrder.status === 'preparing' && 'Kitchen is Cooking...'}
                      {currentTrackingOrder.status === 'dispatched' && 'Waiting for Rider Pickup...'}
                      {currentTrackingOrder.status === 'picked_up' && 'Rider is on the Way!'}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-300">
                      {currentTrackingOrder.status === 'on_hold' 
                        ? 'The restaurant is experiencing high volume and needs more time. Do you wish to continue?'
                        : 'Estimated delivery: 15-20 mins'}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-2xl">
                    {currentTrackingOrder.status === 'on_hold' ? <Clock className="w-5 h-5 text-red-500" /> : <Timer className="w-5 h-5" />}
                  </div>
                </div>

                {currentTrackingOrder.status === 'on_hold' && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        if (onAddApiLog) {
                          onAddApiLog({ id: 'order_approve_delay', label: `POST /api/v1/orders/${currentTrackingOrder.id}/delay/approve`, method: 'POST' });
                        }
                        if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, 'accepted');
                      }}
                      className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                    >
                      Approve Delay
                    </button>
                    <button
                      onClick={() => {
                        if (onAddApiLog) {
                          onAddApiLog({ id: 'order_cancel', label: `POST /api/v1/orders/${currentTrackingOrder.id}/cancel`, method: 'POST' });
                        }
                        if (onUpdateOrder) onUpdateOrder(currentTrackingOrder.id, 'cancelled'); setTrackingOrder(null);
                      }}
                      className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-[#f0ede6] rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors border border-rose-500/30 dark:border-rose-500/30"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {/* OTP Code Card */}
                {currentTrackingOrder.status !== 'on_hold' && (
                  <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] font-bold block uppercase font-mono tracking-wider">Secure Delivery Verification</span>
                      <span className="text-sm font-semibold">Share OTP with Rider at delivery</span>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono text-xl font-black px-4 py-2 rounded-xl tracking-wider shadow-md">
                      {currentTrackingOrder.otp}
                    </div>
                  </div>
                )}

                {/* Step checklist */}
                <div className="space-y-3 pt-2">
                  {[
                    { status: 'placed', label: 'Order Received' },
                    { status: 'accepted', label: 'Accepted by Kitchen' },
                    { status: 'preparing', label: 'Cooking & Packaging' },
                    { status: 'picked_up', label: 'Picked up by Delivery Executive' },
                    { status: 'delivered', label: 'Handed Over & Verified' },
                  ].map((step, idx) => {
                    const isDone = getStatusIndex(currentTrackingOrder.status) >= getStatusIndex(step.status as OrderStatus);
                    const isCurrent = currentTrackingOrder.status === step.status;
                    
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                            : 'border-rose-500/30 dark:border-rose-500/30 text-slate-400 dark:text-slate-300'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className={`text-sm ${isDone ? 'font-semibold text-slate-800 dark:text-[#f0ede6]' : 'text-slate-400 dark:text-slate-300'} ${isCurrent ? 'text-amber-500 font-bold' : ''}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick action / note */}
              <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-center">
                <p className="text-xs text-amber-500 leading-relaxed">
                  👉 <strong>How to complete?</strong> You can switch roles from the top menu, navigate to the <strong>Restaurant View</strong> to accept/cook, then to the <strong>Delivery Partner View</strong> to navigate and insert the OTP!
                </p>
              </div>
            </motion.div>
          )
"""

with open('src/components/CustomerDashboard.tsx', 'w') as f:
    f.write(content[:start_idx] + new_block + content[end_idx:])

print("Successfully rewrote tracking and summary branch.")
