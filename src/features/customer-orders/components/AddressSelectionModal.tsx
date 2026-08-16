import React from 'react';
import { MapPin, Navigation, Plus } from 'lucide-react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi, mapsApi } from "@/lib/zodiosClients";
import { useToast } from "@/context/ToastContext";
import { Modal } from '@shared/ui';

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAddresses: any[];
  onSelectAddress: (address: any) => void;
  onUseCurrentLocation: (addressStr: string) => void;
  onAddNewAddress: () => void;
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  savedAddresses,
  onSelectAddress,
  onUseCurrentLocation,
  onAddNewAddress
}: AddressSelectionModalProps) {
  const { showError } = useToast();

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await mapsApi.integration.get('/api/places/reverse-geocode', { queries: { lat: latitude, lng: longitude } });
            if (res && res.address) {
              onUseCurrentLocation(res.address);
            } else {
              onUseCurrentLocation("Current Location");
            }
          } catch (e) {
             onUseCurrentLocation("Current Location");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          showError("Could not get current location.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      showError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Select Delivery Address"
    >
      <div className="p-5 flex-1 space-y-4">
        <button
          onClick={handleUseCurrentLocation}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-left"
        >
          <Navigation className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Use current location</p>
            <p className="text-xs opacity-80">Using GPS</p>
          </div>
        </button>

        {savedAddresses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saved Addresses</h4>
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-[#f0ede6] truncate">{addr.label || 'Saved Address'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{addr.addressLine1}, {addr.city}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onAddNewAddress}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-[#f0ede6]">Add New Address</p>
        </button>
      </div>
    </Modal>
  );
}
