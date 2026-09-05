import { z } from 'zod';
import type { OrderStatus, DeliveryStatus } from '../types/backend-enums';
import { cartItemSchema } from './menu';

export const orderSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  deliveryStatus: z.string().optional(),
  items: z.array(cartItemSchema).optional(),

  // Custom UI fields added during normalization
  restaurantId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  deliveryExecutiveName: z.string().optional(),
  deliveryExecutiveId: z.string().optional(),
  timestamp: z.string().optional(),

  // Backwards compatibility
  paymentStatus: z.string().optional(),
  refundedAmount: z.number().optional(),

  itemsJson: z.string().optional(),
}).passthrough();

import type { components } from '../api/generated/customer';

export type Order = Omit<components['schemas']['OrderResponse'], 'status' | 'deliveryStatus' | 'items'> & {
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  // Add some fallback fields for backwards compatibility with any un-updated UI components
  paymentStatus?: string;
  refundedAmount?: number;
  deliveryExecutiveId?: string;
  customerName?: string;
  deliveryExecutiveName?: string;
  payout?: number;
  timestamp?: string;
  foodCost?: number;
  restaurantPlatformFee?: number;
  restaurantPayout?: number;
  itemsJson?: string;
  createdAt?: string;
  customerPlatformFee?: number;
  driverCustomerContribution?: number;
  driverRestaurantContribution?: number;
  driverTip?: number;
  grossPayout?: number;
  driverTaxes?: number;
  // Overriding items temporarily until all UI components are updated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items?: any[];
};

export const normalizeOrder = (raw: unknown): Order => {
  return raw as Order;
};
