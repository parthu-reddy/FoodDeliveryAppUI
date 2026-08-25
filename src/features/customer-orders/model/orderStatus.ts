import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isActiveOrder = (order: any): boolean => {
  if (!order) return false;
  const s = order.status;
  const ds = order.deliveryStatus;

  if (s === OrderStatus.CANCELLED || s === OrderStatus.CANCELLED_BY_RESTAURANT) {
    return false;
  }
  if (ds === DeliveryStatus.CANCELLED || ds === DeliveryStatus.FAILED || ds === DeliveryStatus.DELIVERED) {
    return false;
  }
  
  if (s === OrderStatus.HANDED_OVER && !ds) {
    return false;
  }

  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFailedOrder = (order: any): boolean => {
  if (!order) return false;
  const s = order.status;
  const ds = order.deliveryStatus;

  if (s === OrderStatus.CANCELLED || s === OrderStatus.CANCELLED_BY_RESTAURANT) {
    return true;
  }
  if (ds === DeliveryStatus.CANCELLED || ds === DeliveryStatus.FAILED) {
    return true;
  }

  return false;
};
