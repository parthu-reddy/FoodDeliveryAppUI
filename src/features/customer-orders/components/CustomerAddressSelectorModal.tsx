import React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { Modal } from '@shared/ui';
import { useConfig } from "@/contexts/ConfigContext";

interface CustomerAddressSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAddresses: any[];
  setAddress: (address: string) => void;
  setDeliveryLat: (lat: number) => void;
  setDeliveryLng: (lng: number) => void;
  setDeliveryAddressId: (id: string) => void;
  setShowLocationPrompt: (show: boolean) => void;
  onAddNewAddress: () => void;
}

const CustomerAddressSelectorModal: React.FC<CustomerAddressSelectorModalProps> = ({
  isOpen,
  onClose,
  savedAddresses,
  setAddress,
  setDeliveryLat,
  setDeliveryLng,
  setDeliveryAddressId,
  setShowLocationPrompt,
  onAddNewAddress
}) => {
  const { olaMapsApiKey } = useConfig();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Delivery Location" size="md">
      <div className="p-4 space-y-3 pb-8">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                  const apiKey = olaMapsApiKey || import.meta.env.VITE_OLA_MAPS_API_KEY || '';
                  const res = await fetch(`https://api.olamaps.io/places/v1/reverse-geocode?latlng=${pos.coords.latitude},${pos.coords.longitude}&api_key=${apiKey}`);
                  const data = await res.json();
                  if (data.results && data.results.length > 0) {
                    setAddress(`Current Location: ${data.results[0].formatted_address}`);
                  } else {
                    setAddress('Current Location');
                  }
                  setDeliveryLat(pos.coords.latitude);
                  setDeliveryLng(pos.coords.longitude);
                  setDeliveryAddressId('');
                  onClose();
                } catch (e) {
                  setAddress('Current Location');
                  setDeliveryLat(pos.coords.latitude);
                  setDeliveryLng(pos.coords.longitude);
                  setDeliveryAddressId('');
                  onClose();
                }
              }, (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                  onClose();
                  setShowLocationPrompt(true);
                }
              });
            }
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors text-left cursor-pointer"
        >
          <Navigation className="w-5 h-5 text-indigo-500 shrink-0" />
          <div>
            <p className="font-bold text-indigo-600 dark:text-indigo-400">Use Current Location</p>
            <p className="text-xs text-indigo-500/80 dark:text-indigo-400/80">Using GPS</p>
          </div>
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
                    setAddress(`${addr.label}: ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`);
                    if (addr.latitude !== undefined && addr.longitude !== undefined) {
                      setDeliveryLat(addr.latitude);
                      setDeliveryLng(addr.longitude);
                    }
                    setDeliveryAddressId(addr.id);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left group cursor-pointer"
                >
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-rose-500 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{addr.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                      {addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, {addr.city}
                    </p>
                  </div>
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
