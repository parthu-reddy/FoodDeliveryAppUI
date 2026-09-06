import { DeliveryStatus, OrderStatus } from '@/types/backend-enums';

export const isActiveOrder = (order: Pick<import('@/types').Order, 'status' | 'deliveryStatus'>): boolean => {
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

export const isFailedOrder = (order: Pick<import('@/types').Order, 'status' | 'deliveryStatus'>): boolean => {
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
