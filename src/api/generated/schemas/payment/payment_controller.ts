import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RefundRequest = z
  .object({
    gatewayOrderId: z.string(),
    amountInInr: z.number(),
    reason: z.string().optional(),
  })
  .passthrough();
const CreateOrderRequest = z
  .object({
    internalOrderId: z
      .string()
      .regex(
        /^([a-zA-Z0-9_]+_)?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/
      ),
    amountInInr: z.number(),
    customerPhone: z.string().optional(),
  })
  .passthrough();

export const schemas = {
  RefundRequest,
  CreateOrderRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/payments/refund",
    alias: "refundOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RefundRequest,
      },
      {
        name: "gateway",
        type: "Query",
        schema: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/payments/create-order",
    alias: "createOrder",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateOrderRequest,
      },
      {
        name: "gateway",
        type: "Query",
        schema: z.enum(["RAZORPAY", "CASHFREE", "VYAPAR"]),
      },
    ],
    response: z.any(),
  },
]);

export const Payment_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
