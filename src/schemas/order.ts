import { z } from 'zod';
import type { OrderStatus, DeliveryStatus } from '../types/backend-enums';
import { cartItemSchema } from './menu';

export const orderSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  status: z.string().optional(),
  deliveryStatus: z.string().optional(),
  items: z.array(cartItemSchema).optional(),

  // Custom UI fields added during normalization
  restaurantId: z.string().optional(),
  customerId: z.string().optional(),
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

  const normalized: Order = {
    ...raw,
    id: raw.orderId || raw.id,
    status: s,
    deliveryStatus: d,
    items: parsedItems,
    total: raw.total || raw.totalAmount || calculatedTotal,
    subtotal: raw.subtotal || calculatedTotal,
    restaurantId: raw.restaurantId,
    customerId: raw.customerId,
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
  return normalized;
});

/**
 * The normalised order the UI works with: the API's fields plus the ones this transform derives --
 * `total`, `subtotal`, uppercased statuses, `items` parsed out of `itemsJson`.
 *
 * Declared explicitly rather than inferred. `z.infer` of a `.transform((raw: any) => ({ ...raw }))`
 * resolves to `any`, so `Order` silently accepted `{}` -- and `{ id: 12345, status: {} }` -- across
 * the 28 files that use it. Returning this type from the transform makes the spread checked.
 */
export interface Order {
  /**
   * Always present. The generated OrderResponse marks `id` required, so the API always sends
   * one, and the transform resolves `raw.orderId || raw.id`.
   */
  id: string;
  orderId?: string;
  /**
   * Always present. Typed as the enum because that is what every consumer expects; the transform
   * uppercases the API value, and the API only emits valid members. The `|| ''` fallback in the
   * transform is the one case this does not cover -- an order with no status at all.
   */
  status: OrderStatus;
  /** Always present. Same reasoning as `status`. */
  deliveryStatus: DeliveryStatus;
  /** Always present: parsed from itemsJson or defaulted to []. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  /** Always present: required on the generated OrderResponse, so the API always sends it. */
  restaurantId: string;
  /** Always present: required on the generated OrderResponse, so the API always sends it. */
  customerId: string;
  /** Always present: defaults to 'Customer'. */
  customerName: string;
  /** Always present: falls back to the computed line-item total. */
  subtotal: number;
  /** Always present: falls back to the computed line-item total. */
  total: number;
  totalAmount?: number;
  deliveryExecutiveName?: string;
  riderName?: string;
  riderId?: string;
  timestamp?: string;
  paymentStatus?: string;
  refundedAmount?: number;
  deliveryExecutiveId?: string;
  driverCustomerContribution?: number;
  driverRestaurantContribution?: number;
  driverTip?: number;
  driverTaxes?: number;
  driverGrossPayout?: number;
  driverNetPayout?: number;
  grossPayout?: number;
  payout?: number;
  itemsJson?: string;
  /**
   * `.passthrough()` keeps unrecognised API fields. Deliberately `any`, not `unknown`: these were
   * `any` before, and narrowing them is a separate cleanup from giving the declared fields a type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [extra: string]: any;
}

/**
 * Turns a raw API order into the shape the UI reads.
 *
 * This is not optional decoration: the API sends `totalAmount` but no `total`, `subtotal` or
 * `customerName`, and every component reads those. Passing a raw response straight into state left
 * them undefined -- invisible until `Order` stopped being `any`.
 */
export const normalizeOrder = (raw: unknown): Order => orderSchema.parse(raw);
