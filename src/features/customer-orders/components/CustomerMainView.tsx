import { AnimatePresence, motion } from 'motion/react';
import { ScreenTransition, useMotionPresets } from '@shared/ui';
import React from 'react';
import { DeliveryStatus, OrderStatus } from '@/types';
import { CustomerMenuView } from '@features/catalog/components/customer/CustomerMenuView';
import { CustomerRestaurantBrowser } from '@features/catalog/components/customer/CustomerRestaurantBrowser';
import { CustomerFreeDeliveryTracker } from '@features/customer-orders/components/CustomerFreeDeliveryTracker';
import { CustomerOrderTracker } from '@features/customer-orders/components/CustomerOrderTracker';
import { isActiveOrder, isFailedOrder } from '@features/customer-orders/model/orderStatus';
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { CustomerSettingsScreen } from '@features/customer-orders/components/CustomerSettingsScreen';
import { formatINR } from '@shared/money';
import { ArrowLeft, Check, Package } from 'lucide-react';
import { Button, ErrorBoundary, Surface } from '@shared/ui';

/**
 * Whichever of the customer's three surfaces is showing: their account settings, the order
 * they are tracking, or the storefront they are browsing.
 *
 * 228 lines out of the middle of an 887-line dashboard. The three are mutually exclusive and
 * always were — the file just never said so in one place.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

export function CustomerMainView({
  activeOrders,
  addToCart,
  address,
  addressSearchQuery,
  brandOutlets,
  carts,
  currentTrackingOrder,
  deliveryAddressId,
  deliveryAvailabilityError,
  deliveryLat,
  deliveryLng,
  effectiveMenu,
  getCartTotal,
  handleDeleteAddress,
  isAddressModalOpen,
  isDeliveryAvailable,
  isMenuLoading,
  isQuoting,
  isRestaurantsLoading,
  onAddApiLog,
  onLogout,
  onUpdateOrder,
  quotes,
  refreshAddresses,
  removeFromCart,
  restaurants,
  savedAddresses,
  selectedRestaurant,
  setAddress,
  setAddressSearchQuery,
  setInternalOrders,
  setIsAddressModalOpen,
  setIsAddressSelectorOpen,
  setIsOutletSelectorOpen,
  setSelectedRestaurant,
  setTrackingOrder,
  setView,
  settingsTab,
  showError,
  theme,
  view,
  clearCart,
  setDeliveryLat,
  setDeliveryLng,
  categories,
  setGlobalError,
  chatWidgetRef,
}: Props) {
  const presets = useMotionPresets();
  return (
    <>
  <ScreenTransition screenKey={view === 'settings' ? 'settings' : 'home'}>
  {view === 'settings' ? (
    <CustomerSettingsScreen
      theme={theme}
      settingsTab={settingsTab}
      savedAddresses={savedAddresses}
      address={address}
      setAddress={setAddress}
      addressSearchQuery={addressSearchQuery}
      setAddressSearchQuery={setAddressSearchQuery}
      isAddressModalOpen={isAddressModalOpen}
      setIsAddressModalOpen={setIsAddressModalOpen}
      setIsAddressSelectorOpen={setIsAddressSelectorOpen}
      deliveryLat={deliveryLat}
      deliveryLng={deliveryLng}
      setDeliveryLat={setDeliveryLat}
      setDeliveryLng={setDeliveryLng}
      carts={carts}
      clearCart={clearCart}
      setView={setView}
      setTrackingOrder={setTrackingOrder}
      refreshAddresses={refreshAddresses}
      handleDeleteAddress={handleDeleteAddress}
      onAddApiLog={onAddApiLog}
      onLogout={onLogout}
    />
  ) : (
    <AnimatePresence mode="wait">
      {currentTrackingOrder ? (
        currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED ? (
          /* ------------------- DELIVERED SUMMARY SCREEN ------------------- */
          <motion.div
            key="summary" {...presets.rise}
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

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center space-y-2">
              <div className="w-16 h-16 bg-amber-500 rounded-full mx-auto flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-2xl text-amber-600 dark:text-amber-400">Order Delivered! 🎉</h4>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                Enjoy your food from {currentTrackingOrder.restaurantName}.
              </p>
            </div>

            <Surface radius="xl" elevation={0} className="p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-rose-500/10">
                <span className="font-bold text-slate-800 dark:text-[#f0ede6]">Digital Invoice</span>
                <span className="text-xs font-mono text-slate-500">#{currentTrackingOrder.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="space-y-3 mb-6">
                {currentTrackingOrder.items?.map((item: { item?: { id?: string, name?: string, price?: number }, name?: string, price?: number, quantity?: number }, idx: number) => (
                  <div key={item.item?.id || idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{item.quantity || 1}x {item.item?.name || item.name || 'Item'}</span>
                    <span>{formatINR(((item.item?.price || item.price || 0) * (item.quantity || 1)))}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span>Subtotal</span>
                  <span>{formatINR((currentTrackingOrder.itemTotal || 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>SGST (2.5%)</span>
                  <span>{formatINR((currentTrackingOrder.sgst || 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>CGST (2.5%)</span>
                  <span>{formatINR((currentTrackingOrder.cgst || 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Delivery Fee</span>
                  <span>{formatINR((currentTrackingOrder.deliveryFee || 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Platform Fee</span>
                  <span>{formatINR((currentTrackingOrder.customerPlatformFee || 0))}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-[#f0ede6] pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <span>Total Paid</span>
                  <span>{formatINR((currentTrackingOrder.totalAmount || 0))}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Payment Method</span>
                  <span className="uppercase font-medium">{currentTrackingOrder.paymentIntent ? 'Wallet / Card' : 'Credit Card'}</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  setGlobalError('Invoice downloaded successfully!');
                  setTimeout(() => setGlobalError(null), 3000);
                }}
                variant="secondary"
                fullWidth
                icon={<Package className="w-5 h-5" />}
              >
                Download PDF Invoice
              </Button>

              {/* Report Issue / Request Refund Button */}
              {currentTrackingOrder.status !== OrderStatus.CANCELLED && (
                <Button
                  onClick={() => {
                    chatWidgetRef.current?.openAndRequestRefundQuote();
                  }}
                  variant="outline"
                  className="text-rose-500 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-3"
                  fullWidth
                >
                  Report Issue / Request Refund
                </Button>
              )}
            </Surface>
          </motion.div>
        ) : (
          /* ------------------- TRACKING SCREEN ------------------- */
          <CustomerOrderTracker
            currentTrackingOrder={currentTrackingOrder}
             
            setTrackingOrder={setTrackingOrder}
            isActiveOrder={isActiveOrder}
            activeOrders={activeOrders}
            isFailedOrder={isFailedOrder}
            onAddApiLog={onAddApiLog}
            onUpdateOrder={onUpdateOrder}
            setInternalOrders={setInternalOrders}
            showError={showError}
             
            getFriendlyStatusMessage={getFriendlyStatusMessage}
          />
         
        )
      ) : selectedRestaurant ? (
        /* ------------------- RESTAURANT DETAIL & MENU ------------------- */
        <>
          <CustomerFreeDeliveryTracker
            carts={carts}
            getCartTotal={getCartTotal}
            deliveryPricing={((selectedRestaurant ? quotes[selectedRestaurant.id as string] : null))?.data as { total: number } || { total: 0 }}
            selectedRestaurantId={selectedRestaurant?.id}
            isQuoting={isQuoting}
          />
          <ErrorBoundary fallbackLabel="Menu View">
            <CustomerMenuView
              selectedRestaurant={selectedRestaurant}
              setSelectedRestaurant={setSelectedRestaurant}
              deliveryPricing={(() => {
                const q = selectedRestaurant ? quotes[selectedRestaurant.id as string] : null;
                if (!q) return null;
                return {
                  isDeliverable: q.isDeliverable,
                  error: q.error,
                  minAmountForFreeDelivery: q.data?.minAmountForFreeDelivery,
                  distanceKm: q.data?.distanceKm,
                  total: q.data?.total
                };
              })()}
              carts={carts}
              getCartTotal={getCartTotal}
              isDeliveryAvailable={isDeliveryAvailable}
              deliveryAvailabilityError={deliveryAvailabilityError}
              brandOutlets={brandOutlets}
              setIsOutletSelectorOpen={setIsOutletSelectorOpen}
               
              isMenuLoading={isMenuLoading}
              effectiveMenu={effectiveMenu}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              isQuoting={isQuoting}
              deliveryAddressId={deliveryAddressId}
              setIsAddressSelectorOpen={setIsAddressSelectorOpen}
            />
          </ErrorBoundary>
        </>
      ) : (
        /* ------------------- MAIN RESTAURANT FEED ------------------- */
        <ErrorBoundary fallbackLabel="Restaurant Feed">
          <CustomerRestaurantBrowser
            categories={categories}
            restaurants={restaurants}
            isRestaurantsLoading={isRestaurantsLoading}
            setIsAddressSelectorOpen={setIsAddressSelectorOpen}
            setSelectedRestaurant={setSelectedRestaurant}
            onAddApiLog={onAddApiLog}
          />
        </ErrorBoundary>
      )}
    </AnimatePresence>
  )}
  </ScreenTransition>
    </>
  );
}
