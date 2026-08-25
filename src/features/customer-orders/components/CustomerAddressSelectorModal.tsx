import { useConfig } from "@/contexts/ConfigContext";
import { Modal } from '@shared/ui';
import { Check, MapPin, Navigation } from 'lucide-react';
import React from 'react';

interface CustomerAddressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  savedAddresses: any[];
  address: string;
  setAddress: (address: string) => void;
  setDeliveryLat: (lat: number) => void;
  setDeliveryLng: (lng: number) => void;
  setDeliveryAddressId: (id: string) => void;
  currentAddressId?: string;
  setShowLocationPrompt: (show: boolean) => void;
  onAddNewAddress: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  carts?: any;
  clearCart?: (restaurantId: string) => void;
}

const CustomerAddressSelectorModal: React.FC<CustomerAddressSelectorModalProps> = ({
  isOpen,
  onClose,
  savedAddresses,
  address,
  setAddress,
  setDeliveryLat,
  setDeliveryLng,
  setDeliveryAddressId,
  currentAddressId,
  setShowLocationPrompt,
  onAddNewAddress,
  carts,
  clearCart
}) => {
  useConfig();
  const handleAddressSelect = (addr: string, lat?: number, lng?: number, id?: string) => {
    // If id is provided (saved address), check if it's different from current
    // If no id (GPS), check if the address string is different
    const isDifferent = id ? id !== currentAddressId : addr !== address;
    
    if (isDifferent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasItems = Object.values(carts || {}).some((cart: any) => cart.items && cart.items.length > 0);
      if (hasItems) {
        if (!window.confirm("Changing your address will clear your active cart. Do you want to continue?")) {
          return;
        }
        Object.keys(carts || {}).forEach(restaurantId => {
          if (carts[restaurantId]?.items?.length > 0 && clearCart) {
            clearCart(restaurantId);
          }
        });
      }
    }
    
    setAddress(addr);
    if (lat !== undefined && lng !== undefined) {
      setDeliveryLat(lat);
      setDeliveryLng(lng);
    }
    setDeliveryAddressId(id || '');
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Delivery Location" size="md">
      <div className="p-4 space-y-3 pb-8">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                  const res = await window.fetch(`/olamaps/places/v1/reverse-geocode?latlng=${pos.coords.latitude},${pos.coords.longitude}`);
                  const data = await res.json();
                  if (data.results && data.results.length > 0) {
                    handleAddressSelect(`Current Location: ${data.results[0].formatted_address}`, pos.coords.latitude, pos.coords.longitude, '');
                  } else {
                    handleAddressSelect('Current Location', pos.coords.latitude, pos.coords.longitude, '');
                  }
                } catch (_e: unknown) {
                  handleAddressSelect('Current Location', pos.coords.latitude, pos.coords.longitude, '');
                }
              }, (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                  onClose();
                  setShowLocationPrompt(true);
                }
              });
            }
          }}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left cursor-pointer ${
            !currentAddressId 
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/20' 
              : 'border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-50 dark:hover:bg-indigo-500/20'
          }`}
        >
          <Navigation className={`w-5 h-5 shrink-0 ${!currentAddressId ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500'}`} />
          <div className="flex-1">
            <p className={`font-bold ${!currentAddressId ? 'text-indigo-700 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`}>Use Current Location</p>
            <p className="text-xs text-indigo-500/80 dark:text-indigo-400/80">Using GPS</p>
          </div>
          {!currentAddressId && (
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </button>

        <button
          onClick={() => {
            onClose();
            onAddNewAddress();
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors text-left cursor-pointer"
        >
          <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-bold text-rose-600 dark:text-rose-400">Add New Address</p>
            <p className="text-xs text-rose-500/80 dark:text-rose-400/80">Search or pick from map</p>
          </div>
        </button>
        
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 px-1 uppercase tracking-wider">Saved Addresses</p>
          {savedAddresses.length > 0 ? (
            <div className="space-y-2">
              {savedAddresses.map(addr => (
                <button
                  key={addr.id}
                  onClick={() => {
                    handleAddressSelect(
                      `${addr.label}: ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`,
                      addr.latitude,
                      addr.longitude,
                      addr.id
                    );
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-colors text-left group cursor-pointer ${
                    addr.id === currentAddressId
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <MapPin className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${
                    addr.id === currentAddressId 
                      ? 'text-rose-500' 
                      : 'text-slate-400 group-hover:text-rose-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${addr.id === currentAddressId ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{addr.label}</p>
                    <p className={`text-xs leading-relaxed mt-0.5 line-clamp-2 ${addr.id === currentAddressId ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-slate-500 dark:text-slate-400'}`}>
                      {addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, {addr.city}
                    </p>
                  </div>
                  {addr.id === currentAddressId && (
                    <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0 mt-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 px-1">No saved addresses found.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerAddressSelectorModal;
