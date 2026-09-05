import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { RefundView } from "./common";
import { RefundCommand } from "./common";
import { Item } from "./common";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/orders/:orderId/partial-refund",
    alias: "initiatePartialRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RefundCommand,
      },
      {
        name: "orderId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: RefundView,
  },
]);

export const Internal_order_refund_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
