import { AnimatePresence } from 'motion/react';
import { ScreenTransition } from '@shared/ui';
import React from 'react';
import { DeliveryStatus } from '@/types';
import { CustomerMenuView } from '@features/catalog/components/customer/CustomerMenuView';
import { CustomerRestaurantBrowser } from '@features/catalog/components/customer/CustomerRestaurantBrowser';
import { CustomerFreeDeliveryTracker } from '@features/customer-orders/components/CustomerFreeDeliveryTracker';
import { OrderDeliveredSummary } from './OrderDeliveredSummary';
import { CustomerOrderTracker } from '@features/customer-orders/components/CustomerOrderTracker';
import { isActiveOrder, isFailedOrder } from '@features/customer-orders/model/orderStatus';
import { getFriendlyStatusMessage } from '@features/customer-orders/model/statusMessaging';
import { CustomerSettingsScreen } from '@features/customer-orders/components/CustomerSettingsScreen';
import { ErrorBoundary } from '@shared/ui';

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
  restaurantsError,
  retryRestaurants,
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
  chatWidgetRef,
}: Props) {
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
    // No mode="wait": it holds the next screen until the previous one's exit reports done, and
    // one unreported exit wedged the restaurant tabs (3b5de61). The menu branch is also a
    // fragment, which AnimatePresence cannot track an exit for at all.
    <AnimatePresence initial={false}>
      {currentTrackingOrder ? (
        currentTrackingOrder.deliveryStatus === DeliveryStatus.DELIVERED ? (
          <OrderDeliveredSummary
            key="panel-summary"
            order={currentTrackingOrder}
            onBack={() => setTrackingOrder(null)}
            chatWidgetRef={chatWidgetRef}
          />
        ) : (
          /* ------------------- TRACKING SCREEN ------------------- */
          <CustomerOrderTracker
            key="panel-tracking"
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
        <React.Fragment key="panel-menu">
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
        </React.Fragment>
      ) : (
        /* ------------------- MAIN RESTAURANT FEED ------------------- */
        <ErrorBoundary key="panel-feed" fallbackLabel="Restaurant Feed">
          <CustomerRestaurantBrowser
            restaurants={restaurants}
            isRestaurantsLoading={isRestaurantsLoading}
            loadFailed={!!restaurantsError}
            onRetry={retryRestaurants}
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
