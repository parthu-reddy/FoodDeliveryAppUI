import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const PennyDropWebhook = z
  .object({
    brandId: z.string().uuid(),
    beneficiaryName: z.string(),
    status: z.string(),
    registeredBrandName: z.string(),
  })
  .partial()
  .passthrough();
const GstinRequest = z
  .object({
    brandId: z.string().uuid().optional(),
    gstin: z.string(),
    brandName: z.string(),
  })
  .passthrough();
const BankAccountRequest = z
  .object({
    brandId: z.string().uuid().optional(),
    accountNumber: z.string(),
    ifscCode: z.string(),
    brandName: z.string(),
  })
  .passthrough();

export const schemas = {
  PennyDropWebhook,
  GstinRequest,
  BankAccountRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/verification/brands/webhooks/penny-drop",
    alias: "handlePennyDropWebhook",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: PennyDropWebhook,
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/verification/brands/gstin",
    alias: "verifyGstin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GstinRequest,
      },
    ],
    response: z.any(),
  },
  {
    method: "post",
    path: "/api/v1/verification/brands/bank-account",
    alias: "verifyBankAccount",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BankAccountRequest,
      },
    ],
    response: z.any(),
  },
]);

export const Brand_verification_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
