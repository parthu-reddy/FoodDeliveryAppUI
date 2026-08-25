import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.string()),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const TopupWalletRequest = z
  .object({ amount: z.number().gte(0.01), gatewayName: z.string().optional() })
  .passthrough();

export const schemas = {
  ApiResponseMapStringString,
  TopupWalletRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/advertisers/:advertiserId/wallet/topups",
    alias: "topupWallet",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TopupWalletRequest,
      },
      {
        name: "advertiserId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "Idempotency-Key",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: ApiResponseMapStringString,
  },
]);

export const Wallet_topup_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
