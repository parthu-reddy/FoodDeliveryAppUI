import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { apiGet } from '../../lib/apiClient';
import { isActiveOrder, isFailedOrder } from '../../utils/orderStatus';

interface UseCustomerOrdersOptions {
  onUpdateOrder?: (orderId: string, status: string) => void;
}

export function useCustomerOrders({ onUpdateOrder }: UseCustomerOrdersOptions = {}) {
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch initial active orders
  useEffect(() => {
    let ignore = false;
    apiGet('/api/v1/orders/active?page=0&size=50')
      .then(res => {
        if (!ignore && res.data) {
          const content = res.data.content || (Array.isArray(res.data) ? res.data : []);
          setInternalOrders(content.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' })));
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) setIsInitialLoad(false);
      });
    return () => { ignore = true; };
  }, []);

  const activeOrderIdsStr = internalOrders
    .filter(o => [OrderStatus.CREATED, OrderStatus.PENDING_ACCEPTANCE, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.HANDED_OVER].includes((o.status?.toUpperCase() as OrderStatus) || ('' as OrderStatus)))
    .map(o => o.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!activeOrderIdsStr) return;

    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;

    const pollOrders = () => {
      apiGet(`/api/v1/orders/active?page=0&size=50`)
        .then(res => {
          if (!isSubscribed) return;
          retryCount = 0; // Reset on success
          if (!res.data) {
            timeoutId = setTimeout(pollOrders, 60000);
            return;
          }
          const content = res.data.content || (Array.isArray(res.data) ? res.data : []);
          const updatedOrders = content.map((o: any) => ({ ...o, status: o.status?.toUpperCase() || '' }));
          
          setInternalOrders(prev => {
            const newOrders = [...prev];
            let changed = false;
            
            updatedOrders.forEach((updated: any) => {
              const idx = newOrders.findIndex(o => o.id === updated.id);
              if (idx !== -1) {
                if (JSON.stringify(newOrders[idx]) !== JSON.stringify(updated)) {
                  newOrders[idx] = updated;
                  changed = true;
                }
              } else {
                newOrders.push(updated);
                changed = true;
              }
            });
            
            const activePrevIds = prev.filter(o => isActiveOrder(o)).map(o => o.id);
            const missingIds = activePrevIds.filter(id => !updatedOrders.find((u: any) => u.id === id));
            
            if (missingIds.length > 0) {
               apiGet(`/api/v1/orders/batch?ids=${missingIds.join(',')}`).then(res => {
                  if (res.data) {
                     setInternalOrders(curr => {
                        const currentList = [...curr];
                        let batchChanged = false;
                        res.data.forEach((batchOrder: any) => {
                            const idx = currentList.findIndex(o => o.id === batchOrder.id);
                            if (idx !== -1 && JSON.stringify(currentList[idx]) !== JSON.stringify(batchOrder)) {
                               currentList[idx] = batchOrder;
                               batchChanged = true;
                            }
                        });
                        return batchChanged ? currentList : curr;
                     });
                  }
               }).catch(console.error);
            }
            
            return changed ? newOrders : prev;
          });

          const hasOutForDelivery = updatedOrders.some((o: any) => o.deliveryStatus === 'OUT_FOR_DELIVERY');
          const hasPreparingOrAccepted = updatedOrders.some((o: any) => o.status === 'PREPARING' || o.status === 'ACCEPTED');
          
          let nextInterval = 60000;
          if (hasOutForDelivery) {
            nextInterval = 10000; 
          } else if (hasPreparingOrAccepted) {
            nextInterval = 30000; 
          }
          
          timeoutId = setTimeout(pollOrders, nextInterval);
        })
        .catch(err => {
          console.error(err);
          if (isSubscribed) {
            retryCount++;
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 60000);
            timeoutId = setTimeout(pollOrders, backoffDelay);
          }
        });
    };

    timeoutId = setTimeout(pollOrders, 30000); 

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  }, [activeOrderIdsStr]);

  const activeOrders = internalOrders.filter(o => isActiveOrder(o) || isFailedOrder(o));

  return {
    internalOrders,
    setInternalOrders,
    activeOrders,
    isInitialLoad
  };
}
