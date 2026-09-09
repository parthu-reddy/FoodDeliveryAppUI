import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { LedgerStatementLineDto } from "./common";

export const RefundLine = z
  .object({
    id: z.string().uuid(),
    amount: z.number(),
    status: z.string(),
    destination: z.string(),
    faultType: z.string(),
    reasonCode: z.string(),
    gatewayRefundId: z.string(),
    failureReason: z.string(),
    requestedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const AdminOrderMoney = z
  .object({
    orderId: z.string().uuid(),
    totalAmount: z.number(),
    foodCost: z.number(),
    deliveryFee: z.number(),
    customerPlatformFee: z.number(),
    restaurantPayout: z.number(),
    restaurantPlatformFee: z.number(),
    restaurantDeliveryContribution: z.number(),
    driverGrossPayout: z.number(),
    driverTaxes: z.number(),
    driverNetPayout: z.number(),
    platformBonus: z.number(),
    sgst: z.number(),
    cgst: z.number(),
    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD"]),
    paymentStatus: z.enum([
      "INITIATED",
      "SUCCESS",
      "FAILED",
      "PENDING_COLLECTION",
      "COLLECTED",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
      "REFUND_PENDING",
      "REFUND_FAILED",
    ]),
    gatewayName: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
    gatewayOrderId: z.string(),
    refunds: z.array(RefundLine),
    ledgerLines: z.array(LedgerStatementLineDto),
  })
  .partial()
  .passthrough();

export const schemas = {
  RefundLine,
  AdminOrderMoney,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/orders/:orderId/money",
    alias: "getOrderMoney",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: AdminOrderMoney,
  },
]);

export const Admin_money_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
