import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LedgerStatementLineDto = z
  .object({
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid(),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "CLAWBACK",
      "PAYOUT_TRANSFER",
      "CASH_COLLECTED",
      "CASH_REMITTED",
      "STORE_CREDIT",
    ]),
    amount: z.number(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    createdAt: z.string().datetime({ offset: true }),
    description: z.string(),
    payoutId: z.string().uuid(),
    payoutStatus: z.string(),
    settled: z.boolean(),
  })
  .partial()
  .passthrough();
const AdminOrderMoney = z
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
    ledgerLines: z.array(LedgerStatementLineDto),
  })
  .partial()
  .passthrough();

export const schemas = {
  LedgerStatementLineDto,
  AdminOrderMoney,
};

const endpoints = makeApi([
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
