import { z } from 'zod';
import type { OrderStatus, DeliveryStatus } from '../types/backend-enums';
import { cartItemSchema } from './menu';

export const orderSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  deliveryStatus: z.string().optional(),
  items: z.array(cartItemSchema).optional(),

  restaurantId: z.string().optional(),
  customerId: z.string().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  deliveryExecutiveId: z.string().optional(),
}).passthrough();

import type { components } from '../api/generated/customer';

export type Order = Omit<components['schemas']['OrderResponse'], 'status' | 'deliveryStatus'> & {
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  earnings?: {
    grossPayout: number;
    taxes: number;
    netPayout: number;
    customerContribution: number;
    restaurantContribution: number;
  };
};

export const normalizeOrder = (raw: unknown): Order => {
  return raw as Order;
};
