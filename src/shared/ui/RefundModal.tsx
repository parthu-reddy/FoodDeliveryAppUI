import { Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { Order } from '../../types';

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
  orderId,
  order,
  onSubmitQuoteRequest,
  onSubmitFinalRefund,
  quoteAmount,
  refundError,
  isSubmitting,
}) => {
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL' | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: number }>({});
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [localTimeoutError, setLocalTimeoutError] = useState<string | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  const throttleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
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
        alert('Please select at least one item for a partial refund.');
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
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold">Confirm Refund Request</h3>
            <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full"><X size={20} /></button>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Based on your selection, the calculated refund amount is:</p>
            <div className="text-3xl font-bold text-center text-orange-600 mb-6">
              ${quoteAmount.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500 mb-6 text-center">
              This request will be submitted as a Support Ticket and reviewed by our team. The responsible party may be asked to provide their comments.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
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
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex justify-center items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-orange-600 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold">Request Refund</h3>
          <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        {isSubmitting && quoteAmount === null ? (
          <div className="p-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-gray-600 font-medium animate-pulse">Calculating refund quote...</p>
            <div className="w-full space-y-3 mt-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 overflow-y-auto flex-1">
              {displayError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              <span className="font-bold">Error:</span> {displayError}
            </div>
          )}
          <form id="refundForm" onSubmit={handleQuoteRequest} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Type</label>
              <select 
                value={refundType || ''} 
                onChange={e => {
                  setRefundType(e.target.value as 'FULL' | 'PARTIAL');
                  setSelectedItems({});
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                required
              >
                <option value="" disabled>Select refund type...</option>
                <option value="FULL">Full Order Refund</option>
                <option value="PARTIAL">Partial Refund (Specific Items)</option>
              </select>
            </div>

            {refundType === 'PARTIAL' && order?.items && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Items</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {order.items.map((cartItem: any) => {
                    const itemParsed = z.object({ id: z.string(), quantity: z.number().optional(), price: z.number().optional(), name: z.string().optional(), item: z.object({ name: z.string().optional() }).optional() }).safeParse(cartItem);
                    const item = itemParsed.success ? itemParsed.data : { id: '' };
                    const maxQty = item.quantity || 1;
                    const selectedQty = selectedItems[item.id] || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                        <div className="flex items-center space-x-2 flex-1">
                          <input 
                            type="checkbox" 
                            checked={selectedQty > 0}
                            onChange={(e) => handleItemSelect(item.id, e.target.checked ? maxQty : 0, maxQty)}
                            className="text-orange-600 focus:ring-orange-500 rounded"
                          />
                          <span className="text-sm text-gray-800 truncate">{item?.item?.name || item?.name || 'Item'}</span>
                        </div>
                        {selectedQty > 0 && maxQty > 1 && (
                          <select 
                            value={selectedQty}
                            onChange={(e) => handleItemSelect(item.id, parseInt(e.target.value), maxQty)}
                            className="text-xs border border-gray-300 rounded px-1 py-1"
                          >
                            {Array.from({ length: maxQty }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        )}
                        <span className="text-sm font-medium text-gray-600 ml-2">
                          ${item.price?.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason Category</label>
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                required
              >
                <option value="" disabled>Select reason...</option>
                <option value="MISSING_ITEM">Missing Item</option>
                <option value="WRONG_ITEM">Wrong Item Received</option>
                <option value="DAMAGED_FOOD">Spilled / Damaged Food</option>
                <option value="DELAYED_DELIVERY">Delayed Delivery</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please provide more details..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 resize-none h-20"
              />
            </div>
            
          </form>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button 
            type="submit" 
            form="refundForm"
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex justify-center items-center"
            disabled={isSubmitting || !refundType || !reason}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Quote'}
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
