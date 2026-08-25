import { z } from 'zod';
import { cartItemSchema } from './menu';

export const orderSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  status: z.string().optional(),
  deliveryStatus: z.string().optional(),
  items: z.array(cartItemSchema).optional(),
  
  // Custom UI fields added during normalization
  customerName: z.string().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  totalAmount: z.number().optional(),
  deliveryExecutiveName: z.string().optional(),
  riderName: z.string().optional(),
  riderId: z.string().optional(),
  timestamp: z.string().optional(),
  
  // Backwards compatibility
  paymentStatus: z.string().optional(),
  refundedAmount: z.number().optional(),
  deliveryExecutiveId: z.string().optional(),
  driverCustomerContribution: z.number().optional(),
  driverRestaurantContribution: z.number().optional(),
  driverTip: z.number().optional(),
  driverTaxes: z.number().optional(),
  driverGrossPayout: z.number().optional(),
  driverNetPayout: z.number().optional(),
  grossPayout: z.number().optional(),
  payout: z.number().optional(),
  itemsJson: z.string().optional(),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}).passthrough().transform((raw: any) => {
  const s = raw.status?.toUpperCase() || '';
  const d = raw.deliveryStatus?.toUpperCase() || '';
  
  let parsedItems = raw.items || [];
  if (raw.itemsJson) {
      // malformed itemsJson falls back to raw.items rather than failing the parse
      try { parsedItems = JSON.parse(raw.itemsJson); } catch { /* keep fallback */ }
  }

  // Calculate totals if missing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculatedTotal = parsedItems.reduce((acc: number, item: any) => acc + (item.item?.price || item.price || 0) * (item.quantity || 1), 0);

  return {
    ...raw,
    id: raw.orderId || raw.id,
    status: s,
    deliveryStatus: d,
    items: parsedItems,
    total: raw.total || raw.totalAmount || calculatedTotal,
    subtotal: raw.subtotal || calculatedTotal,
    customerName: raw.customerName || 'Customer',
    riderName: raw.riderName || raw.deliveryExecutiveName,
    deliveryExecutiveName: raw.deliveryExecutiveName || raw.riderName,
    deliveryExecutiveId: raw.deliveryExecutiveId || raw.riderId,
    
    // Map driver payout fields to what UI expects
    grossPayout: raw.grossPayout || raw.driverGrossPayout,
    payout: raw.payout || raw.driverNetPayout,
    driverCustomerContribution: raw.driverCustomerContribution,
    driverRestaurantContribution: raw.driverRestaurantContribution,
    driverTip: raw.driverTip,
    driverTaxes: raw.driverTaxes,
    
    paymentStatus: raw.paymentStatus,
    refundedAmount: raw.refundedAmount,
  };
});

export type Order = z.infer<typeof orderSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeOrder = (raw: any): Order | undefined => {
  const result = orderSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  } else {
    console.error("Order validation failed:", result.error);
    return undefined;
  }
};
