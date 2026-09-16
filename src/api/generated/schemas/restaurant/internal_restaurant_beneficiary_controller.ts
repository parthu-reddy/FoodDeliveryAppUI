import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const BeneficiaryResponse = z
  .object({
    accountNumberMasked: z.string(),
    ifsc: z.string(),
    beneficiaryName: z.string(),
    verified: z.boolean(),
    source: z.string(),
  })
  .partial()
  .passthrough();

export const schemas = {
  BeneficiaryResponse,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/restaurants/:restaurantId/beneficiary",
    alias: "getBeneficiary",
    requestFormat: "json",
    parameters: [
      {
        name: "restaurantId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: BeneficiaryResponse,
  },
]);

export const Internal_restaurant_beneficiary_controllerApi = new Zodios(
  endpoints
);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
