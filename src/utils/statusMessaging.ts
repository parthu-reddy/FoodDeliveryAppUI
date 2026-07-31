import { OrderStatus, DeliveryStatus } from '../types/backend-enums';

export const getFriendlyStatusMessage = (status?: OrderStatus | string, deliveryStatus?: DeliveryStatus | string): string => {
  if (deliveryStatus === DeliveryStatus.FAILED) return 'Delivery Delayed / Failed';
  if (deliveryStatus === DeliveryStatus.DELIVERED) return 'Order Delivered';
  if (deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) return 'Courier on the way';
  if (deliveryStatus === DeliveryStatus.AT_RESTAURANT) return 'Courier at restaurant';
  if (deliveryStatus === DeliveryStatus.ASSIGNED) return 'Courier assigned';

  if (status === OrderStatus.CANCELLED) return 'Order Cancelled';
  if (status === OrderStatus.CANCELLED_BY_RESTAURANT) return 'Cancelled by Restaurant';
  if (status === OrderStatus.HANDED_OVER) return 'Picked up by Courier';
  if (status === OrderStatus.READY_FOR_PICKUP) return 'Ready for Pickup';
  if (status === OrderStatus.PREPARING) return 'Food is Preparing';
  if (status === OrderStatus.ACCEPTED) return 'Order Accepted';
  if (status === OrderStatus.PENDING_ACCEPTANCE) return 'Waiting for Restaurant';
  if (status === OrderStatus.AWAITING_DELAY_APPROVAL) return 'Approval Needed for Delay';
  if (status === OrderStatus.CREATED) return 'Order Created';

  // Fallback for string processing
  if (!status) return 'Unknown Status';
  return status.replace(/_/g, ' ');
};

export const getFriendlyDeliveryStatusMessage = (deliveryStatus?: DeliveryStatus | string): string => {
  if (deliveryStatus === DeliveryStatus.PENDING) return 'Pending Assignment';
  if (deliveryStatus === DeliveryStatus.SEARCHING_FOR_DRIVER) return 'Searching for Courier';
  if (deliveryStatus === DeliveryStatus.MANUAL_INTERVENTION_REQUIRED) return 'We are experiencing high demand. Our team is manually securing a driver for your order.';
  if (deliveryStatus === DeliveryStatus.ASSIGNED) return 'Courier Assigned';
  if (deliveryStatus === DeliveryStatus.AT_RESTAURANT) return 'Courier at Restaurant';
  if (deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY) return 'Out for Delivery';
  if (deliveryStatus === DeliveryStatus.DELIVERED) return 'Delivered';
  if (deliveryStatus === DeliveryStatus.CANCELLED) return 'Delivery Cancelled';
  if (deliveryStatus === DeliveryStatus.FAILED) return 'Delivery Failed';
  
  if (!deliveryStatus) return 'No Courier Yet';
  return deliveryStatus.replace(/_/g, ' ');
};
