import React from 'react';
import CustomerAddressSelectorModal from '@features/customer-orders/components/CustomerAddressSelectorModal';
import CustomerCartDrawer from '@features/customer-orders/components/CustomerCartDrawer';
import CustomerOutletSelectorModal from '@features/catalog/components/customer/CustomerOutletSelectorModal';
import CustomerCheckout from '@features/customer-orders/components/CustomerCheckout';
import { Button, Overlay, Surface } from '@shared/ui';
import { MapPinOff } from 'lucide-react';

/**
 * Every dialog the customer home can open: pick an address, pick an outlet, the cart, the
 * payment sheet, and the "we need your location" prompt.
 *
 * The long props list is the honest shape of this: they were 92 lines at the bottom of an
 * 887-line component and every one of them reads dashboard state. Grouping them here does not
 * reduce the coupling, but it does stop it being invisible — the list IS the coupling, stated.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

export function CustomerModalStack({
  address,
  brandOutlets,
  carts,
  checkoutRestaurantId,
  clearCart,
  deliveryAddressId,
  deliveryLat,
  deliveryLng,
  getCartTotal,
  globalError,
  handleCheckout,
  isAddressSelectorOpen,
  isCartOpen,
  isOutletSelectorOpen,
  isPaymentModalOpen,
  onAddApiLog,
  originalAddToCart,
  paymentStatus,
  processPaymentAndOrder,
  removeFromCart,
  savedAddresses,
  selectedRestaurant,
  setAddress,
  setDeliveryAddressId,
  setDeliveryLat,
  setDeliveryLng,
  setIsAddressModalOpen,
  setIsAddressSelectorOpen,
  setIsCartOpen,
  setIsOutletSelectorOpen,
  setIsPaymentModalOpen,
  setSelectedRestaurant,
  setShowLocationPrompt,
  setSettingsTab,
  setView,
  showLocationPrompt,
}: Props) {
  return (
    <>
  <CustomerAddressSelectorModal
    isOpen={isAddressSelectorOpen}
    onClose={() => setIsAddressSelectorOpen(false)}
    savedAddresses={savedAddresses as import('@/types').Address[]}
    address={address}
    setAddress={setAddress}
     
    setDeliveryLat={setDeliveryLat}
    setDeliveryLng={setDeliveryLng}
    setDeliveryAddressId={setDeliveryAddressId}
    currentAddressId={deliveryAddressId}
     
    setShowLocationPrompt={setShowLocationPrompt}
    carts={carts}
    clearCart={clearCart}
    onAddNewAddress={() => {
      setView('settings');
      setSettingsTab('addresses');
      setIsAddressModalOpen(true);
    }}
  />


  <CustomerOutletSelectorModal
    isOpen={isOutletSelectorOpen}
     
    onClose={() => setIsOutletSelectorOpen(false)}
    brandOutlets={brandOutlets}
    selectedRestaurant={selectedRestaurant}
    setSelectedRestaurant={setSelectedRestaurant}
    onAddApiLog={onAddApiLog}
    deliveryLat={deliveryLat ?? undefined}
    deliveryLng={deliveryLng ?? undefined}
    carts={carts}
    clearCart={clearCart}
  />

  <CustomerCartDrawer
    address={address}
    setAddress={setAddress}
    handleCheckout={handleCheckout}
    isCartOpen={isCartOpen}
    setIsCartOpen={setIsCartOpen}
    selectedRestaurant={selectedRestaurant}
    carts={carts}
    removeFromCart={removeFromCart}
    clearCart={clearCart}
    addToCart={originalAddToCart}
    getCartTotal={getCartTotal}
    setIsPaymentModalOpen={setIsPaymentModalOpen}
    isSubmitting={paymentStatus !== 'idle'}
    setIsAddressModalOpen={setIsAddressModalOpen}
    deliveryAddressId={deliveryAddressId}
  />

  <CustomerCheckout
    open={isPaymentModalOpen}
    onClose={() => setIsPaymentModalOpen(false)}
    status={paymentStatus}
    totals={getCartTotal(checkoutRestaurantId || '')}
    items={checkoutRestaurantId ? (carts[checkoutRestaurantId]?.items || []) : []}
    restaurantName={(checkoutRestaurantId && carts[checkoutRestaurantId]?.restaurant?.name) || 'Restaurant'}
    address={address}
    onChangeAddress={() => {
      setIsPaymentModalOpen(false);
      setIsAddressSelectorOpen(true);
    }}
    onPlaceOrder={processPaymentAndOrder}
    error={globalError}
  />

  <Overlay
    open={showLocationPrompt}
    onClose={() => setShowLocationPrompt(false)}
    label="Location required"
    className="w-full max-w-sm"
  >
        <Surface variant="glass-overlay" elevation={4} radius="xl" className="p-6 w-full text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPinOff className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Location Required</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Please enable location permissions in your browser settings to automatically find your address.
          </p>
          <Button
            onClick={() => setShowLocationPrompt(false)}
            variant="primary"
            fullWidth
          >
            Understood
          </Button>
        </Surface>
  </Overlay>
    </>
  );
}
