import { useToast } from '@/contexts/ToastContext';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatINR } from '@shared/money';
import { z } from 'zod';
import { Order } from '../../types';
import { OrderItemResponse } from '@/api/generated/schemas/customer/common';
import { Select } from './form/Select';
import { Spinner } from './feedback/Spinner';
import { Modal } from './overlay/Modal';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  order: Order;
  onSubmitQuoteRequest: (data: { refundType: 'FULL' | 'PARTIAL'; items: { itemId: string; quantity: number }[]; reason: string; description: string }) => void;
  onSubmitFinalRefund: () => void;
  quoteAmount: number | null;
  refundError: string | null;
  isSubmitting: boolean;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orderId,
  order,
  onSubmitQuoteRequest,
  onSubmitFinalRefund,
  quoteAmount,
  refundError,
  isSubmitting,
}) => {
  const { showError } = useToast();
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL' | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: number }>({});
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [localTimeoutError, setLocalTimeoutError] = useState<string | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  const throttleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTimeoutError(null);
      setRefundType(null);
      setSelectedItems({});
      setReason('');
      setDescription('');
    }
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitting) {
      timer = setTimeout(() => {
        setLocalTimeoutError("The request is taking longer than expected. Please try again.");
      }, 15000); // 15 seconds timeout
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTimeoutError(null);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  if (!isOpen) return null;
  
  const displayError = localTimeoutError || refundError;

  const handleItemSelect = (itemId: string, quantity: number, maxQuantity: number) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (quantity <= 0) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = Math.min(quantity, maxQuantity);
      }
      return newItems;
    });
  };

  const handleQuoteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundType || !reason || isThrottled || isSubmitting) return;
    
    setIsThrottled(true);
    throttleTimeoutRef.current = setTimeout(() => setIsThrottled(false), 2000);

    let itemsPayload: { itemId: string; quantity: number }[] = [];
    if (refundType === 'PARTIAL') {
      itemsPayload = Object.entries(selectedItems).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }));
      if (itemsPayload.length === 0) {
        showError('Select at least one item for a partial refund.');
        return;
      }
    }

    onSubmitQuoteRequest({
      refundType,
      items: itemsPayload,
      reason,
      description,
    });
  };

  // If a quote has been received, show the confirmation screen
  if (quoteAmount !== null) {
    return (
      <Modal open onClose={onClose} title="Confirm refund request" size="md" headerless>
        <div className="w-full overflow-hidden">
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold">Confirm Refund Request</h3>
            <button onClick={onClose} className="hover:bg-amber-700 p-1 rounded-full"><X size={20} /></button>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-4">Based on your selection, the calculated refund amount is:</p>
            <div className="text-3xl font-bold text-center text-amber-600 mb-6">
              {formatINR(quoteAmount)}
            </div>
            <p className="text-sm text-slate-500 mb-6 text-center">
              This request will be submitted as a Support Ticket and reviewed by our team. The responsible party may be asked to provide their comments.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (isThrottled || isSubmitting) return;
                  setIsThrottled(true);
                  throttleTimeoutRef.current = setTimeout(() => setIsThrottled(false), 2000);
                  onSubmitFinalRefund();
                }}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex justify-center items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner size="sm" label="" /> : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Request refund" size="md" headerless>
      <div className="w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-amber-600 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold">Request Refund</h3>
          <button onClick={onClose} className="hover:bg-amber-700 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        {isSubmitting && quoteAmount === null ? (
          <div className="p-6 flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" color="var(--color-amber-500)" />
            <p className="text-slate-600 font-medium animate-pulse">Calculating refund quote...</p>
            <div className="w-full space-y-3 mt-4">
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 overflow-y-auto flex-1">
              {displayError && (
            <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded">
              <span className="font-bold">Error:</span> {displayError}
            </div>
          )}
          <form id="refundForm" onSubmit={handleQuoteRequest} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Refund Type</label>
              <Select
                aria-label="Refund Type"
                placeholder="Select refund type…"
                value={refundType || ''}
                onChange={(value: string) => {
                  setRefundType(value as 'FULL' | 'PARTIAL');
                  setSelectedItems({});
                }}
                options={[
                  { value: 'FULL', label: 'Full Order Refund' },
                  { value: 'PARTIAL', label: 'Partial Refund (Specific Items)' },
                ]}
              />
            </div>

            {refundType === 'PARTIAL' && order?.items && (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Items</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {order.items.map((item: z.infer<typeof OrderItemResponse>) => {
                    const maxQty = item.quantity || 1;
                    const selectedQty = selectedItems[item.id] || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100">
                        <div className="flex items-center space-x-2 flex-1">
                          <input 
                            type="checkbox" 
                            checked={selectedQty > 0}
                            onChange={(e) => handleItemSelect(item.id, e.target.checked ? maxQty : 0, maxQty)}
                            className="text-amber-600 focus:ring-amber-500 rounded"
                          />
                          <span className="text-sm text-slate-800 truncate">{item.name || 'Item'}</span>
                        </div>
                        {selectedQty > 0 && maxQty > 1 && (
                          <Select
                            selectSize="sm"
                            aria-label={`Quantity for ${item.name || 'item'}`}
                            className="w-20"
                            value={String(selectedQty)}
                            onChange={(qty: string) => handleItemSelect(item.id, parseInt(qty, 10), maxQty)}
                            options={Array.from({ length: maxQty }, (_, i) => ({
                              value: String(i + 1),
                              label: String(i + 1),
                            }))}
                          />
                        )}
                        <span className="text-sm font-medium text-slate-600 ml-2">
                          {formatINR(item.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason Category</label>
              <Select
                aria-label="Reason Category"
                placeholder="Select reason…"
                value={reason}
                onChange={setReason}
                options={[
                  { value: 'MISSING_ITEM', label: 'Missing Item' },
                  { value: 'WRONG_ITEM', label: 'Wrong Item Received' },
                  { value: 'DAMAGED_FOOD', label: 'Spilled / Damaged Food' },
                  { value: 'DELAYED_DELIVERY', label: 'Delayed Delivery' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please provide more details..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500 resize-none h-20"
              />
            </div>
            
          </form>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button 
            type="submit" 
            form="refundForm"
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex justify-center items-center"
            disabled={isSubmitting || !refundType || !reason}
          >
            {isSubmitting ? <Spinner size="sm" label="" /> : 'Request Quote'}
          </button>
        </div>
        </>
        )}
      </div>
    </Modal>
  );
};
