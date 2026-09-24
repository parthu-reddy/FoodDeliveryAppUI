import { Restaurant } from '@/types';
import { Modal, useConfirm } from '@shared/ui';
import { Check } from 'lucide-react';
import React, { useRef } from 'react';

/** The backend's delivery limit. Beyond this it answers OUT_OF_SERVICE_AREA. */
const MAX_DELIVERY_KM = 5;

interface CustomerOutletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandOutlets: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant) => void;
  onAddApiLog?: (log: unknown) => void;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  carts?: Record<string, { items: import('@/types').CartItem[] }>;
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
  const confirm = useConfirm();
  const listRef = useRef<HTMLDivElement>(null);

  if (!brandOutlets) return null;

  /**
   * Arrow-key movement between the outlet options.
   *
   * These are plain buttons, so Tab reached them but ArrowDown did nothing -- the E2E test
   * `outletSelectorArrowDownMovesFocus` fails on exactly that (ACCESS-05). A vertical list of
   * choices in a dialog is expected to move with the arrow keys; Home/End jump to the ends.
   * Disabled options are skipped because they are not focusable, which is the correct
   * behaviour for an outlet that cannot be delivered from.
   */
  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []
    );
    if (options.length === 0) return;
    e.preventDefault();
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    else if (e.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % options.length;
    else next = current <= 0 ? options.length - 1 : current - 1;
    options[next].focus();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Select Outlet Location" size="md">
      <div ref={listRef} onKeyDown={onListKeyDown} className="p-4 space-y-3 pb-8">
        {brandOutlets.map(outlet => {
          const displayDistance = outlet.distance;
          // The backend refuses any order beyond 5 km with OUT_OF_SERVICE_AREA ("The
          // restaurant is too far away (over 5km)"), but this list rendered those outlets as
          // ordinary enabled buttons -- a customer could pick one and only discover the
          // refusal at checkout. `ADDRESS-09` records Brand 1 Outlet 5 at 5.1 km selectable.
          const km = typeof displayDistance === 'number' ? displayDistance : Number(displayDistance);
          const tooFar = Number.isFinite(km) && km > MAX_DELIVERY_KM;
          return (
            <button
              key={outlet.id}
              disabled={tooFar}
              onClick={async () => {
                if (tooFar) return;
                const hasActiveCart = selectedRestaurant && selectedRestaurant.id && (carts?.[selectedRestaurant.id]?.items?.length ?? 0) > 0;
                if (hasActiveCart && selectedRestaurant.id !== outlet.id) {
                  if (await confirm({
                    title: 'Switch outlet?',
                    description: `Your cart from ${selectedRestaurant.name} will be cleared.`,
                    confirmLabel: 'Switch outlet',
                    tone: 'danger',
                  })) {
                    if (clearCart) clearCart(selectedRestaurant.id as string);
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
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${tooFar
                  ? 'opacity-55 cursor-not-allowed border-slate-100 dark:border-slate-800'
                  : selectedRestaurant?.id === outlet.id
                  ? 'cursor-pointer border-rose-500 bg-rose-50/50 dark:bg-rose-500/10'
                  : 'cursor-pointer border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <div>
                <p className={`font-bold text-sm ${selectedRestaurant?.id === outlet.id ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {outlet.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km away
                </p>
                {tooFar && (
                  <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-danger)' }}>
                    Too far to deliver &mdash; over {MAX_DELIVERY_KM} km
                  </p>
                )}
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
