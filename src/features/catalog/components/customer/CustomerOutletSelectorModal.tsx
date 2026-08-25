import { Restaurant } from '@/types';
import { Modal } from '@shared/ui';
import { Check } from 'lucide-react';
import React from 'react';

interface CustomerOutletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandOutlets: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant) => void;
  onAddApiLog?: (log: unknown) => void;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  carts?: any;
  clearCart?: (restaurantId: string) => void;
}

const CustomerOutletSelectorModal: React.FC<CustomerOutletSelectorModalProps> = ({
  isOpen,
  onClose,
  brandOutlets,
  selectedRestaurant,
  setSelectedRestaurant,
  onAddApiLog,
   
  carts,
   
  clearCart
}) => {

  if (!brandOutlets) return null;
 

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Outlet Location" size="md">
      <div className="p-4 space-y-3 pb-8">
        {brandOutlets.map(outlet => {
          const displayDistance = outlet.distance;
          return (
            <button
              key={outlet.id}
              onClick={() => {
                const hasActiveCart = selectedRestaurant && carts?.[selectedRestaurant.id]?.items?.length > 0;
                if (hasActiveCart && selectedRestaurant.id !== outlet.id) {
                  if (window.confirm(`You have items in your cart from ${selectedRestaurant.name}. Switching outlets will clear your active cart. Continue?`)) {
                    if (clearCart) clearCart(selectedRestaurant.id);
                    setSelectedRestaurant(outlet);
                    if (onAddApiLog) {
                      onAddApiLog({ id: 'catalog', label: `GET /api/v1/restaurants/${outlet.id}/catalog/items`, method: 'GET' });
                    }
                    onClose();
                  }
                } else {
                  setSelectedRestaurant(outlet);
                  if (onAddApiLog) {
                    onAddApiLog({ id: 'catalog', label: `GET /api/v1/restaurants/${outlet.id}/catalog/items`, method: 'GET' });
                  }
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left cursor-pointer ${selectedRestaurant?.id === outlet.id
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/10'
                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <div>
                <p className={`font-bold text-sm ${selectedRestaurant?.id === outlet.id ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {outlet.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km away
                </p>
              </div>
              {selectedRestaurant?.id === outlet.id && (
                <Check className="w-5 h-5 text-rose-500" />
              )}
            </button>
          )
        })}
      </div>
    </Modal>
  );
};

export default CustomerOutletSelectorModal;
