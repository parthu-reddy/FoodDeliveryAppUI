import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { RefundView } from "./common";
import { RefundCommand } from "./common";
import { Item } from "./common";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/refunds/request",
    alias: "requestRefund",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RefundCommand,
      },
    ],
    response: RefundView,
  },
]);

export const Admin_refund_command_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
