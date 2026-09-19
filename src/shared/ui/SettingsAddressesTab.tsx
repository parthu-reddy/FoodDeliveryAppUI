import CustomerAddressModal from "@features/customer-orders/components/CustomerAddressModal";
import { MapPin, Trash2 } from 'lucide-react';
import { Button } from './action/Button';
import { Surface } from './surface/Surface';

interface SettingsAddressesTabProps {
  savedAddresses?: unknown[];
  onDeleteAddress?: (id: string) => void;
  isAddressModalOpen?: boolean;
  setIsAddressModalOpen?: (open: boolean) => void;
  addressSearchQuery?: string;
  setAddressSearchQuery?: (q: string) => void;
  address?: string;
  setAddress?: (a: string) => void;
  onAddApiLog?: (log: unknown) => void;
  customerId?: string;
  onSelectDeliveryLocation?: (addr: string) => void;
  deliveryLat?: number | string;
  deliveryLng?: number | string;
  onAddressAdded?: () => void;
}

/**
 * Saved delivery addresses, inside account settings.
 *
 * Split out of SharedSettingsView, which held five tabs in one 468-line file. This one is
 * pure presentation over the props the settings view already received -- the address list
 * itself is owned further up, where the modal that edits it lives.
 */
export function SettingsAddressesTab({
  savedAddresses,
  onDeleteAddress,
  isAddressModalOpen,
  setIsAddressModalOpen,
  addressSearchQuery,
  setAddressSearchQuery,
  address,
  setAddress,
  onAddApiLog,
  customerId,
  onSelectDeliveryLocation,
  deliveryLat,
  deliveryLng,
  onAddressAdded,
}: SettingsAddressesTabProps) {
  return (
    <div className="space-y-4">
      {savedAddresses && savedAddresses.length > 0 ? (
        <div className="flex flex-col gap-3">
          {savedAddresses.map((a: unknown) => {
            const addr = a as { id: string, label?: string, addressLine1?: string, addressLine2?: string, city?: string, state?: string, zipCode?: string };
            return (
            <Surface
              key={addr.id}
              radius="lg"
              elevation={1}
              className="flex items-start gap-3 p-4"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-[#f0ede6]">{addr.label || 'Home'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  <br />
                  {addr.city}, {addr.state} {addr.zipCode}
                </p>
              </div>
              {onDeleteAddress && (
                <button
                  onClick={() => onDeleteAddress(addr.id)}
                  className="w-10 h-10 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center shrink-0 transition-colors duration-200"
                  title="Delete Address"
                >
                  <Trash2 className="w-5 h-5 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors" />
                </button>
              )}
            </Surface>
          )})}
        </div>
      ) : (
        <Surface radius="xl" elevation={0} variant="sunken" className="text-center py-10">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No saved addresses</p>
        </Surface>
      )}

      {!isAddressModalOpen ? (
        <Button
          onClick={() => {
            if (setIsAddressModalOpen) setIsAddressModalOpen(true);
          }}
          variant="secondary"
          fullWidth
          icon={<MapPin className="w-4 h-4" />}
          className="mt-2 border-2 border-dashed border-rose-500/30 dark:border-rose-500/40 !text-rose-600 dark:!text-rose-400 !bg-transparent hover:!bg-rose-50 dark:hover:!bg-rose-500/10"
        >
          Add / Manage Addresses
        </Button>
      ) : (
        <div className="mt-4">
          <CustomerAddressModal
            isAddressModalOpen={!!isAddressModalOpen}
            setIsAddressModalOpen={setIsAddressModalOpen || (() => {})}
            addressSearchQuery={addressSearchQuery || ''}
            setAddressSearchQuery={setAddressSearchQuery || (() => {})}
            address={address}
            setAddress={setAddress}
            savedAddresses={(savedAddresses || []) as { id: string; label: string; addressLine1: string; city: string; latitude: string; longitude: string; }[]}
            onAddApiLog={onAddApiLog}
            customerId={customerId}
            onSelectDeliveryLocation={onSelectDeliveryLocation}
            initialLat={deliveryLat}
            initialLng={deliveryLng}
            onAddressAdded={onAddressAdded}
          />
        </div>
      )}
    </div>
  );
}
