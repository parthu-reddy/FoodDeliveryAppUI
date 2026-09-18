import React, { useState, useEffect } from 'react';
import { formatINR } from '@shared/money';
import { X } from 'lucide-react';
import { Button, Overlay, Select, Surface } from '@shared/ui';
import { customerApi } from '@/lib/zodiosClients';
import type { Order } from '@/types';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSubmit: (items: { itemId: string; quantity: number }[], reason: string) => void;
}

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSubmit,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      if (isOpen && orderId && !order) {
        setLoading(true);
        try {
          const res = await customerApi.order.get('/api/v1/orders/:orderId', { params: { orderId } });
          if (isMounted) setOrder((res.data && 'data' in res.data ? res.data.data : res.data) as import('@/types').Order);
        } catch (err) {
          console.error('Failed to fetch order details for refund', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };
    fetchOrder();
    return () => { isMounted = false; };
  }, [isOpen, orderId, order]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      const reset = () => {
        setSelectedItems({});
        setReason('');
      };
      reset();
    }
  }, [isOpen]);

  const toggleItem = (itemId: string, maxQuantity: number) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (updated[itemId]) {
        delete updated[itemId];
      } else {
        updated[itemId] = maxQuantity; // Default to full quantity
      }
      return updated;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const handleSubmit = () => {
    const items = Object.entries(selectedItems).map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }));
    onSubmit(items, reason);
    onClose();
  };

  const isFormValid = Object.keys(selectedItems).length > 0 && reason.trim().length > 0;

  return (
    <Overlay
      open={isOpen}
      onClose={onClose}
      label="Request refund quote"
      className="w-full max-w-lg"
    >
          <Surface
            variant="solid"
            elevation={4}
            radius="xl"
            className="w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request Refund Quote</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading order details...</div>
              ) : !order ? (
                <div className="text-center py-8 text-rose-500">Failed to load order.</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Select Items to Refund</h4>
                    <div className="space-y-3">
                      {order.items?.map((item: import('@/types').OrderItem, idx: number) => {
                        const itemId = item.item?.id || item.id || `item-${idx}`;
                        const itemName = item.item?.name || item.name || 'Unknown Item';
                        const itemPrice = item.item?.price || item.price || 0;
                        const maxQuantity = item.quantity || 1;
                        const isSelected = !!selectedItems[itemId];

                        return (
                          <div
                            key={itemId}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItem(itemId, maxQuantity)}
                                className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{itemName}</p>
                                <p className="text-xs text-slate-500">{formatINR(itemPrice * maxQuantity)} total ({maxQuantity}x)</p>
                              </div>
                            </label>
                            
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Qty:</span>
                                <Select
                                  selectSize="sm"
                                  aria-label="Quantity to refund"
                                  className="w-20"
                                  value={String(selectedItems[itemId])}
                                  onChange={(qty: string) => updateQuantity(itemId, parseInt(qty, 10))}
                                  options={Array.from({ length: maxQuantity }, (_, i) => ({
                                    value: String(i + 1),
                                    label: String(i + 1),
                                  }))}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Reason for Refund</h4>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please explain why you are requesting a refund..."
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-rose-500 focus:border-rose-500 p-3 h-24 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900">
              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                Request Quote
              </Button>
            </div>
          </Surface>
    </Overlay>
  );
};
