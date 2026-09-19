import type { Order } from '@/schemas/order';
import { getUserProfile } from '@/lib/tokenStore';
import { useConfirm } from '@shared/ui';
import SharedSettingsView from '@shared/ui/SharedSettingsView';

interface CustomerSettingsScreenProps {
  theme: 'light' | 'dark';
  settingsTab: 'profile' | 'history' | 'addresses' | 'wallet' | 'reviews';
  savedAddresses?: unknown[];
  address: string;
  setAddress: (a: string) => void;
  addressSearchQuery: string;
  setAddressSearchQuery: (q: string) => void;
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (open: boolean) => void;
  setIsAddressSelectorOpen: (open: boolean) => void;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  setDeliveryLat: (lat: number) => void;
  setDeliveryLng: (lng: number) => void;
  carts: Record<string, { items?: unknown[] }>;
  clearCart: (restaurantId: string) => void;
  setView: (view: 'home' | 'settings') => void;
  setTrackingOrder: (order: Order) => void;
  refreshAddresses: () => void;
  handleDeleteAddress: (id: string) => void;
  onAddApiLog?: (log: unknown) => void;
  onLogout: () => void;
}

/**
 * The customer's account settings, and the address change that can empty a cart.
 *
 * Split out of CustomerMainView. The interesting part is `onSelectDeliveryLocation`: changing
 * the address clears every cart, because a cart is tied to where it is going — a rule that
 * was sitting inside a 50-line prop list in the middle of the view.
 */
export function CustomerSettingsScreen(props: CustomerSettingsScreenProps) {
  const {
    theme, settingsTab, savedAddresses, address, setAddress, addressSearchQuery,
    setAddressSearchQuery, isAddressModalOpen, setIsAddressModalOpen, setIsAddressSelectorOpen,
    deliveryLat, deliveryLng, setDeliveryLat, setDeliveryLng, carts, clearCart, setView,
    setTrackingOrder, refreshAddresses, handleDeleteAddress, onAddApiLog, onLogout,
  } = props;
  const confirm = useConfirm();

  return (
  <SharedSettingsView
    onBack={() => setView('home')}
    theme={theme}
    showCustomerTabs={true}
    setTrackingOrder={(order) => {
      setTrackingOrder(order);
      setView('home');
    }}
    savedAddresses={savedAddresses}
    initialTab={settingsTab}
    isAddressModalOpen={isAddressModalOpen}
    setIsAddressModalOpen={setIsAddressModalOpen}
     
    addressSearchQuery={addressSearchQuery}
    setAddressSearchQuery={setAddressSearchQuery}
    address={address}
    setAddress={setAddress}
    onAddApiLog={onAddApiLog}
    onLogout={onLogout}
    customerId={getUserProfile()?.id}
    onAddressAdded={refreshAddresses}
    onDeleteAddress={handleDeleteAddress}
    deliveryLat={deliveryLat ?? undefined}
    deliveryLng={deliveryLng ?? undefined}
    onSelectDeliveryLocation={async (addr: string, lat?: string | number, lng?: string | number) => {
      if (addr !== address) {
        const hasItems = Object.values<{ items?: unknown[] }>(carts || {}).some((cart) => Boolean(cart.items?.length));
        if (hasItems) {
          const proceed = await confirm({
            title: 'Change delivery address?',
            description: 'Your active cart is tied to your current address and will be cleared.',
            confirmLabel: 'Change address',
            tone: 'danger',
          });
          if (!proceed) return;
          Object.keys(carts).forEach(restaurantId => {
            if ((carts[restaurantId]?.items?.length ?? 0) > 0) {
              clearCart(restaurantId);
            }
          });
        }
      }
      setAddress(addr);
      if (lat !== undefined && lng !== undefined) {
        setDeliveryLat(Number(lat));
        setDeliveryLng(Number(lng));
      }
      setIsAddressSelectorOpen(false);
      setView('home');
    }}
  />
  );
}
